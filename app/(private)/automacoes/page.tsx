import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflows, implementedWorkflows } from '@/lib/catalog';
export default async function AutomationsPage(){
 const identity=getIdentity(await getServerSession(authOptions))!;
 const runs=await db.automationRun.findMany({where:{tenantId:identity.tenantId},orderBy:{createdAt:'desc'},take:15});
 return <section><div className="pageHeader"><div><div className="eyebrow">AUTOMAÇÃO E INTELIGÊNCIA</div><h1>Orquestração de Workflows</h1><p>Catálogo de 30 fluxos para a operação integrada.</p></div><span className="pill">4 bases implementadas</span></div>
  <div className="notice"><strong>Status técnico:</strong> WF-04 (deduplicação de cadastro por referência), WF-09 (onboarding contratual), WF-12 (cálculo de SLA vencido) e WF-30 (resumo executivo) possuem implementações iniciais. Os demais são especificações e ainda não estão conectados a serviços externos. O endpoint de rotina exige segredo e agendamento externo.</div>
  <div className="panel"><div className="tableWrap"><table><thead><tr><th>Identificador</th><th>Workflow</th><th>Gatilho previsto</th><th>Situação</th></tr></thead><tbody>{workflows.map(([id,name,trigger])=><tr key={id}><td>{id}</td><td>{name}</td><td>{trigger}</td><td><span className={'status '+(implementedWorkflows.includes(id as typeof implementedWorkflows[number])?'good':'')}>{implementedWorkflows.includes(id as typeof implementedWorkflows[number])?'Base inicial':'Planejado'}</span></td></tr>)}</tbody></table></div></div>
  <div className="panel"><div className="panelHeading"><h2>Últimas execuções registradas</h2></div><div className="tableWrap"><table><thead><tr><th>Workflow</th><th>Data</th><th>Resultado</th></tr></thead><tbody>{runs.length?runs.map(run=><tr key={run.id}><td>{run.workflowId}</td><td>{run.createdAt.toLocaleString('pt-BR')}</td><td>{run.status}</td></tr>):<tr><td colSpan={3}>Nenhuma rotina executada.</td></tr>}</tbody></table></div></div>
 </section>;
}
