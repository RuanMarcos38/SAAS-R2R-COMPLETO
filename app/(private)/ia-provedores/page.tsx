import { getServerSession } from 'next-auth';
import { authOptions,getIdentity } from '@/lib/auth';
import { AIProviderSettings } from '@/components/ai-provider-settings';
export default async function ProvidersPage(){
 const identity=getIdentity(await getServerSession(authOptions))!;
 return <section><div className="pageHeader"><div><div className="eyebrow">INTEGRAÇÃO DE INTELIGÊNCIA ARTIFICIAL</div><h1>Conectar ChatGPT e Claude</h1><p>Configure as APIs e defina o modelo para cada agente da agência.</p></div></div><AIProviderSettings isMaster={identity.role==='MASTER'}/></section>;
}
