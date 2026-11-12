# Matriz de aceite e homologação

> Os itens abaixo são **critérios futuros**, não testes já aprovados.

| ID | Caso de teste | Resultado necessário |
|---|---|---|
| SEC-01 | Usuário sem sessão abre dashboard/API | redirecionar ou 401 |
| SEC-02 | Usuário de tenant A consulta registro de tenant B | 404 / sem vazamento |
| SEC-03 | Colaborador tenta excluir | 403 |
| SEC-04 | Login incorreto | acesso negado |
| SEC-05 | Login repetido sob ataque | proteção de taxa implementada |
| SEC-06 | Revogação de sessão ou alteração de papel | acesso refletido imediatamente |
| CRM-01 | Novo lead válido | salvo no tenant correto |
| CRM-02 | Solicitação sem título | 400 |
| OPS-01 | Contrato transita para ATIVO | onboarding criado uma única vez |
| OPS-02 | Contrato ATIVO recebe atualização repetida | sem onboarding duplicado |
| OPS-03 | Kanban move para etapa existente | gravado, auditado |
| OPS-04 | Status inexistente | 400 |
| FIN-01 | Webhook pagamento duplicado | uma única baixa |
| FIN-02 | Lançamento de pagamento | conciliação comprovada |
| AUTO-01 | Requisição sem chave à rotina | 401 |
| AUTO-02 | Rotina válida | logs e resumo |
| BACK-01 | Backup restaurado em ambiente isolado | integridade e acesso verificados |
| DEP-01 | Build + testes automatizados | aprovação CI |
| DEP-02 | Deploy em staging | smoke tests aprovados |
| DEP-03 | Deploy em produção | aprovação, rollback e monitoramento |

## Bloqueadores para declarar 100% operacional
Credenciais de integrações externas; mecanismos de MFA/SSO; rate limit; migrations versionadas; confirmação de domínio e infraestrutura; testes E2E/QA; operação real de faturamento; mecanismos de exclusão lógica e retenção; escalabilidade do motor de automação; controles de permissão por cliente e departamento.

## Segurança de deploy
Nunca colocar tokens no Git. Usar segredos do servidor. Requerer backup, staging e rollback antes de alterar produção.
