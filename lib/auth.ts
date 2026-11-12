import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [CredentialsProvider({
    name: 'Email e senha',
    credentials: { email: { label: 'E-mail', type: 'email' }, password: { label: 'Senha', type: 'password' } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;
      const user = await db.user.findUnique({ where: { email: credentials.email.trim().toLowerCase() } });
      if (!user?.active || !(await bcrypt.compare(credentials.password, user.passwordHash))) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId };
    }
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.uid = user.id; token.role = (user as any).role; token.tenantId = (user as any).tenantId; }
      return token;
    },
    async session({ session, token }) {
      (session as any).identity = { id: token.uid, role: token.role, tenantId: token.tenantId };
      return session;
    }
  }
};
export type Identity = { id: string; role: string; tenantId: string };
export function getIdentity(session: any): Identity | null {
  const v = session?.identity;
  return v?.id && v?.tenantId && v?.role ? v as Identity : null;
}
