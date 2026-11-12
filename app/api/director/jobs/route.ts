import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET(){
  const identity=getIdentity(await getServerSession(authOptions));
  if(!identity)return NextResponse.json({error:'Não autenticado'},{status:401});
  const jobs=await db.agentJob.findMany({where:{tenantId:identity.tenantId,requesterId:identity.id},orderBy:{createdAt:'desc'},take:80});
  return NextResponse.json({jobs});
}
