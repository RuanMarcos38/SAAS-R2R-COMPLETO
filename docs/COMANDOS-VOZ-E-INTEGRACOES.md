# Central de Comandos R2R — áudio, agentes e ferramentas externas

## Fluxo do usuário
- Acesse `/diretor-ia` em um domínio HTTPS e permita acesso ao microfone.
- Clique no microfone; fale sua orientação e toque novamente para finalizar.
- O áudio é transcrito pela API OpenAI vinculada ao tenant ou pela credencial legada de ambiente. Com **Enviar após transcrever** ativo, a instrução é enviada imediatamente ao Diretor IA; desative para revisar o texto antes de enviar.
- A opção **Responder em áudio** habilita leitura das respostas. **Voz do navegador** usa o sintetizador local; **Voz natural OpenAI** usa o endpoint de TTS e retorna um arquivo MP3 de forma autenticada, com fallback para voz do navegador quando a API estiver indisponível.
- Um arquivo de áudio pode ser enviado sem utilizar o microfone (até 10 MB, formatos suportados).
- A transcrição torna-se mensagem de texto no histórico existente e as tarefas são delegadas aos especialistas. A criação de tarefa **não** significa execução externa concluída.

## APIs e segurança
- `POST /api/director/audio/transcribe`: autenticado, usuário ativo, áudio até 10 MB, provider OpenAI configurado (mesmo que o Diretor use Claude).
- `POST /api/director/audio/speak`: autenticado, usuário ativo, `{text, voice}`, até 2500 caracteres, retorno `audio/mpeg`, sem armazenamento persistente.
- `GET /api/integrations/catalog`: estado de configuração por tenant. `Configurado` não equivale a integrado/homologado. Não retorna senhas, tokens nem dados sensíveis.
- `/api/director/work`: worker existente processa apenas atividades internas e enfileira revisão; exige segredo para execução. Requer scheduler na VPS.
- Ações sensíveis e externas continuam exigindo aprovação, conector específico e trilha de auditoria.

## Notificações n8n opcionais
Definir no ambiente de produção (nunca publicar segredo no Git): `N8N_R2R_NOTIFY_WEBHOOK` para um Webhook HTTPS criado no n8n e `N8N_R2R_WEBHOOK_TOKEN` com token aleatório. Configurar o n8n para validar a header `X-R2R-Webhook-Token` e rejeitar chamadas não autorizadas. O app emite **somente** evento técnico com tenantId, jobId e departamento após conclusão interna; não envia conteúdo, nome, e-mail ou dados do cliente.

Essa notificação é best-effort e **não** garante entrega nem executa outras ferramentas automaticamente. O n8n existente no EasyPanel não é alterado nem considerado conectado até que o workflow seja configurado e validado.

## Integrações de terceiros ainda não concluídas
- Meta Ads e Instagram: OAuth, ativos, permissões de anúncios, aprovações para alteração de orçamento e publicação.
- Google Ads / Analytics: OAuth e permissões oficiais de conta.
- WhatsApp Business Platform: WABA, número, tokens, webhooks e janelas de atendimento / consentimento.
- Evolution API: token/servidor com conectores dedicados e controle de permissão.
- E-mail transacional: provedor e domínio autenticado, consentimento e descadastro.
- Pagamentos: gateway, webhooks idempotentes e aprovação humana para operações financeiras.

## Homologação necessária
1. Confirmar GitHub Actions CI e E2E com PostgreSQL efêmero e captura das telas.
2. Aplicar migration versionada revisada para quaisquer novos schemas antes de implantar em bancos reais.
3. Publicar em serviço isolado de staging HTTPS com URL de testes e banco próprio, não afetando os serviços EasyPanel existentes.
4. Cadastrar credenciais oficiais pelo painel / cofre, nunca via chat ou repositório.
5. Testar fala, upload de arquivo, transcrição real, resposta TTS, roteamento OpenAI/Claude e worker com conectores de integração sob autorização.
6. Somente após homologação, planejar migração e publicação em produção com backup/rollback.
