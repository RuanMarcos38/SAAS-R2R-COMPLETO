import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflows, implementedWorkflows } from '@/lib/catalog';
export async function GET() {
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const runs = await db.automationRun.findMany({ where: { tenantId: identity.tenantId }, orderBy: { createdAt: 'desc' }, take: 30 });
  return NextResponse.json({ workflows: workflows.map(([id,name,trigger]) => ({
    id,name,trigger,implementation: implementedWorkflows.includes(id as typeof implementedWorkflows[number]) ? 'BASE_IMPLEMENTADA' : 'PLANEJADO'
  })), runs });
}
