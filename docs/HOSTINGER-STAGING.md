# Implantação segura na VPS Hostinger / EasyPanel

Este roteiro prepara **staging isolado**, e não autoriza publicar em produção ou interferir em serviços existentes.

## 0. Inventário e preservação

Antes de qualquer mudança, registrar: projetos EasyPanel existentes, serviços/containers, portas, domínios, volumes, redes, bancos, consumo de recursos, estado de backups e DNS. Exportar definições atuais e confirmar restauração de um snapshot em ambiente isolado. Não reiniciar VPS, não remover Docker volumes e não executar `docker system prune`.

O painel da Hostinger indica Ubuntu 24.04 + EasyPanel e backups semanais. A renovação da VPS deve ser verificada pelo proprietário.

## 1. Revisões necessárias

- O PR #1 implementa os módulos da agência.
- O PR #2 implementa conversa, delegação e execução interna de IA.
- Esta branch adiciona apenas infraestrutura de staging e endpoint de saúde.
- Validar GitHub Actions e revisão de segurança antes de juntar branches.
- Aplicar em ambiente de teste, nunca sobre bancos de outras aplicações.

## 2. Variáveis e segredos

Criar variáveis via cofre do EasyPanel ou arquivo fora do Git. NÃO inserir senhas na conversa. Usar `deploy/staging.env.example` apenas como lista de nomes. Segredos fortes e exclusivos: DB password, NEXTAUTH_SECRET, AUTOMATION_SECRET, OPENAI_API_KEY.

O arquivo Compose em `deploy/compose.staging.yml` expõe somente o app em `127.0.0.1:3108`. O banco é acessível apenas na rede isolada. Ajustar DNS e proxy TLS no EasyPanel para um subdomínio de staging validado.

## 3. Preparação do banco — NÃO efetuar automaticamente em produção

Na staging recém-criada (e após garantir backup), gerar migration inicial com Prisma e revisar o SQL antes de aplicar. O repositório atual **não possui migrations versionadas**. O procedimento `prisma db push` está restrito a bootstrap de desenvolvimento ou staging vazia e descartável. Usar `prisma migrate deploy` somente depois que as migrations revisadas forem adicionadas ao Git. Nunca rodar `db push` sobre banco compartilhado.

O schema Prisma contém registros da agência, usuários, conversa e tarefas de agentes. Para um banco preexistente é necessário inventário, baseline e plano de alteração sem perda.

## 4. Testes E2E e critérios de aceite

- Login real e logout; negativa de login incorreto; perfis.
- Criar cliente, lead e projeto; mover cards; conferir isolamento entre tenants.
- Criar contrato, ativar e conferir onboarding uma vez.
- Consultar Diretor IA com OPENAI_API_KEY em servidor; verificar mensagem, delegação e log.
- Gravar áudio no navegador HTTPS, transcrever, responder e verificar reprodução em pt-BR.
- Agendar worker, simular falha e retentativa; verificar backlog e recuperação.
- Garantir que aprovações não publiquem anúncios, enviem mensagens ou alterem contas externas sem autorização adicional.
- Validar backup/restauração, TLS, limites de acesso e logs; produzir evidências.

## 5. Ativação de agentes 24/7

O agendador GitHub foi especificado a cada 5 minutos, mas não é um SLA garantido. Para uma operação de produção, preferir worker isolado e fila confiável com monitoramento, alertas, política de custos, backoff e parada de emergência. O worker atual recebe chamadas externas em `/api/director/work` com segredo; ele só faz trabalho interno de IA, não execução nas plataformas Meta/Google.

## 6. Critérios para publicar

Todos os testes concluídos, migrações auditadas, backups restauráveis, segredos configurados, domínio HTTPS validado, rollback documentado e aprovadores cientes do risco. Publicação exige acesso operacional à VPS, indisponível somente com leitura da aba do Chrome nesta conversa.

## Pendências de integração externas

OpenAI API key; Meta Marketing API e permissões de ativos; Google Ads API e OAuth; WhatsApp Business Platform WABA/Phone ID e webhooks; e-mail transacional e opt-out; gateway e conciliação de pagamentos. Nenhuma conexão externa é considerada ativa até teste de ponta a ponta.
