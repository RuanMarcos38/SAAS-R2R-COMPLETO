import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { defaults,encryptKey,isProvider,providers } from '@/lib/ai-providers';
export const runtime='nodejs';
const input=z.object({provider:z.enum(['openai','anthropic']),apiKey:z.string().trim().min(16).max(512).optional(),
 model:z.string().regex(/^[a-zA-Z0-9._-]{2,100}$/).optional(),enabled:z.boolean().optional()}).strict();
async function authorize(){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return {error:NextResponse.json({error:'Não autenticado'},{status:401})};
 const user=await db.user.findFirst({where:{id:identity.id,tenantId:identity.tenantId,active:true}});
 if(!user)return {error:NextResponse.json({error:'Usuário indisponível'},{status:403})};
 return {identity};
}
export async function GET(){
 const auth=await authorize();if(auth.error)return auth.error;
 const tenantId=auth.identity!.tenantId;
 const rows=await db.aiProviderConnection.findMany({where:{tenantId},select:{provider:true,model:true,enabled:true,verifiedAt:true,updatedAt:true}});
 return NextResponse.json({providers:providers.map(provider=>{
  const row=rows.find(r=>r.provider===provider);
  const env=provider==='openai'?Boolean(process.env.OPENAI_API_KEY):Boolean(process.env.ANTHROPIC_API_KEY);
  return {provider,configured:Boolean(row)||env,source:row?'vault':env?'environment':'none',enabled:row?.enabled??env,model:row?.model||defaults[provider],verifiedAt:row?.verifiedAt||null};
 })});
}
export async function PUT(request:NextRequest){
 const auth=await authorize();if(auth.error)return auth.error;
 const identity=auth.identity!;
 if(identity.role!=='MASTER')return NextResponse.json({error:'Somente administrador master'},{status:403});
 const data=input.safeParse(await request.json().catch(()=>null));
 if(!data.success)return NextResponse.json({error:'Dados de conexão inválidos'},{status:400});
 const {provider,apiKey,model,enabled}=data.data;
 const tenantId=identity.tenantId;
 const exists=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId,provider}}});
 if(!exists&&!apiKey)return NextResponse.json({error:'Informe uma chave para criar conexão'},{status:400});
 if(apiKey&&!process.env.AI_CREDENTIALS_ENCRYPTION_KEY)return NextResponse.json({error:'Defina AI_CREDENTIALS_ENCRYPTION_KEY no servidor'},{status:503});
 let encrypted:string|undefined;
 try {encrypted=apiKey?encryptKey(apiKey):undefined}
 catch{return NextResponse.json({error:'Chave de criptografia do servidor inválida'},{status:503})}
 const saved=await db.$transaction(async tx=>{
  const row=await tx.aiProviderConnection.upsert({
   where:{tenantId_provider:{tenantId,provider}},
   create:{tenantId,provider,encryptedApiKey:encrypted!,model:model||defaults[provider],enabled:enabled??true},
   update:{...(encrypted?{encryptedApiKey:encrypted,verifiedAt:null}:{}),...(model?{model,verifiedAt:null}:{}),...(enabled!==undefined?{enabled}:{})}
  });
  await tx.auditEvent.create({data:{tenantId,actorId:identity.id,kind:'AI_PROVIDER',targetId:row.id,action:'UPDATE_CONNECTION',metadata:{provider,rotated:Boolean(apiKey),enabled:row.enabled}}});
  return row;
 });
 return NextResponse.json({provider:saved.provider,configured:true,enabled:saved.enabled,model:saved.model,verifiedAt:saved.verifiedAt});
}
