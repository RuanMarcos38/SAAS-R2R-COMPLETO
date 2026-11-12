/**
 * Integração opcional com workflow privado de n8n.
 * Emite apenas metadados técnicos após uma conclusão interna.
 * Não executa mensagens, campanhas, alterações financeiras nem expõe informações de clientes.
 */
export async function notifyInternalJob(data:{tenantId:string;jobId:string;department:string}):Promise<'disabled'|'sent'|'failed'>{
 const destination=process.env.N8N_R2R_NOTIFY_WEBHOOK;
 const token=process.env.N8N_R2R_WEBHOOK_TOKEN;
 if(!destination||!token)return 'disabled';
 let url:URL;
 try { url=new URL(destination); }catch{return 'failed'}
 if(url.protocol!=='https:')return 'failed';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
 try {
  const response=await fetch(url,{method:'POST',signal:controller.signal,headers:{
   'Content-Type':'application/json','X-R2R-Webhook-Token':token
  },body:JSON.stringify({
   event:'agent.job.completed',version:1,
   tenantId:data.tenantId,jobId:data.jobId,department:data.department
  }),cache:'no-store'});
  return response.ok?'sent':'failed';
 }catch{return 'failed'}finally{clearTimeout(timeout)}
}
