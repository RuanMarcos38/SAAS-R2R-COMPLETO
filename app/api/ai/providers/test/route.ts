import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { invokeAI,resolveAI } from '@/lib/ai-providers';
export const runtime='nodejs';
const schema=z.object({provider:z.enum(['openai','anthropic'])});
export async function POST(request:NextRequest){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 if(identity.role!=='MASTER')return NextResponse.json({error:'Sem permissão'},{status:403});
 const data=schema.safeParse(await request.json().catch(()=>null));
 if(!data.success)return NextResponse.json({error:'Provedor inválido'},{status:400});
 const tenantId=identity.tenantId,provider=data.data.provider;
 try{
  // Diagnóstico direto: não altera a preferência do Diretor.
  const item=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId,provider}}});
  let ai;
  if(item){
   if(!item.enabled)return NextResponse.json({error:'Ative o provedor antes de testar'},{status:409});
   const {decryptKey}=await import('@/lib/ai-providers');
   ai={provider,model:item.model,apiKey:decryptKey(item.encryptedApiKey)};
  } else {
   const env=provider==='openai'?process.env.OPENAI_API_KEY:process.env.ANTHROPIC_API_KEY;
   if(!env)return NextResponse.json({error:'Credenciais não configuradas'},{status:503});
   ai={provider,model:provider==='openai'?(process.env.OPENAI_TEXT_MODEL||'gpt-5-mini'):(process.env.ANTHROPIC_TEXT_MODEL||'claude-sonnet-4-5'),apiKey:env};
  }
  const output=await invokeAI(ai,'Responda em português brasileiro com uma única palavra.', 'Escreva OK.');
  if(item){
   await db.aiProviderConnection.update({where:{id:item.id},data:{verifiedAt:new Date()}});
  }
  await db.auditEvent.create({data:{tenantId,actorId:identity.id,kind:'AI_PROVIDER',targetId:item?.id||null,action:'TEST_SUCCESS',metadata:{provider}}});
  return NextResponse.json({ok:true,provider,model:ai.model,message:output.slice(0,120)});
 }catch(err){
  return NextResponse.json({error:err instanceof Error?err.message:'Falha de conexão'},{status:502});
 }
}
