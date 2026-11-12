import { NextRequest,NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { agentDepartments, agentNames, requestAI } from '@/lib/director';
import { resolveAI } from '@/lib/ai-providers';

export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:NextRequest){
 const secret=process.env.AUTOMATION_SECRET||'';
 const provided=request.headers.get('x-automation-secret')||'';
 if(secret.length<24||provided.length!==secret.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(secret)))
   return NextResponse.json({error:'Não autorizado'},{status:401});

 const awaiting=await db.agentJob.findMany({where:{status:'QUEUED',attempts:{lt:3}},orderBy:{createdAt:'asc'},take:3});
 const results:{id:string;status:string}[]=[];
 for(const job of awaiting){
   let ai;
   try { ai=await resolveAI(job.tenantId,job.department); }
   catch { results.push({id:job.id,status:'PROVIDER_UNCONFIGURED'}); continue; }
   const claimed=await db.agentJob.updateMany({where:{id:job.id,status:'QUEUED',attempts:{lt:3}},data:{status:'RUNNING',startedAt:new Date(),attempts:{increment:1}}});
   if(!claimed.count)continue;
   const specialist=agentDepartments.indexOf(job.department as typeof agentDepartments[number]);
   const specialistName=specialist>=0?agentNames[specialist]:'Especialista R2R';
   try{
     const context=await db.agencyRecord.findMany({
       where:{tenantId:job.tenantId,kind:{in:['clientes','leads','projetos','tarefas','financeiro','campanhas']}},
       select:{kind:true,title:true,status:true,valueCents:true},orderBy:{updatedAt:'desc'},take:40
     });
     const prompt=`Você é ${specialistName}, especialista responsável por ${job.department} da R2R Marketing Digital.
Produza uma entrega de trabalho concreta, em português brasileiro: diagnóstico, plano de ação, documento, roteiro ou relatório conforme a tarefa.
Use apenas dados do contexto. Não invente métricas, contatos, campanhas ou fontes.
Você não acessa sistemas externos e não deve afirmar que publicou, enviou, cobrou ou modificou serviços.
Se a tarefa depende de integração externa, explique exatamente o que falta e prepare etapas operacionais.
É proibido tomar ações financeiras, enviar mensagens ou publicar sem integração e aprovação.
Formate a entrega com título, análise, execução proposta, evidências e pendências.`;
     const content=await requestAI(prompt,`Tarefa atribuída: ${job.title}\nInstruções: ${job.instructions}\nDados internos autorizados do tenant (JSON): ${JSON.stringify(context).slice(0,11500)}`,undefined,ai);
     await db.$transaction(async tx=>{
       await tx.agentJob.update({where:{id:job.id},data:{status:'COMPLETED',output:content.slice(0,25000),finishedAt:new Date(),error:null}});
       await tx.agencyRecord.create({data:{
         tenantId:job.tenantId,kind:'tarefas',status:'A_FAZER',title:`Revisar entrega IA: ${job.title}`.slice(0,200),
         description:content.slice(0,10000),data:{sourceJobId:job.id,department:job.department}
       }});
       await tx.auditEvent.create({data:{tenantId:job.tenantId,actorId:job.requesterId,kind:'AGENT_JOB',targetId:job.id,action:'COMPLETED'}});
     });
     results.push({id:job.id,status:'COMPLETED'});
   }catch(e){
     const error=e instanceof Error?e.message:'Falha inesperada';
     const attempts=job.attempts+1;
     await db.agentJob.update({where:{id:job.id},data:{status:attempts<3?'QUEUED':'FAILED',error:error.slice(0,500),finishedAt:attempts<3?null:new Date()}});
     results.push({id:job.id,status:attempts<3?'RETRY_PENDING':'FAILED'});
   }
 }
 return NextResponse.json({processed:results.length,results});
}
