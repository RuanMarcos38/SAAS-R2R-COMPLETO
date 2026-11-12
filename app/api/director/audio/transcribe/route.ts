import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptKey } from '@/lib/ai-providers';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 const user=await db.user.findFirst({where:{id:identity.id,tenantId:identity.tenantId,active:true},select:{id:true}});
 if(!user)return NextResponse.json({error:'Usuário desativado'},{status:403});
 const stored=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId:identity.tenantId,provider:'openai'}}});
 if(stored&&!stored.enabled)return NextResponse.json({error:'Ative o provedor OpenAI para transcrição'},{status:503});
 let key=process.env.OPENAI_API_KEY;
 if(stored){try{key=decryptKey(stored.encryptedApiKey)}catch{return NextResponse.json({error:'Credencial de transcrição indisponível'},{status:503})}}
 if(!key)return NextResponse.json({error:'Configure a chave OpenAI para transcrição no menu Provedores de IA'},{status:503});
 const type=request.headers.get('content-type')||'';
 if(!type.includes('multipart/form-data'))return NextResponse.json({error:'Envie áudio em formulário'},{status:415});
 const body=await request.formData().catch(()=>null);
 const file=body?.get('audio');
 if(!(file instanceof File) || file.size<100 || file.size>10_000_000 || !['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg','audio/x-m4a'].some(t=>file.type.startsWith(t)))
   return NextResponse.json({error:'Áudio inválido. Limite: 10 MB em formato permitido.'},{status:400});
 const data=new FormData();
 data.append('file',file,file.name||'gravacao.webm');data.append('model',process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-transcribe');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
 try{
   const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:data,signal:controller.signal,cache:'no-store'});
   if(!response.ok)return NextResponse.json({error:'Transcrição indisponível'},{status:502});
   const value=await response.json() as {text?:string};
   return NextResponse.json({text:(value.text||'').slice(0,6000)});
 }catch{return NextResponse.json({error:'Erro de comunicação com serviço de voz'},{status:502})}
 finally{clearTimeout(timeout)}
}
