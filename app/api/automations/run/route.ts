import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
export async function POST(request: NextRequest) {
  const provided = request.headers.get('x-automation-secret') || '';
  const expected = process.env.AUTOMATION_SECRET || '';
  if (!expected || expected.length < 24 || provided.length !== expected.length ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected)))
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const tenants = await db.tenant.findMany({ select: { id: true } });
  const results = [];
  for (const tenant of tenants) {
    const now = new Date();
    const overdue = await db.agencyRecord.count({ where: {
      tenantId: tenant.id, kind: 'tarefas', dueAt: { lt: now }, status: { not: 'CONCLUIDO' }
    } });
    const [clients, leads, activeProjects, pendingFinance] = await Promise.all([
      db.agencyRecord.count({ where: { tenantId: tenant.id, kind: 'clientes', status: 'ATIVO' } }),
      db.agencyRecord.count({ where: { tenantId: tenant.id, kind: 'leads' } }),
      db.agencyRecord.count({ where: { tenantId: tenant.id, kind: 'projetos', status: { not: 'ENTREGUE' } } }),
      db.agencyRecord.count({ where: { tenantId: tenant.id, kind: 'financeiro', status: 'PENDENTE' } })
    ]);
    const summary = { clients, leads, activeProjects, pendingFinance, overdueTasks: overdue };
    await db.$transaction([
      db.automationRun.create({ data: { tenantId: tenant.id, workflowId: 'WF-12', status: 'SUCCESS', result: { overdue } } }),
      db.automationRun.create({ data: { tenantId: tenant.id, workflowId: 'WF-30', status: 'SUCCESS', result: summary } })
    ]);
    results.push({ tenantId: tenant.id, ...summary });
  }
  return NextResponse.json({ ok: true, results });
}
