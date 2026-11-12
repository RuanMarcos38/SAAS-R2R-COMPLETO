'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
type Message={id:string;role:string;content:string};
type Job={id:string;department:string;title:string;status:string;output?:string|null;error?:string|null};
type Thread={id:string;title:string};
const labels:Record<string,string>={QUEUED:'Na fila',RUNNING:'Executando',COMPLETED:'Entregue',AWAITING_APPROVAL:'Aguardando sua aprovação',REJECTED:'Recusada',FAILED:'Falhou'};
export function DirectorConsole({canApprove}:{canApprove:boolean}){
 const [threads,setThreads]=useState<Thread[]>([]);
 const [threadId,setThreadId]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [jobs,setJobs]=useState<Job[]>([]);
 const [draft,setDraft]=useState('');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [recording,setRecording]=useState(false);const [speaking,setSpeaking]=useState(false);
 const [autoSend,setAutoSend]=useState(true);const [autoSpeak,setAutoSpeak]=useState(true);
 const [voiceMode,setVoiceMode]=useState<'browser'|'natural'>('browser');
 const [transcribing,setTranscribing]=useState(false);const [lastTranscript,setLastTranscript]=useState('');
 const audioPlayer=useRef<HTMLAudioElement|null>(null);
 const audioUrl=useRef<string|null>(null);
 const uploadRef=useRef<HTMLInputElement|null>(null);
 const mediaRef=useRef<MediaRecorder|null>(null);const chunksRef=useRef<Blob[]>([]);
 const audioStream=useRef<MediaStream|null>(null);
 const endRef=useRef<HTMLDivElement|null>(null);
 const refreshThreads=useCallback(async()=>{
  const r=await fetch('/api/director',{cache:'no-store'});if(r.ok){const d=await r.json();setThreads(d.threads)}
 },[]);
 const refresh=useCallback(async(id:string)=>{
   const r=await fetch('/api/director/threads/'+id,{cache:'no-store'});
   if(r.ok){const d=await r.json();setMessages(d.messages);setJobs(d.jobs)}
 },[]);
 useEffect(()=>{void refreshThreads()},[refreshThreads]);
 useEffect(()=>{if(threadId)void refresh(threadId)},[threadId,refresh]);
 useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth',block:'nearest'})},[messages.length]);
 useEffect(()=>{if(!threadId)return;const timer=setInterval(()=>{void refresh(threadId)},15000);return()=>clearInterval(timer)},[threadId,refresh]);
 useEffect(()=>()=>{window.speechSynthesis?.cancel();audioPlayer.current?.pause();if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);mediaRef.current?.stop();audioStream.current?.getTracks().forEach(t=>t.stop())},[]);
 function stopVoice(){
   audioPlayer.current?.pause();audioPlayer.current=null;
   window.speechSynthesis?.cancel();
   setSpeaking(false);
 }
 function speakBrowser(text:string){
   if(!('speechSynthesis' in window)){setError('O navegador não suporta leitura em voz alta.');return}
   const utterance=new SpeechSynthesisUtterance(text.slice(0,3500));
   utterance.lang='pt-BR';utterance.rate=1;
   utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);
   const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('pt-br'));
   if(voice)utterance.voice=voice;
   setSpeaking(true);window.speechSynthesis.speak(utterance);
 }
 async function speak(text:string){
   stopVoice();
   if(voiceMode==='browser'){speakBrowser(text);return}
   try{
     setSpeaking(true);
     const response=await fetch('/api/director/audio/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text.slice(0,2500),voice:'coral'})});
     if(!response.ok)throw new Error('Voz natural indisponível');
     const blob=await response.blob();
     if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);
     const url=URL.createObjectURL(blob);audioUrl.current=url;
     const audio=new Audio(url);audioPlayer.current=audio;
     audio.onended=()=>setSpeaking(false);audio.onerror=()=>setSpeaking(false);
     await audio.play();
   }catch{setSpeaking(false);speakBrowser(text)}
 }
 async function sendMessage(content:string){
   const text=content.trim();if(text.length<2)return;
   setBusy(true);setError('');setDraft('');
   try{
    const response=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,...(threadId?{threadId}:{})})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha na comunicação');
    setThreadId(data.threadId);await refresh(data.threadId);await refreshThreads();
    if(data.reply&&autoSpeak)void speak(data.reply);
   }catch(e){setError(e instanceof Error?e.message:'Falha ao conversar com Diretor');setDraft(text)}
   finally{setBusy(false)}
 }
 async function send(e:React.FormEvent){
   e.preventDefault();if(busy||!draft.trim())return;
   await sendMessage(draft);
 }
 async function transcribeAudio(blob:Blob,fileName:string){
   if(blob.size<100||blob.size>10_000_000){setError('Envie uma gravação de até 10 MB.');return}
   setTranscribing(true);setBusy(true);setError('');
   try{
     const form=new FormData();form.append('audio',blob,fileName);
     const response=await fetch('/api/director/audio/transcribe',{method:'POST',body:form});
     const result=await response.json();if(!response.ok)throw new Error(result.error||'Transcrição falhou');
     const text=String(result.text||'').trim();
     if(!text)throw new Error('Não foi possível reconhecer sua fala');
     setLastTranscript(text);
     if(autoSend)await sendMessage(text);
     else setDraft(prev=>prev?prev+' '+text:text);
   }catch(e){setError(e instanceof Error?e.message:'Erro na transcrição')}
   finally{setBusy(false);setTranscribing(false)}
 }
 async function startRecording(){
  setError('');
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){setError('Seu navegador não oferece gravação. Use HTTPS e permita o microfone.');return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});audioStream.current=stream;chunksRef.current=[];
   const mime=MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':'';
   const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);mediaRef.current=rec;
   rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
   rec.onstop=async()=>{
    setRecording(false);stream.getTracks().forEach(t=>t.stop());audioStream.current=null;
    const kind=mime||rec.mimeType;
    const extension=kind.includes('mp4')?'mp4':kind.includes('ogg')?'ogg':'webm';
    const blob=new Blob(chunksRef.current,{type:kind});
    await transcribeAudio(blob,'gravacao.'+extension);
   };
   rec.start();setRecording(true);
  }catch{setError('Não foi possível acessar o microfone.')}
 }
 function stopRecording(){mediaRef.current?.state==='recording'&&mediaRef.current.stop()}
 async function decision(job:Job,action:'approve'|'reject'){
   const r=await fetch('/api/director/jobs/'+job.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});
   const data=await r.json();if(!r.ok)setError(data.error||'Falha na aprovação');else if(threadId)await refresh(threadId);
 }
 return <div className="directorGrid">
   <aside className="directorThreads">
      <div className="panelHeading"><h2>Conversas</h2><button className="ghostBtn" onClick={()=>{setThreadId(null);setMessages([]);setJobs([]);setError('')}}>+ Nova</button></div>
      {threads.map(t=><button key={t.id} className={'threadItem '+(t.id===threadId?'selected':'')} onClick={()=>setThreadId(t.id)}>{t.title}</button>)}
      {!threads.length&&<p className="muted">Nenhuma conversa ainda.</p>}
   </aside>
   <section className="directorConversation">
     <div className="directorWelcome"><div className={'directorLogo '+(recording?'directorLive':'')}>R</div><div><strong>Diretor-Geral IA</strong><div className="muted">Orquestra os 16 especialistas • Português do Brasil</div></div><span className="status">{recording?'Ouvindo...':transcribing?'Transcrevendo...':busy?'Planejando...':speaking?'Respondendo...':'Pronto para conversar'}</span></div>
     <div className="directorMessages">
       {!messages.length&&<div className="directorEmpty"><h2>O que você precisa executar hoje?</h2><p>Peça estratégias, diagnósticos, planos e delegação de tarefas. O diretor registra a operação e apresenta resultados.</p>
         <div className="suggestionRow">{['Faça um diagnóstico da minha agência','Delegue um plano comercial para este mês','Prepare um resumo executivo das operações'].map(s=><button key={s} onClick={()=>setDraft(s)}>{s}</button>)}</div>
       </div>}
       {messages.map(m=><article key={m.id} className={'chatMessage '+(m.role==='user'?'mine':'ai')}>
         <div className="chatSender">{m.role==='user'?'Você':'Diretor-Geral IA'}</div>
         <div className="chatText">{m.content}</div>
         {m.role==='assistant'&&<button className="linkBtn" onClick={()=>speak(m.content)}>🔊 Ouvir resposta</button>}
       </article>)}
       <div ref={endRef}/>
     </div>
     {error&&<p className="error" role="alert">{error}</p>}
     <div className="voiceCommandBar">
       <div className={'voiceOrb '+(recording?'isListening':speaking?'isSpeaking':'')} aria-hidden="true"><span/></div>
       <div className="voiceCommandTitle"><strong>{recording?'Gravando sua orientação':transcribing?'Interpretando áudio':busy?'Diretor processando sua solicitação':speaking?'Diretor respondendo':'Comando de voz'}</strong><small>{recording?'Toque em parar para enviar a transcrição':'Diga o que deseja analisar, delegar ou executar'}</small></div>
       <label className="voiceToggle"><input type="checkbox" checked={autoSend} onChange={e=>setAutoSend(e.target.checked)}/> Enviar após transcrever</label>
       <label className="voiceToggle"><input type="checkbox" checked={autoSpeak} onChange={e=>setAutoSpeak(e.target.checked)}/> Responder em áudio</label>
       <select aria-label="Tipo de voz" value={voiceMode} onChange={e=>setVoiceMode(e.target.value as 'browser'|'natural')}><option value="browser">Voz do navegador</option><option value="natural">Voz natural OpenAI</option></select>
       {speaking&&<button type="button" className="ghostBtn" onClick={stopVoice}>Parar áudio</button>}
     </div>
     {lastTranscript&&<div className="voiceTranscript"><strong>Último áudio reconhecido:</strong> {lastTranscript}</div>}
     <form className="directorInput" onSubmit={send}>
       <button type="button" className={'micBtn '+(recording?'rec':'')} disabled={busy} onClick={()=>recording?stopRecording():void startRecording()} title={recording?'Parar gravação':'Falar com o diretor'}>{recording?'■':'🎙'}</button>
       <input ref={uploadRef} type="file" accept="audio/webm,audio/mp4,audio/mpeg,audio/wav,audio/ogg,.m4a" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)void transcribeAudio(f,f.name);e.target.value=''}}/>
       <button type="button" className="ghostBtn" disabled={busy||recording} onClick={()=>uploadRef.current?.click()} aria-label="Enviar arquivo de áudio" title="Enviar áudio gravado">Áudio</button>
       <textarea aria-label="Mensagem para Diretor-Geral" placeholder="Converse com o diretor e delegue tarefas..." maxLength={6000} value={draft} onChange={e=>setDraft(e.target.value)} rows={2}/>
       <button className="primaryBtn" disabled={busy||draft.trim().length<2}>{busy?'Processando...':'Enviar'}</button>
     </form>
     <small className="voiceNotice">A opção de envio automático transmite o áudio transcrito ao Diretor e pode criar delegações internas. A voz natural requer API OpenAI. Ações externas continuam restritas a integrações e permissões autorizadas.</small>
   </section>
   <aside className="directorJobs"><h2>Delegações e entregas</h2><p className="muted">Trabalhos realizados pelos agentes especializados.</p>
    {!jobs.length&&<div className="emptyCol">Nenhuma tarefa delegada nesta conversa.</div>}
    {jobs.map(job=><article key={job.id} className="agentJobCard"><strong>{job.title}</strong><small>{job.department}</small><span className="status">{labels[job.status]||job.status}</span>
      {job.output&&<details><summary>Ver entrega</summary><pre className="agentOutput">{job.output}</pre></details>}
      {job.error&&<small className="error">{job.error}</small>}
      {job.status==='AWAITING_APPROVAL'&&canApprove&&<div className="buttonRow"><button className="primaryBtn" onClick={()=>void decision(job,'approve')}>Aprovar produção</button><button className="ghostBtn" onClick={()=>void decision(job,'reject')}>Recusar</button></div>}
    </article>)}
   </aside>
 </div>;
}
