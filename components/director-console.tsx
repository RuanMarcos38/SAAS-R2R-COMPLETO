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
 useEffect(()=>()=>{window.speechSynthesis?.cancel();mediaRef.current?.stop();audioStream.current?.getTracks().forEach(t=>t.stop())},[]);
 function speak(text:string){
   if(!('speechSynthesis' in window)){setError('Este navegador não suporta leitura em voz alta.');return}
   window.speechSynthesis.cancel();
   const utterance=new SpeechSynthesisUtterance(text.slice(0,3500));
   utterance.lang='pt-BR';utterance.rate=1;utterance.onend=()=>setSpeaking(false);utterance.onerror=()=>setSpeaking(false);
   const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('pt-br'));
   if(voice)utterance.voice=voice;
   setSpeaking(true);window.speechSynthesis.speak(utterance);
 }
 async function send(e:React.FormEvent){
   e.preventDefault();if(!draft.trim()||busy)return;
   const content=draft.trim();setBusy(true);setError('');setDraft('');
   try{
    const r=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:content,...(threadId?{threadId}:{})})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||'Falha na comunicação');
    setThreadId(data.threadId);await refresh(data.threadId);await refreshThreads();
    if(data.reply)speak(data.reply);
   }catch(e){setError(e instanceof Error?e.message:'Falha ao conversar com diretor');setDraft(content)}
   finally{setBusy(false)}
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
    const blob=new Blob(chunksRef.current,{type:mime||rec.mimeType});if(blob.size<100)return;
    setBusy(true);
    try{
      const form=new FormData();form.append('audio',blob,'gravacao.webm');
      const response=await fetch('/api/director/audio/transcribe',{method:'POST',body:form});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Transcrição falhou');
      setDraft(prev=>prev?prev+' '+result.text:result.text);
    }catch(e){setError(e instanceof Error?e.message:'Erro na transcrição')}finally{setBusy(false)}
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
     <div className="directorWelcome"><div className="directorLogo">R</div><div><strong>Diretor-Geral IA</strong><div className="muted">Orquestra os 16 especialistas • Português do Brasil</div></div></div>
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
     <form className="directorInput" onSubmit={send}>
       <button type="button" className={'micBtn '+(recording?'rec':'')} disabled={busy} onClick={()=>recording?stopRecording():void startRecording()} title={recording?'Parar gravação':'Falar com o diretor'}>{recording?'■':'🎙'}</button>
       <textarea aria-label="Mensagem para Diretor-Geral" placeholder="Converse com o diretor e delegue tarefas..." maxLength={6000} value={draft} onChange={e=>setDraft(e.target.value)} rows={2}/>
       <button className="primaryBtn" disabled={busy||draft.trim().length<2}>{busy?'Processando...':'Enviar'}</button>
     </form>
     <small className="voiceNotice">{speaking?'🔊 Resposta em áudio do dispositivo. ':''}A voz reproduzida é sintética, gerada pelo navegador. A IA não executa ações externas sem conectores autorizados.</small>
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
