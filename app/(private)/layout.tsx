import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { Shell } from '@/components/shell';
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const identity = getIdentity(session);
  if (!identity) redirect('/login');
  const [user, tenant] = await Promise.all([
    db.user.findFirst({ where: { id: identity.id, tenantId: identity.tenantId, active: true } }),
    db.tenant.findUnique({ where: { id: identity.tenantId } })
  ]);
  if (!user || !tenant) redirect('/login');
  return <Shell name={user.name} role={user.role} tenant={tenant.name}>{children}</Shell>;
}
