import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentDepartments, createDirectorPlan } from '@/lib/director';

export const runtime = 'nodejs';
const bodySchema = z.object({ threadId: z.string().cuid().optional(), message: z.string().trim().min(2).max(6000) });

export async function GET() {
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error:'Não autenticado' }, { status:401 });
  const threads = await db.directorThread.findMany({ where:{ tenantId:identity.tenantId, userId:identity.id }, orderBy:{updatedAt:'desc'}, take:30,
    select:{id:true,title:true,updatedAt:true} });
  return NextResponse.json({ threads });
}
export async function POST(request: NextRequest) {
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error:'Não autenticado' }, {status:401});
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({error:'Configure OPENAI_API_KEY no ambiente do servidor para ativar a IA.'},{status:503});
  const body = bodySchema.safeParse(await request.json().catch(()=>null));
  if (!body.success) return NextResponse.json({error:'Mensagem inválida'},{status:400});
  const user=await db.user.findFirst({where:{id:identity.id,tenantId:identity.tenantId,active:true}});
  if (!user) return NextResponse.json({error:'Usuário desativado'},{status:403});
  const thread=body.data.threadId
    ? await db.directorThread.findFirst({where:{id:body.data.threadId,tenantId:identity.tenantId,userId:identity.id}})
    : await db.directorThread.create({data:{tenantId:identity.tenantId,userId:identity.id,title:body.data.message.slice(0,75)}});
  if(!thread) return NextResponse.json({error:'Conversa não encontrada'},{status:404});
  const [messages, clients, leads, projects, overdue, bills] = await Promise.all([
    db.directorMessage.findMany({where:{threadId:thread.id},orderBy:{createdAt:'desc'},take:16}),
    db.agencyRecord.count({where:{tenantId:identity.tenantId,kind:'clientes',status:'ATIVO'}}),
    db.agencyRecord.count({where:{tenantId:identity.tenantId,kind:'leads'}}),
    db.agencyRecord.count({where:{tenantId:identity.tenantId,kind:'projetos',status:{not:'ENTREGUE'}}}),
    db.agencyRecord.count({where:{tenantId:identity.tenantId,kind:'tarefas',status:{not:'CONCLUIDO'},dueAt:{lt:new Date()}}}),
    db.agencyRecord.aggregate({where:{tenantId:identity.tenantId,kind:'financeiro',status:'PAGO'},_sum:{valueCents:true}})
  ]);
  const history=messages.reverse().map(m=>`${m.role}: ${m.content}`).join('\n').slice(-12000);
  const context=`Dados verificáveis do CRM R2R: clientes ativos=${clients}; leads cadastrados=${leads}; projetos abertos=${projects}; tarefas atrasadas=${overdue}; lançamentos pagos acumulados em centavos=${bills._sum.valueCents||0}. Esse valor NÃO é faturamento mensal nem conciliação bancária.\nHistórico:\n${history}\nProprietário: ${body.data.message}`;
  let plan;
  try { plan=await createDirectorPlan(context); }
  catch(err){console.error('Director AI failure',err);return NextResponse.json({error:'Falha ao consultar a IA. Nenhuma tarefa foi delegada.'},{status:502});}
  const output=await db.$transaction(async tx=>{
    await tx.directorMessage.create({data:{threadId:thread.id,role:'user',content:body.data.message}});
    await tx.directorMessage.create({data:{threadId:thread.id,role:'assistant',content:plan.reply}});
    const jobs=[];
    for(const task of plan.tasks){
      const created=await tx.agentJob.create({data:{
        tenantId:identity.tenantId,threadId:thread.id,requesterId:identity.id,
        department:agentDepartments[task.department-1],title:task.title,instructions:task.instructions,
        requiresApproval:task.requiresApproval,status:task.requiresApproval?'AWAITING_APPROVAL':'QUEUED'
      }});
      await tx.auditEvent.create({data:{tenantId:identity.tenantId,actorId:identity.id,kind:'AGENT_JOB',targetId:created.id,action:task.requiresApproval?'REQUEST_APPROVAL':'QUEUE',metadata:{department:created.department}}});
      jobs.push({id:created.id,title:created.title,department:created.department,status:created.status});
    }
    return jobs;
  });
  return NextResponse.json({threadId:thread.id,reply:plan.reply,jobs:output});
}
