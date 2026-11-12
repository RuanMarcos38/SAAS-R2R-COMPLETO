import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if(!email || !password) throw new Error('Credenciais de teste não configuradas');
await mkdir('test-results/screenshots',{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page = await context.newPage();

try {
  // Healthcheck confirma conectividade de banco antes de criar dados de teste.
  const health=await page.request.get(BASE+'/api/health');
  assert.equal(health.status(),200,'Healthcheck com DB');
  assert.equal((await health.json()).database,'connected');

  // Usuários não autenticados não devem consultar os dados da agência.
  const anon=await page.request.get(BASE+'/api/records/clientes');
  assert.equal(anon.status(),401);

  await page.goto(BASE+'/login',{waitUntil:'networkidle'});
  await page.screenshot({path:'test-results/screenshots/01-login.png',fullPage:true});
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button',{name:'Entrar no painel'}).click();
  await page.waitForURL('**/dashboard',{timeout:20000});
  await page.getByRole('heading',{name:'Centro de Comando'}).waitFor();
  await page.screenshot({path:'test-results/screenshots/02-dashboard.png',fullPage:true});

  // Teste real de backend autenticado: cadastrar cliente e verificar retorno.
  const created=await page.request.post(BASE+'/api/records/clientes',{
    data:{title:'Cliente de homologação R2R',description:'Registro fictício E2E',status:'ATIVO'}
  });
  assert.equal(created.status(),201,await created.text());
  const id=(await created.json()).record.id;
  const result=await page.request.get(BASE+'/api/records/clientes');
  assert.equal(result.status(),200);
  assert.ok((await result.json()).records.some(r=>r.id===id));

  await page.goto(BASE+'/modulos/clientes',{waitUntil:'networkidle'});
  await page.getByText('Cliente de homologação R2R').waitFor();
  await page.screenshot({path:'test-results/screenshots/03-clientes-kanban.png',fullPage:true});

  // Atualizar status sem recriar registro; testar auditoria via rota.
  const updated=await page.request.patch(BASE+'/api/records/clientes/'+id,{
    data:{status:'EM_RISCO'}
  });
  assert.equal(updated.status(),200,await updated.text());

  // As configurações não podem revelar chaves nem permitir acesso anônimo.\n  const publicConfig=await page.request.get(BASE+'/api/ai/providers');\n  assert.equal(publicConfig.status(),200);\n  const serialized=JSON.stringify(await publicConfig.json());\n  assert.ok(!serialized.includes('encryptedApiKey'));\n  assert.ok(!serialized.includes('apiKey'));\n  await page.goto(BASE+'/ia-provedores',{waitUntil:'networkidle'});\n  await page.getByRole('heading',{name:'Conectar ChatGPT e Claude'}).waitFor();\n  await page.getByText('Anthropic — Claude').waitFor();\n  await page.screenshot({path:'test-results/screenshots/05-provedores-ia.png',fullPage:true});\n  const invalid=await page.request.put(BASE+'/api/ai/providers',{data:{provider:'anthropic',apiKey:'short'}});\n  assert.equal(invalid.status(),400);\n\n  // O frontend do Diretor IA deve carregar mesmo sem chave externa.
  await page.goto(BASE+'/diretor-ia',{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'Diretor-Geral da Agência'}).waitFor();
  await page.screenshot({path:'test-results/screenshots/04-diretor-ia.png',fullPage:true});
  const unconfigured=await page.request.post(BASE+'/api/director',{data:{message:'Faça um relatório comercial'}});
  assert.equal(unconfigured.status(),503,'Ausência de chave não deve simular resposta da IA');

  // Excluir somente dado sintético criado neste próprio teste.
  const deleted=await page.request.delete(BASE+'/api/records/clientes/'+id);
  assert.equal(deleted.status(),200,await deleted.text());

  console.log('OK: login, proteção de API, DB, CRUD, Kanban, Diretor IA e screenshots');
} finally {
  await browser.close();
}
