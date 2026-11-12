# Plano Diretor da Agência R2R

## Visão
Uma agência com 16 áreas, direção central, CRM/ERP, BI, trabalho por processos, automações e agentes de IA com supervisão humana.

## Departamentos: missão, responsabilidades, evidências e indicador
| Setor | Responsabilidades operacionais | Evidências | KPI |
|---|---|---|---|
| Comercial | ICP, pesquisa permitida, qualificação, negociação e fechamento | lead, proposta, contrato | conversão e CAC |
| Growth | canais próprios, testes, parcerias, captação inbound | calendário, campanha, lead | leads qualificados |
| Atendimento | onboarding, suporte, NPS, retenção e expansão | tickets, pesquisa | churn, SLA |
| Projetos | escopo, prioridades, capacidade, cronograma, entregas | tarefas, horas, aceite | prazo, retrabalho |
| Tráfego | auditoria, mensuração, estratégia, mídia, otimização | conta, campanha, relatório | CPA, ROAS |
| SEO | auditorias, indexação, conteúdo e SEO local | checklist, Search Console | orgânico qualificado |
| Design | identidade, peças, edição, revisão e aprovação | briefing, arte, aceite | revisões |
| Social | pauta, criação, agendamento, monitoramento | calendário e post | conversões |
| Web | UX, código, testes, deploy, backup | PR, evidência QA | disponibilidade |
| Automação | mapeamento, webhooks, IA, n8n, filas, logs | execução e log | taxa de sucesso |
| CRM | qualidade dos contatos, consentimentos e distribuição | registro e histórico | completude |
| BI | consolidação, atribuição, painéis, previsão | relatório auditável | atualização |
| Financeiro | contas, contratos, cobrança, impostos e conciliação | faturas e baixas | MRR e margem |
| RH | recrutamento, treinamento e alocação | avaliação e trilha | capacidade |
| Jurídico | contratos, LGPD e riscos | parecer e versão | pendências |
| Segurança | permissões, monitoria, incidentes, backup, auditoria | logs, testes | MTTR |

## POPs — sequência de execução
- **Comercial:** captar > validar base e canal > deduplicar > qualificar > diagnóstico > proposta > reunião > contrato > fechamento.
- **Onboarding:** contrato ativo > validação de condição financeira > criação de cliente/projeto > briefing > acessos delegados > aprovação de escopo > kickoff.
- **Tráfego:** briefing > auditoria > eventos > orçamento autorizado > estrutura > criativos > QA > aprovação > ativação > monitoramento > relatório.
- **Conteúdo:** objetivos > pauta > copy > design > revisão > aceite > agendamento > publicação > análise.
- **Landing page:** requisitos > UX > desenvolvimento > integração CRM > tags > testes > aprovação > implantação > monitoramento.
- **Cobrança:** contrato > conferência de valores > fatura > notificação permitida > webhook confiável > conciliação > registro > documento fiscal.
- **Incidente:** detecção > severidade > contenção > comunicação > recuperação > evidência > análise de causa.

## Ciclo de acompanhamento
Diário: leads, execução, tarefas, chamados e caixa. Semanal: performance, capacidade e entregas. Mensal: margens, recorrência, retenção e governança. Trimestral: estratégia e contratos.

## Catálogo de 30 fluxos
| ID | Processo | Dependência |
|---|---|---|
| WF-01 | Captação inbound | Formulários e webhooks |
| WF-02 | Pesquisa comercial | Fonte de dados permitida |
| WF-03 | Enriquecimento | Provedor autorizado |
| WF-04 | Deduplicação | Regras de identidade |
| WF-05 | Lead scoring | Critérios ICP |
| WF-06 | Cadência comercial | Consentimentos e canal |
| WF-07 | Reuniões e propostas | Agenda e templates |
| WF-08 | Fechamento | Contrato e gateway |
| WF-09 | Onboarding | Contrato ativo |
| WF-10 | Coleta de briefing | Portal do cliente |
| WF-11 | Distribuição de tarefas | Capacidade de equipe |
| WF-12 | Monitoramento SLA | Prazos |
| WF-13 | Aprovação de entrega | Aceite digital |
| WF-14 | Atendimento multicanal | API WhatsApp/e-mail |
| WF-15 | Retenção e NPS | Eventos por contrato |
| WF-16 | Calendário de conteúdo | Calendário editorial |
| WF-17 | Produção criativa | Fila de produção |
| WF-18 | Publicações | APIs e aprovação |
| WF-19 | Análise de campanhas | Meta/Google APIs |
| WF-20 | Proteção de orçamento | Tetos contratuais |
| WF-21 | Auditoria SEO | Search Console e crawler |
| WF-22 | Leads dos clientes | Webhooks e consentimentos |
| WF-23 | Cobrança recorrente | Gateway |
| WF-24 | Conciliação | Webhooks assinados |
| WF-25 | Inadimplência | Política comercial |
| WF-26 | Relatórios | Dados íntegros |
| WF-27 | Rentabilidade | Custos e receitas |
| WF-28 | Monitor de infraestrutura | Telemetria |
| WF-29 | Backup e recuperação | Infra e restauração |
| WF-30 | Resumo executivo | Métricas consolidadas |

## Critérios de automação
Gatilho verificável; entradas validadas; idempotência; versão; permissão; fila de erros; retentativas com backoff; auditoria; observabilidade; desligamento controlado. Ações sensíveis exigem aprovação humana.

## Plano em fases
1. CRM, contratos, autenticação, clientes e tarefas.
2. Atendimento, onboarding e produção.
3. Meta, Google, social, SEO e conteúdo.
4. Pagamentos, conciliação e BI.
5. Multiempresa avançado, agentes especializados, homologação e escala.
