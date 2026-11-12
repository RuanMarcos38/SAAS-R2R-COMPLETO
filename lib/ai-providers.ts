import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
export type Provider = 'openai' | 'anthropic';
export const providers: Provider[] = ['openai','anthropic'];
export const defaults:Record<Provider,string> = {openai:'gpt-5-mini',anthropic:'claude-sonnet-4-5'};
export function isProvider(value:string):value is Provider {return providers.includes(value as Provider)}
function encryptionKey():Buffer {
  const raw=process.env.AI_CREDENTIALS_ENCRYPTION_KEY||'';
  const key=Buffer.from(raw,'base64');
  if(key.length!==32)throw new Error('AI_CREDENTIALS_ENCRYPTION_KEY deve ser 32 bytes em base64');
  return key;
}
export function encryptKey(secret:string):string {
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const ciphertext=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  return 'v1:'+iv.toString('base64')+':'+cipher.getAuthTag().toString('base64')+':'+ciphertext.toString('base64');
}
export function decryptKey(secret:string):string {
  const [version,iv,tag,ciphertext]=secret.split(':');
  if(version!=='v1'||!iv||!tag||!ciphertext)throw new Error('Credencial cifrada inválida');
  const dec=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64'));
  dec.setAuthTag(Buffer.from(tag,'base64'));
  return Buffer.concat([dec.update(Buffer.from(ciphertext,'base64')),dec.final()]).toString('utf8');
}
export type SelectedAI = {provider:Provider;model:string;apiKey:string};
export async function resolveAI(tenantId:string,agentKey:string):Promise<SelectedAI> {
  // Se há preferência explícita, falha em vez de mudar silenciosamente de provedor.
  const route=await db.aiAgentPreference.findUnique({where:{tenantId_agentKey:{tenantId,agentKey}}});
  const preference=route?.provider||'openai';
  if(!isProvider(preference))throw new Error('Rota de IA desconhecida');
  const record=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId,provider:preference}}});
  if(record){
    if(!record.enabled)throw new Error('Provedor '+preference+' desativado pelo administrador');
    return {provider:preference,model:record.model,apiKey:decryptKey(record.encryptedApiKey)};
  }
  // Compatibilidade com configurações legadas do servidor, sem copiar chaves globais para o banco.
  const env=preference==='openai'?process.env.OPENAI_API_KEY:process.env.ANTHROPIC_API_KEY;
  if(!env)throw new Error('Configure uma chave de API de '+preference+' em Provedores de IA');
  return {provider:preference,model:preference==='openai'?(process.env.OPENAI_TEXT_MODEL||defaults.openai):(process.env.ANTHROPIC_TEXT_MODEL||defaults.anthropic),apiKey:env};
}
function simplifySchema(value:any):any {
  if(Array.isArray(value))return value.map(simplifySchema);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.entries(value).filter(([k])=>!['minimum','maximum','minLength','maxLength'].includes(k)).map(([k,v])=>[k,simplifySchema(v)]));
  }
  return value;
}
export async function invokeAI(ai:SelectedAI,system:string,input:string,format?:Record<string,unknown>):Promise<string>{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),55000);
  try{
    const anthropic=ai.provider==='anthropic';
    const endpoint=anthropic?'https://api.anthropic.com/v1/messages':'https://api.openai.com/v1/responses';
    const headers:Record<string,string>={
      'Content-Type':'application/json',
      'Authorization':'Bearer '+ai.apiKey
    };
    if(anthropic)headers['anthropic-version']=process.env.ANTHROPIC_API_VERSION||'2026-10-21';
    const body=anthropic?{
      model:ai.model,max_tokens:2500,system,messages:[{role:'user',content:input}],
      ...(format?{output_config:{format:{type:'json_schema',schema:simplifySchema((format as any).schema)}}}:{})
    }:{
      model:ai.model,instructions:system,input,max_output_tokens:2500,
      ...(format?{text:{format}}:{})
    };
    const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw new Error('Falha na API '+ai.provider+' (HTTP '+response.status+')');
    const data:any=await response.json();
    const content=anthropic?(data.content||[]).filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n'):
      (data.output||[]).flatMap((e:any)=>e.type==='message'?(e.content||[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text):[]).join('\n');
    if(!content)throw new Error('O provedor '+ai.provider+' não retornou texto');
    return content;
  }finally{clearTimeout(timeout)}
}
