import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { canWrite, isModule, modules } from '@/lib/catalog';
const schema = z.object({
  title: z.string().trim().min(2).max(200), description: z.string().max(10000).optional().default(''),
  status: z.string().max(50).optional(), valueCents: z.number().int().min(0).max(2147483647).nullable().optional(),
  clientId: z.string().max(100).nullable().optional(), assigneeId: z.string().max(100).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional()
});
export async function GET(_request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!isModule(kind)) return NextResponse.json({ error: 'Módulo inexistente' }, { status: 404 });
  const records = await db.agencyRecord.findMany({
    where: { tenantId: identity.tenantId, kind }, orderBy: { updatedAt: 'desc' }, take: 200
  });
  return NextResponse.json({ records });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const identity = getIdentity(await getServerSession(authOptions));
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!isModule(kind)) return NextResponse.json({ error: 'Módulo inexistente' }, { status: 404 });
  if (!canWrite(identity.role, kind)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const status = input.status || modules[kind].statuses[0];
  if (!(modules[kind].statuses as readonly string[]).includes(status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  if (input.clientId && !await db.agencyRecord.findFirst({ where: { id: input.clientId, kind: 'clientes', tenantId: identity.tenantId } }))
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 400 });
  if (input.assigneeId && !await db.user.findFirst({ where: { id: input.assigneeId, tenantId: identity.tenantId, active: true } }))
    return NextResponse.json({ error: 'Responsável inválido' }, { status: 400 });
  const record = await db.$transaction(async tx => {
    const created = await tx.agencyRecord.create({ data: {
      tenantId: identity.tenantId, kind, title: input.title, status,
      description: input.description, valueCents: input.valueCents,
      clientId: input.clientId, assigneeId: input.assigneeId,
      dueAt: input.dueAt ? new Date(input.dueAt) : null
    } });
    await tx.auditEvent.create({ data: { tenantId: identity.tenantId, actorId: identity.id, kind, targetId: created.id, action: 'CREATE' } });
    return created;
  });
  return NextResponse.json({ record }, { status: 201 });
}
