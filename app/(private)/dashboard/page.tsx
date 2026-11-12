import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions, getIdentity } from '@/lib/auth';
import { db } from '@/lib/db';
import { modules, departments } from '@/lib/catalog';
export default async function Dashboard() {
  const identity = getIdentity(await getServerSession(authOptions))!;
  const [clients, leads, projects, tasks, invoices, recent] = await Promise.all([
    db.agencyRecord.count({ where: { tenantId: identity.tenantId, kind: 'clientes', status: 'ATIVO' } }),
    db.agencyRecord.count({ where: { tenantId: identity.tenantId, kind: 'leads' } }),
    db.agencyRecord.count({ where: { tenantId: identity.tenantId, kind: 'projetos', status: { not: 'ENTREGUE' } } }),
    db.agencyRecord.count({ where: { tenantId: identity.tenantId, kind: 'tarefas', status: { not: 'CONCLUIDO' } } }),
    db.agencyRecord.findMany({ where: { tenantId: identity.tenantId, kind: 'financeiro', status: 'PAGO' }, select: { valueCents: true } }),
    db.agencyRecord.findMany({ where: { tenantId: identity.tenantId }, orderBy: { updatedAt: 'desc' }, take: 8 })
  ]);
  const received = invoices.reduce((s,x)=>s+(x.valueCents||0),0)/100;
  return <section>
    <div className="pageHeader"><div><div className="eyebrow">VISÃO EXECUTIVA</div><h1>Centro de Comando</h1><p>Indicadores consolidados dos departamentos da agência.</p></div><span className="pill">● Base conectada</span></div>
    <div className="metricGrid">
      {[['Clientes ativos',clients],['Leads cadastrados',leads],['Projetos abertos',projects],['Tarefas pendentes',tasks]].map(([label,value])=><div className="metric" key={label}><small>{label}</small><strong>{value}</strong></div>)}
    </div>
    <div className="featureRow"><div className="panel"><div className="panelHeading"><h2>Recebimentos registrados</h2><span>Histórico total</span></div><strong className="money">{received.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><p className="muted">Apenas valores lançados e marcados como pagos. Não representa conciliação bancária automática.</p></div>
      <div className="panel"><div className="panelHeading"><h2>Estrutura operacional</h2><span>Setores</span></div><strong className="money">{departments.length-1}</strong><p className="muted">16 departamentos operacionais e direção geral.</p></div>
    </div>
    <div className="panel"><div className="panelHeading"><h2>Atividade recente</h2><span>Últimos registros atualizados</span></div>
      <div className="tableWrap"><table><thead><tr><th>Registro</th><th>Módulo</th><th>Status</th></tr></thead><tbody>
        {recent.length ? recent.map(r=><tr key={r.id}><td>{r.title}</td><td><Link href={'/modulos/'+r.kind}>{(modules as Record<string,{name:string}>)[r.kind]?.name||r.kind}</Link></td><td><span className="status">{r.status.replaceAll('_',' ')}</span></td></tr>) : <tr><td colSpan={3} className="muted">Nenhum registro ainda. Comece cadastrando seus clientes.</td></tr>}
      </tbody></table></div>
    </div>
  </section>;
}
