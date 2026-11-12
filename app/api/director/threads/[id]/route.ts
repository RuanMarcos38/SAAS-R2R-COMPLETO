import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const identity=getIdentity(await getServerSession(authOptions));
  if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
  const {id}=await params;
  const thread=await db.directorThread.findFirst({where:{id,tenantId:identity.tenantId,userId:identity.id}});
  if(!thread)return NextResponse.json({error:'Conversa não encontrada'},{status:404});
  const [messages,jobs]=await Promise.all([
    db.directorMessage.findMany({where:{threadId:id},orderBy:{createdAt:'asc'},take:150}),
    db.agentJob.findMany({where:{threadId:id,tenantId:identity.tenantId},orderBy:{createdAt:'desc'},take:100})
  ]);
  return NextResponse.json({thread,messages,jobs});
}
