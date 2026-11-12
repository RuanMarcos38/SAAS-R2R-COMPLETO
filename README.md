# R2R — Centro de Comando da Agência

Plataforma web inicial para administração da **R2R Marketing Digital** com 16 áreas operacionais, CRM, propostas, contratos, projetos, Kanban, campanhas, conteúdo, atendimento, financeiro e catálogo de 30 automações.

> **Estado:** MVP funcional de gestão e cadastros. **Não** é produto final homologado nem automação 100% integrada. As integrações Meta, Google Ads, WhatsApp, gateways, IA, publicação social, NF e emissão fiscal **ainda não estão implementadas**.

## Requisitos

Node.js 20 ou 22; npm; Docker com Compose (ou PostgreSQL 16). Ambiente com variáveis seguras. Não versionar .env.

## Instalação local

```bash
cp .env.example .env
# Alterar SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, NEXTAUTH_SECRET e AUTOMATION_SECRET.
docker compose up -d
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abrir http://localhost:3000 e entrar com as credenciais configuradas no .env.

**Atenção:** `prisma db push` é apropriado apenas para ambiente de desenvolvimento inicial. Para produção, criar e revisar migrations com `prisma migrate dev`, versioná-las e usar `prisma migrate deploy` em implantação controlada.

## Arquitetura

- Next.js App Router, TypeScript e React.
- PostgreSQL e Prisma, relacionamentos isolados por `tenantId`.
- NextAuth Credentials com bcrypt, sessão JWT e verificação de autorização no servidor.
- API autenticada e validada por Zod: `GET/POST /api/records/:kind` e `PATCH/DELETE /api/records/:kind/:id`.
- Registro de eventos de auditoria, páginas de módulos, Kanban e painel executivo.
- Catálogo de 30 workflows documentados; 4 com implementação inicial.
- Endpoint de rotina `POST /api/automations/run` protegido por `x-automation-secret`; requer agendamento externo.

## Áreas de negócio

Direção; Comercial; Growth; Customer Success; Projetos; Tráfego; SEO; Design; Social Media; Desenvolvimento; Automação; CRM; BI; Financeiro; RH; Jurídico; Segurança.

Todos os módulos operacionais compartilham uma estrutura de registro flexível em `AgencyRecord`. Isto é intencional no MVP; antes de escala, migrar financeiros, contratos e dados especializados para modelos normalizados.

## Workflows disponíveis

- **WF-04:** início de deduplicação por validação das referências de clientes (não é deduplicação de e-mails/telefones).
- **WF-09:** quando um contrato muda de status para ATIVO via API, um projeto de onboarding é criado.
- **WF-12:** apuração de tarefas com SLA vencido.
- **WF-30:** consolidação de métricas executivas em logs de execução.

Os workflows restantes estão **planejados**, não são simulados como executados. Consultar `/automacoes` para o catálogo.

Exemplo de execução da rotina (sem gravar a chave no histórico do shell, utilizar um gerenciador de segredos em produção):

```bash
curl -X POST http://localhost:3000/api/automations/run -H "x-automation-secret: $AUTOMATION_SECRET"
```

## Governança e regras de segurança

- Nenhum cadastro cruzado entre empresas via API; cada consulta é filtrada por tenant.
- MASTER / DIRECTOR podem excluir; demais perfis têm permissões limitadas.
- Senhas armazenadas como hash bcrypt; não enviar senhas em formulários de clientes.
- Operações relevantes geram eventos de auditoria.
- Em produção, habilitar HTTPS, MFA via provedor de identidade, rate limit/WAF, backups testados, filas, rotação de segredos e monitoramento.
- **Limitações atuais:** não existe gestão de usuários via interface; exclusões são definitivas; ausência de testes automatizados de integração com banco e proteção anti-brute-force; autorização por função deve ser refinada por departamento e cliente; pagamentos são lançamentos manuais e não conciliações bancárias.

## Roadmap detalhado

Veja [docs/PLANO-DIRETOR.md](docs/PLANO-DIRETOR.md) e [docs/ACEITE.md](docs/ACEITE.md). Não publicar em produção sem homologar as condições de segurança e integração.

## Estado de entrega

Código e telas publicáveis no repositório. Os requisitos externos, credenciais, testes end-to-end, migrações versionadas, homologação e deploy continuam pendentes. Não há dados demonstrativos inventados.
