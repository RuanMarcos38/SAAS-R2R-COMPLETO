export const departments = [
'Direção e Governança','Comercial e Prospecção','Marketing e Growth','Atendimento e Sucesso','Gestão de Projetos','Tráfego Pago','SEO e Google Business','Design e Audiovisual','Conteúdo e Social Media','Web e E-commerce','Automação e IA','CRM e Dados','BI e Performance','Financeiro e Cobrança','RH e Capacitação','Jurídico e Compliance','Qualidade e Segurança'
] as const;
export const modules = {
  clientes: { name: 'Clientes', icon: 'Users', statuses: ['ATIVO','ONBOARDING','EM_RISCO','INATIVO'] },
  leads: { name: 'Prospecção', icon: 'Target', statuses: ['NOVO','QUALIFICADO','CONTATO','REUNIAO','PROPOSTA','NEGOCIACAO','GANHO','PERDIDO'] },
  propostas: { name: 'Propostas', icon: 'FileText', statuses: ['RASCUNHO','ENVIADA','ACEITA','RECUSADA'] },
  contratos: { name: 'Contratos', icon: 'FileCheck2', statuses: ['RASCUNHO','EM_ASSINATURA','ATIVO','ENCERRADO'] },
  projetos: { name: 'Projetos', icon: 'FolderKanban', statuses: ['BACKLOG','PLANEJAMENTO','EM_PRODUCAO','REVISAO','APROVACAO','ENTREGUE'] },
  tarefas: { name: 'Tarefas / Kanban', icon: 'ListTodo', statuses: ['BACKLOG','A_FAZER','EM_ANDAMENTO','EM_REVISAO','CONCLUIDO'] },
  campanhas: { name: 'Tráfego Pago', icon: 'Megaphone', statuses: ['PLANEJAMENTO','APROVACAO','ATIVA','PAUSADA','ENCERRADA'] },
  conteudos: { name: 'Conteúdo e Social', icon: 'PenTool', statuses: ['PAUTA','CRIACAO','REVISAO','APROVACAO','AGENDADO','PUBLICADO'] },
  design: { name: 'Design e Audiovisual', icon: 'Palette', statuses: ['BRIEFING','PRODUCAO','REVISAO','APROVADO'] },
  seo: { name: 'SEO e Local', icon: 'Search', statuses: ['AUDITORIA','PLANO','EXECUCAO','MONITORAMENTO'] },
  desenvolvimento: { name: 'Web e E-commerce', icon: 'Code2', statuses: ['REQUISITOS','DESENVOLVIMENTO','TESTES','HOMOLOGACAO','PUBLICADO'] },
  chamados: { name: 'Atendimento', icon: 'MessagesSquare', statuses: ['ABERTO','EM_ATENDIMENTO','AGUARDANDO_CLIENTE','RESOLVIDO'] },
  financeiro: { name: 'Financeiro', icon: 'Wallet', statuses: ['RASCUNHO','PENDENTE','PAGO','ATRASADO','CANCELADO'] },
  rh: { name: 'RH e Capacitação', icon: 'UserRoundCog', statuses: ['PLANEJADO','EM_ANDAMENTO','CONCLUIDO'] },
  juridico: { name: 'Jurídico e LGPD', icon: 'Scale', statuses: ['PENDENTE','EM_ANALISE','APROVADO','ARQUIVADO'] },
  qualidade: { name: 'Qualidade e Segurança', icon: 'ShieldCheck', statuses: ['ABERTO','EM_ANALISE','CORRIGIDO','VALIDADO'] }
} as const;
export type ModuleKey = keyof typeof modules;
export function isModule(value: string): value is ModuleKey { return Object.hasOwn(modules, value); }
export const roles = ['MASTER','DIRECTOR','MANAGER','FINANCE','COLLABORATOR','VIEWER'] as const;
export function canWrite(role: string, kind: ModuleKey) {
  if (role === 'MASTER' || role === 'DIRECTOR' || role === 'MANAGER') return true;
  if (role === 'VIEWER') return false;
  if (role === 'FINANCE') return ['financeiro','contratos','clientes'].includes(kind);
  return !['financeiro','contratos','juridico','rh'].includes(kind);
}
export const workflows = [
['WF-01','Captação inbound','webhook'],['WF-02','Pesquisa comercial','cron'],['WF-03','Enriquecimento','record'],
['WF-04','Deduplicação','record'],['WF-05','Lead scoring','record'],['WF-06','Cadência comercial','cron'],
['WF-07','Reuniões e propostas','record'],['WF-08','Fechamento','payment'],['WF-09','Onboarding','contract'],
['WF-10','Coleta de briefing','record'],['WF-11','Distribuição de tarefas','record'],['WF-12','Monitoramento de SLA','cron'],
['WF-13','Aprovação de entrega','record'],['WF-14','Atendimento multicanal','webhook'],['WF-15','Retenção e NPS','cron'],
['WF-16','Calendário de conteúdo','cron'],['WF-17','Produção criativa','record'],['WF-18','Publicações','schedule'],
['WF-19','Análise de campanhas','cron'],['WF-20','Proteção de orçamento','threshold'],['WF-21','Auditoria SEO','cron'],
['WF-22','Leads dos clientes','webhook'],['WF-23','Cobrança recorrente','cron'],['WF-24','Conciliação','payment'],
['WF-25','Inadimplência','cron'],['WF-26','Relatórios','cron'],['WF-27','Rentabilidade','record'],
['WF-28','Monitor de infraestrutura','monitor'],['WF-29','Backup e recuperação','cron'],['WF-30','Resumo executivo','cron']
] as const;
export const implementedWorkflows = ['WF-04','WF-09','WF-12','WF-30'] as const;
