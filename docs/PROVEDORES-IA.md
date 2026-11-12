# Integração dos agentes R2R com ChatGPT e Claude

## Como conectar
1. Crie uma chave na plataforma de API OpenAI e/ou no Anthropic Console. **A assinatura ChatGPT Plus e o login pessoal Claude não são API keys e não substituem a contratação de API.**
2. No servidor configure `AI_CREDENTIALS_ENCRYPTION_KEY` usando saída de `openssl rand -base64 32`. Guardar esse segredo de forma persistente, com backup em cofre seguro, nunca no Git. Se perder a chave-mestra, não será possível decifrar as credenciais cadastradas; o administrador terá de substituí-las.
3. Aplique o schema Prisma em um banco de staging vazio e descartável, depois de revisar as mudanças. Em produção, versionar migrations e executar `prisma migrate deploy`, não `db push`.
4. No menu **Conectar ChatGPT / Claude**, cadastre a chave e o modelo de cada provedor. Chaves são cifradas com AES-256-GCM e armazenadas por tenant; a interface nunca revela a chave persistida.
5. Use **Testar conexão** para executar uma consulta efetiva à API configurada. Este teste consome cota do provedor.
6. Atribua os agentes à OpenAI ou Anthropic na tabela de roteamento; o Diretor-Geral também pode usar Claude.
7. Inicie o worker autorizado `POST /api/director/work` com agendamento e `AUTOMATION_SECRET` para gerar entregas internas automaticamente. Sem scheduler não há execução autônoma contínua.

## Segurança
- Configurações só podem ser alteradas por MASTER. Demais usuários podem visualizar status, sem receber segredos.
- Não exibir API keys em logs; mensagens de erro ao usuário não expõem a chave.
- Credenciais cadastradas por empresa (tenant) isoladamente. Chaves globais de ambiente continuam como compatibilidade legada quando não há conexão salva para o provedor.
- Quando um provedor explicitamente atribuído está ausente ou desativado, o agente **não** muda silenciosamente para outro.
- A aprovação de trabalhos sensíveis produz somente documentos e propostas internas. Publicar anúncios, cobrar pagamentos e enviar WhatsApp dependem de conectores oficiais específicos e aprovação humana.
- Também são necessários rate limiting, cotas por tenant, monitoração de custos, segurança de sessão e retenção LGPD antes da produção.

## Integrações
OpenAI: `POST https://api.openai.com/v1/responses` com Bearer e saída JSON estruturada.
Anthropic: `POST https://api.anthropic.com/v1/messages` com Bearer, `anthropic-version` e `output_config.format` para JSON estruturado.
As versões de modelo precisam ser válidas na conta usada; podem ser configuradas no painel.

## Status
Implementado em código: formulários de configuração, armazenamento cifrado, teste de conexão, roteamento por agente, uso real das duas APIs e preservação da fila existente.
Pendente: configurar segredos reais, testes contra contas OpenAI/Anthropic, integração com serviços de marketing, deploy no EasyPanel e homologação completa.
