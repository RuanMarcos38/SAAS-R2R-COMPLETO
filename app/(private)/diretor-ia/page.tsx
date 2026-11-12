import { getServerSession } from 'next-auth';
import { authOptions,getIdentity } from '@/lib/auth';
import { DirectorConsole } from '@/components/director-console';
export default async function DirectorPage(){
 const identity=getIdentity(await getServerSession(authOptions))!;
 return <section><div className="pageHeader"><div><div className="eyebrow">CENTRAL DE INTELIGÊNCIA ARTIFICIAL</div><h1>Diretor-Geral da Agência</h1><p>Converse por texto ou voz, delegue demandas e acompanhe cada entrega.</p></div><span className="pill">16 especialistas</span></div>
 <DirectorConsole canApprove={['MASTER','DIRECTOR'].includes(identity.role)}/></section>;
}
