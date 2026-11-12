import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12 || password.includes('replace-with')) {
    throw new Error('Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (mínimo 12 caracteres) antes de executar seed.');
  }
  if (await db.user.findUnique({ where: { email } })) {
    console.log('Admin já existente; nada alterado.'); return;
  }
  const tenant = await db.tenant.create({ data: { name: process.env.SEED_TENANT_NAME || 'R2R Marketing Digital' } });
  await db.user.create({ data: {
    tenantId: tenant.id, email, name: 'Administrador Master', role: 'MASTER',
    passwordHash: await bcrypt.hash(password, 12)
  } });
  console.log('Tenant e administrador criados:', email);
}
main().catch(e => {console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
