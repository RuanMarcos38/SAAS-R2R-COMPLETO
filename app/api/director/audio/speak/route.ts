import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptKey } from '@/lib/ai-providers';

export const runtime='nodejs';
const input=z.object({text:z.string().trim().min(1).max(2500),voice:z.enum(['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer']).default('coral')}).strict();

export async function POST(request:NextRequest){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity) return NextResponse.json({error:'Não autenticado'},{status:401});
 const user=await db.user.findFirst({where:{id:identity.id,tenantId:identity.tenantId,active:true},select:{id:true}});
 if(!user)return NextResponse.json({error:'Usuário desativado'},{status:403});
 const body=input.safeParse(await request.json().catch(()=>null));
 if(!body.success)return NextResponse.json({error:'Solicitação de áudio inválida'},{status:400});
 const provider=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId:identity.tenantId,provider:'openai'}}});
 if(provider&&!provider.enabled)return NextResponse.json({error:'A conexão OpenAI está desativada'},{status:503});
 let key=process.env.OPENAI_API_KEY;
 if(provider){
  try{key=decryptKey(provider.encryptedApiKey)}catch{return NextResponse.json({error:'Falha ao ler credencial de voz'},{status:503})}
 }
 if(!key)return NextResponse.json({error:'Configure uma chave OpenAI para a voz natural. A voz do navegador permanece disponível.'},{status:503});
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),40000);
 try{
  const response=await fetch('https://api.openai.com/v1/audio/speech',{
   method:'POST',signal:controller.signal,cache:'no-store',
   headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify({model:process.env.OPENAI_TTS_MODEL||'gpt-4o-mini-tts',voice:body.data.voice,input:body.data.text,response_format:'mp3'})
  });
  if(!response.ok)return NextResponse.json({error:'Voz natural indisponível (HTTP '+response.status+')'},{status:502});
  const bytes=await response.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>12_000_000)return NextResponse.json({error:'Arquivo de voz inválido'},{status:502});
  return new NextResponse(bytes,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
 }catch{return NextResponse.json({error:'Erro na geração de áudio'},{status:502})}
 finally{clearTimeout(timeout)}
}
