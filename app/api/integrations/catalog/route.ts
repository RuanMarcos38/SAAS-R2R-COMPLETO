import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 const rows=await db.aiProviderConnection.findMany({
  where:{tenantId:identity.tenantId},select:{provider:true,enabled:true,verifiedAt:true}
 });
 const ai=(provider:string,env:boolean)=>{
  const row=rows.find(p=>p.provider===provider);
  return {configured:row?row.enabled:env,verified:Boolean(row?.verifiedAt)};
 };
 const openai=ai('openai',Boolean(process.env.OPENAI_API_KEY));
 const claude=ai('anthropic',Boolean(process.env.ANTHROPIC_API_KEY));
 const items=[
  {id:'openai',name:'OpenAI / ChatGPT API',category:'Modelos de IA e voz',...openai,active:openai.configured,detail:'Modelo por agente, transcrição e voz sintética',route:'/ia-provedores'},
  {id:'claude',name:'Anthropic / Claude API',category:'Modelos de IA',...claude,active:claude.configured,detail:'Modelo por agente e planejamento',route:'/ia-provedores'},
  {id:'n8n',name:'n8n',category:'Orquestração e automações',configured:Boolean(process.env.N8N_R2R_NOTIFY_WEBHOOK&&process.env.N8N_R2R_WEBHOOK_TOKEN),verified:false,active:false,detail:'Webhook privado de notificações internas; requer workflow ativo e teste de recebimento',route:null},
  {id:'whatsapp',name:'WhatsApp Business Platform',category:'Mensagens',configured:false,verified:false,active:false,detail:'Requer WABA, número, webhooks e permissões Meta; não conectado por login WhatsApp Web',route:null},
  {id:'evolution',name:'Evolution API',category:'Mensagens',configured:false,verified:false,active:false,detail:'Serviço existente no EasyPanel; integração segura com este SaaS ainda pendente',route:null},
  {id:'meta',name:'Meta Ads / Instagram',category:'Marketing',configured:false,verified:false,active:false,detail:'Requer OAuth, tokens, permissões e contas de anúncios; gastos exigem aprovação',route:null},
  {id:'google',name:'Google Ads / Analytics',category:'Marketing e BI',configured:false,verified:false,active:false,detail:'Requer OAuth e acesso autorizado aos recursos',route:null},
  {id:'email',name:'E-mail transacional',category:'Comunicação',configured:false,verified:false,active:false,detail:'Requer provedor, domínio autenticado e gerenciamento de opt-out',route:null}
 ];
 return NextResponse.json({items},{headers:{'Cache-Control':'no-store'}});
}
