import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { canWrite, isModule, modules } from '@/lib/catalog';
const schema = z.object({
  title: z.string().trim().min(2).max(200).optional(), description: z.string().max(10000).nullable().optional(),
  status: z.string().max(50).optional(), valueCents: z.number().int().min(0).max(2147483647).nullable().optional(),
  clientId: z.string().nullable().optional(), assigneeId: z.string().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional()
}).strict();
type Params = { params: Promise<{ kind: string; id: string }> };
export async function PATCH(request: NextRequest, { params }: Params) {
  const { kind, id } = await params;
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!isModule(kind)) return NextResponse.json({ error: 'Módulo inexistente' }, { status: 404 });
  if (!canWrite(identity.role, kind)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  const data = parsed.data;
  if (data.status && !(modules[kind].statuses as readonly string[]).includes(data.status))
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  if (data.clientId && !await db.agencyRecord.findFirst({ where: { id: data.clientId, tenantId: identity.tenantId, kind: 'clientes' } }))
    return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
  if (data.assigneeId && !await db.user.findFirst({ where: { id: data.assigneeId, tenantId: identity.tenantId, active: true } }))
    return NextResponse.json({ error: 'Responsável inválido' }, { status: 400 });
  const existing = await db.agencyRecord.findFirst({ where: { id, kind, tenantId: identity.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
  const updated = await db.$transaction(async tx => {
    const record = await tx.agencyRecord.update({ where: { id }, data: {
      ...data, dueAt: data.dueAt === undefined ? undefined : (data.dueAt ? new Date(data.dueAt) : null)
    } });
    await tx.auditEvent.create({ data: {
      tenantId: identity.tenantId, actorId: identity.id, kind, targetId: id, action: 'UPDATE',
      metadata: { fields: Object.keys(data), previousStatus: existing.status, nextStatus: record.status }
    } });
    // Implementação idempotente de onboarding a partir de contrato ativo.
    if (kind === 'contratos' && record.status === 'ATIVO' && existing.status !== 'ATIVO') {
      const prior = await tx.agencyRecord.findFirst({ where: {
        tenantId: identity.tenantId, kind: 'projetos', data: { path: ['sourceContractId'], equals: record.id }
      } });
      if (!prior) await tx.agencyRecord.create({ data: {
        tenantId: identity.tenantId, kind: 'projetos', title: 'Onboarding — ' + record.title,
        status: 'BACKLOG', clientId: record.clientId, data: { sourceContractId: record.id }
      } });
    }
    return record;
  });
  return NextResponse.json({ record: updated });
}
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { kind, id } = await params;
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!isModule(kind)) return NextResponse.json({ error: 'Módulo inexistente' }, { status: 404 });
  if (!['MASTER','DIRECTOR'].includes(identity.role)) return NextResponse.json({ error: 'Somente direção pode excluir' }, { status: 403 });
  const existing = await db.agencyRecord.findFirst({ where: { id, kind, tenantId: identity.tenantId } });
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  await db.$transaction([
    db.auditEvent.create({ data: { tenantId: identity.tenantId, actorId: identity.id, kind, targetId: id, action: 'DELETE', metadata: { title: existing.title } } }),
    db.agencyRecord.delete({ where: { id } })
  ]);
  return NextResponse.json({ success: true });
}
