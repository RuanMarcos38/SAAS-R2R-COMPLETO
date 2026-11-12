import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { isModule } from '@/lib/catalog';
import { RecordBoard } from '@/components/record-board';
export default async function ModulePage({params}:{params:Promise<{kind:string}>}) {
  const {kind}=await params;if(!isModule(kind))notFound();
  const identity=getIdentity(await getServerSession(authOptions))!;
  return <RecordBoard key={kind} kind={kind} role={identity.role}/>;
}
