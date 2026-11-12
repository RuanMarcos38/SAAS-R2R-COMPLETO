import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentDepartments } from '@/lib/director';
const schema=z.object({agentKey:z.string().min(1),provider:z.enum(['openai','anthropic'])}).strict();
const agentKeys=['director',...agentDepartments];
export async function GET(){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 const rows=await db.aiAgentPreference.findMany({where:{tenantId:identity.tenantId},select:{agentKey:true,provider:true}});
 return NextResponse.json({routes:agentKeys.map(agentKey=>({agentKey,provider:rows.find(r=>r.agentKey===agentKey)?.provider||'openai'}))});
}
export async function PUT(request:NextRequest){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 if(identity.role!=='MASTER')return NextResponse.json({error:'Somente administrador master'},{status:403});
 const data=schema.safeParse(await request.json().catch(()=>null));
 if(!data.success||!agentKeys.includes(data.data.agentKey))return NextResponse.json({error:'Roteamento inválido'},{status:400});
 const provider=data.data.provider,agentKey=data.data.agentKey,tenantId=identity.tenantId;
 const exists=await db.aiProviderConnection.findUnique({where:{tenantId_provider:{tenantId,provider}}});
 const env=provider==='openai'?process.env.OPENAI_API_KEY:process.env.ANTHROPIC_API_KEY;
 if((!exists&&!env)||exists&&!exists.enabled)return NextResponse.json({error:'Configure e ative o provedor antes de atribuir'},{status:409});
 await db.$transaction([
  db.aiAgentPreference.upsert({where:{tenantId_agentKey:{tenantId,agentKey}},create:{tenantId,agentKey,provider},update:{provider}}),
  db.auditEvent.create({data:{tenantId,actorId:identity.id,kind:'AI_ROUTING',action:'SET_PROVIDER',metadata:{agentKey,provider}}})
 ]);
 return NextResponse.json({ok:true,agentKey,provider});
}
