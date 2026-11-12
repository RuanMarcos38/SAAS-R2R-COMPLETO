import { NextRequest,NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions,getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const identity=getIdentity(await getServerSession(authOptions));
 if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
 if(!['MASTER','DIRECTOR'].includes(identity.role))return NextResponse.json({error:'Aprovação permitida somente à direção'},{status:403});
 const {id}=await params;
 const input=z.object({action:z.enum(['approve','reject'])}).safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:'Ação inválida'},{status:400});
 const target=input.data.action==='approve'?'QUEUED':'REJECTED';
 const result=await db.$transaction(async tx=>{
   const changed=await tx.agentJob.updateMany({where:{id,tenantId:identity.tenantId,status:'AWAITING_APPROVAL'},data:{status:target,approvedBy:identity.id}});
   if(changed.count)await tx.auditEvent.create({data:{tenantId:identity.tenantId,actorId:identity.id,kind:'AGENT_JOB',targetId:id,action:input.data.action.toUpperCase()}});
   return changed.count;
 });
 if(!result)return NextResponse.json({error:'Tarefa indisponível ou já aprovada'},{status:409});
 return NextResponse.json({id,status:target,notice:'A aprovação libera somente produção interna. Integrações externas exigem conectores específicos.'});
}
