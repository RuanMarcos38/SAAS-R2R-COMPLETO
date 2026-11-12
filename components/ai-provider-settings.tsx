'use client';
import { useCallback,useEffect,useState } from 'react';
type Provider='openai'|'anthropic';
type ProviderState={provider:Provider;configured:boolean;source:string;enabled:boolean;model:string;verifiedAt:string|null};
type AgentRoute={agentKey:string;provider:Provider};
export function AIProviderSettings({isMaster}:{isMaster:boolean}){
 const [providers,setProviders]=useState<ProviderState[]>([]);
 const [routes,setRoutes]=useState<AgentRoute[]>([]);
 const [apiKeys,setApiKeys]=useState<Record<string,string>>({openai:'',anthropic:''});
 const [models,setModels]=useState<Record<string,string>>({});
 const [working,setWorking]=useState<string|null>(null);
 const [feedback,setFeedback]=useState('');
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  const [a,b]=await Promise.all([fetch('/api/ai/providers',{cache:'no-store'}),fetch('/api/ai/routing',{cache:'no-store'})]);
  if(a.ok){const d=await a.json();setProviders(d.providers);setModels(Object.fromEntries(d.providers.map((p:ProviderState)=>[p.provider,p.model])))}
  if(b.ok){const d=await b.json();setRoutes(d.routes)}
 },[]);
 useEffect(()=>{void load()},[load]);
 async function save(provider:Provider,enabled?:boolean){
  setWorking(provider);setFeedback('');setError('');
  const existing=providers.find(p=>p.provider===provider);
  const payload:any={provider,model:models[provider]||existing?.model||'gpt-5-mini'};
  if(apiKeys[provider])payload.apiKey=apiKeys[provider];
  if(enabled!==undefined)payload.enabled=enabled;
  try {
   const result=await fetch('/api/ai/providers',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await result.json();if(!result.ok)throw new Error(data.error||'Não foi possível salvar');
   setApiKeys(k=>({...k,[provider]:''}));setFeedback('Configuração de '+provider+' salva. Faça o teste de conexão.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Erro inesperado')}finally{setWorking(null)}
 }
 async function verify(provider:Provider){
  setWorking(provider);setFeedback('');setError('');
  try{
   const r=await fetch('/api/ai/providers/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider})});
   const result=await r.json();if(!r.ok)throw new Error(result.error||'Teste falhou');
   setFeedback('Conexão real confirmada com '+provider+' usando '+result.model+'.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Falha no teste')}finally{setWorking(null)}
 }
 async function routeAgent(agentKey:string,provider:Provider){
  setWorking(agentKey);setFeedback('');setError('');
  try{
   const r=await fetch('/api/ai/routing',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({agentKey,provider})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'Falha ao alterar');
   setFeedback('Agente '+agentKey+' atribuído a '+provider+'.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Falha no roteamento')}finally{setWorking(null)}
 }
 return <section>
   <div className="notice"><strong>Conexão oficial via API.</strong> A assinatura do ChatGPT ou Claude no navegador não conecta automaticamente ao SaaS. Use uma chave de API OpenAI ou Anthropic. A ferramenta cifra as chaves no banco e nunca as devolve ao navegador. Requer chave-mestra definida no servidor.</div>
   {error&&<p className="error" role="alert">{error}</p>}
   {feedback&&<p className="notice" role="status">{feedback}</p>}
   <div className="providerGrid">{(['openai','anthropic'] as Provider[]).map(provider=>{
    const p=providers.find(s=>s.provider===provider);
    return <div className="panel" key={provider}>
      <div className="panelHeading"><h2>{provider==='openai'?'OpenAI — ChatGPT':'Anthropic — Claude'}</h2><span className={'status '+(p?.configured&&p.enabled?'good':'')}>{p?.configured?(p.enabled?'Configurado':'Desativado'):'Não configurado'}</span></div>
      <p className="muted">Provedor: {provider==='openai'?'platform.openai.com':'platform.claude.com'} | Origem: {p?.source==='vault'?'Cofre interno':p?.source==='environment'?'Servidor':'Nenhuma'}</p>
      <div className="formStack">
       <label>Modelo de texto
        <input value={models[provider]||''} maxLength={100} placeholder={provider==='openai'?'gpt-5-mini':'claude-sonnet-4-5'} onChange={e=>setModels(v=>({...v,[provider]:e.target.value}))} disabled={!isMaster}/>
       </label>
       <label>{p?.configured?'Substituir chave de API (opcional)':'Chave de API'}
        <input type="password" autoComplete="off" placeholder={p?.configured?'•••••••• (mantida até substituir)':'Cole a chave fornecida no Console'} value={apiKeys[provider]} onChange={e=>setApiKeys(k=>({...k,[provider]:e.target.value}))} disabled={!isMaster}/>
       </label>
       <div className="buttonRow" style={{flexWrap:'wrap'}}>
        <button className="primaryBtn" disabled={!isMaster||Boolean(working)} onClick={()=>void save(provider)}>Salvar</button>
        <button className="ghostBtn" disabled={!isMaster||!p?.configured||Boolean(working)} onClick={()=>void verify(provider)}>Testar conexão</button>
        <button className="ghostBtn" disabled={!isMaster||!p?.configured||p?.source!=='vault'||Boolean(working)} onClick={()=>void save(provider,!p?.enabled)}>{p?.enabled?'Desativar':'Ativar'}</button>
       </div>
       <p className="muted">{p?.verifiedAt?'Último teste aprovado: '+new Date(p.verifiedAt).toLocaleString('pt-BR'):'Sem teste confirmado com este provedor.'}</p>
      </div>
    </div>;
   })}</div>
   <div className="panel"><div className="panelHeading"><h2>Distribuição dos funcionários de IA</h2><span>Diretor + 16 especialistas</span></div>
     <p className="muted">Escolha o modelo que executará as instruções de cada agente. Mudanças futuras de provedor não alteram tarefas concluídas.</p>
     <div className="tableWrap"><table><thead><tr><th>Agente</th><th>Provedor escolhido</th></tr></thead><tbody>
      {routes.map(r=><tr key={r.agentKey}><td><strong>{r.agentKey==='director'?'Diretor-Geral IA':r.agentKey}</strong></td>
       <td><select aria-label={'Provedor de '+r.agentKey} value={r.provider} disabled={!isMaster||Boolean(working)} onChange={e=>void routeAgent(r.agentKey,e.target.value as Provider)}>
        <option value="openai">ChatGPT / OpenAI</option><option value="anthropic">Claude / Anthropic</option>
       </select></td></tr>)}
     </tbody></table></div>
   </div>
   {!isMaster&&<p className="muted">Somente Administrador Master pode alterar os provedores e atribuições dos agentes.</p>}
 </section>;
}
