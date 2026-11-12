# Diretoria de Inteligência Artificial R2R

## Referência do modelo
O anúncio https://www.instagram.com/p/DfnsoDkAoeF/ descreve um coordenador central que delega a assistentes e mantém tarefas programadas. A R2R aplica o conceito original, sem copiar identidade ou prometer os resultados do anúncio.

## Implementado nesta entrega
1. Diretor-Geral conversacional com API OpenAI Responses, registros persistentes de conversas e contexto de indicadores internos.
2. Plano estruturado com tarefas encaminhadas a um dos 16 setores.
3. Fila de execução persistente no banco (`AgentJob`), com múltiplas tentativas, proteção contra execução duplicada por mudança de estado e auditoria.
4. 16 perfis especialistas. Cada execução gera entrega por IA e tarefa interna para revisão.
5. Aprovação explícita em tarefas sensíveis pela direção. A aprovação **não** autoriza gasto nem publicação; apenas libera a produção do plano interno.
6. Painel com conversas, jobs, resultados e status; atualização a cada 15 s enquanto a conversa estiver aberta.
7. Áudio: gravação no navegador, transcrição na API `gpt-transcribe`, reprodução da resposta usando síntese de fala do próprio navegador (pt-BR). Não é voz full-duplex e nem voz neural de baixa latência. Browser requer HTTPS e permissão de microfone.
8. Endpoint autenticado de execução batch até 3 tarefas, protegido por AUTOMATION_SECRET. Deve ser chamado por cron confiável (exemplo n8n) 24/7; não é automaticamente agendado ao subir o app.

## Configuração
No servidor, definir `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL` (por padrão `gpt-5-mini`), `OPENAI_TRANSCRIBE_MODEL` (por padrão `gpt-transcribe`), `AUTOMATION_SECRET` (segredo forte).
Fazer migração do Prisma com segurança, depois ativar rotina POST `/api/director/work` com cabeçalho `x-automation-secret`.
Não colocar segredos no frontend, no Git nem em ferramentas de captura.

## Regras de operação
- Diretor tem acesso a contagens verificadas por tenant; especialista recebe até 40 registros recentes de campos limitados do tenant.
- Dados de outros tenants nunca entram nos prompts.
- Respostas do modelo são validadas antes de criar jobs.
- Trabalho nunca é classificado como feito até o worker salvar o resultado.
- Erros retornam status explícitos; podem requerer intervenção.
- Ações externas como publicar anúncios, alterar budgets, enviar WhatsApp, receber PIX ou emitir NF exigem APIs especializadas, autenticação, aprovação e testes de ponta a ponta. Nada disso é simulado como realizado.
- A execução constante depende de infraestrutura 24/7, monitoramento, limites de custo e estratégia de recuperação.

## Pendências reais para versão empresarial
- Integração oficial com Meta/Google, WhatsApp, e-mail, pagamento e n8n.
- Realtime Speech API WebRTC com voz de baixa latência, interrupções e retomada de sessão.
- Jobs com controle dedicado de concorrência por tenant, fila externa, dead-letter queue, backoff e métricas.
- Criação de usuários-agentes com custos, papéis delegados e metas verificadas.
- APIs de operações reais por função, políticas detalhadas, histórico de aprovações, controle de gastos.
- Rate limit, monitoramento, segredos, MFA, testes com banco real e migrações versionadas.
- Testes de regressão, segurança e deploy com rollback.

## Caminho ideal para chegar ao 24/7
Worker externo em infraestrutura sempre ativa → agenda a cada minuto → executa lotes idempotentes → monitora falhas → alerta plantão; integrar posteriormente fila BullMQ/Redis, monitor de uptime e métricas de custos OpenAI.

## Agendamento com GitHub Actions
O arquivo `.github/workflows/director-scheduler.yml` oferece um acionamento a cada cinco minutos **após integração na branch padrão do GitHub**, publicação do SaaS e configuração dos segredos `DIRECTOR_APP_URL` (URL HTTPS do deploy) e `DIRECTOR_AUTOMATION_SECRET` (mesmo valor do `AUTOMATION_SECRET` do servidor). O workflow permite execução manual e falha explicitamente quando os segredos estiverem ausentes. O cron do GitHub Actions é sujeito a atrasos e não garante SLA de 24 horas; uma infraestrutura com fila e workers dedicados continua sendo a opção para operação crítica contínua.
