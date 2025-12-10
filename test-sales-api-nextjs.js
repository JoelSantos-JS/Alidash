// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000001';

async function checkServer() {
  try {
    const res = await fetch('http://localhost:3000/api/test/env');
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function ensureTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: user, error } = await supabase
    .from('users')
    .select('id, account_type')
    .eq('id', TEST_USER_ID)
    .single();

  if (user && !error) {
    await supabase
      .from('users')
      .update({ account_type: 'pro' })
      .eq('id', TEST_USER_ID);
    return user.id;
  }

  const { data: created, error: createErr } = await supabase
    .from('users')
    .insert({
      id: TEST_USER_ID,
      email: 'test-sales@example.com',
      name: 'Teste Vendas',
      account_type: 'pro'
    })
    .select()
    .single();

  if (createErr) throw new Error('Falha ao criar usuário de teste: ' + createErr.message);
  return created.id;
}

async function createTestProduct(userId) {
  const product = {
    name: 'Produto Teste Venda API',
    category: 'Teste',
    supplier: 'Fornecedor',
    imageUrl: '',
    description: 'Produto criado para testar vendas via API',
    purchasePrice: 50,
    shippingCost: 0,
    importTaxes: 0,
    packagingCost: 0,
    marketingCost: 0,
    otherCosts: 0,
    totalCost: 50,
    sellingPrice: 100,
    expectedProfit: 50,
    profitMargin: 50,
    quantity: 10,
    quantitySold: 0,
    status: 'selling',
    purchaseDate: new Date(),
    roi: 100,
    actualProfit: 0,
    sales: []
  };

  const resp = await fetch(`${BASE_URL}/products/create?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error('Falha ao criar produto: ' + text);
  }

  const getResp = await fetch(`${BASE_URL}/products/get?user_id=${userId}`);
  const getData = await getResp.json();
  const created = (getData.products || []).find(p => p.name === product.name);
  if (!created) throw new Error('Produto recém-criado não encontrado');
  return created.id;
}

async function createSale(userId, productId, quantity) {
  const resp = await fetch(`${BASE_URL}/sales/create?user_id=${userId}&product_id=${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, date: new Date().toISOString() })
  });
  const status = resp.status;
  const bodyText = await resp.text();
  let body;
  try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }
  return { status, body };
}

async function run() {
  console.log('🔎 Verificando servidor Next.js...');
  const ok = await checkServer();
  if (!ok) {
    console.log('❌ Servidor não está rodando em http://localhost:3000');
    console.log('   Execute: npm run dev');
    process.exit(1);
  }

  console.log('👤 Garantindo usuário de teste...');
  const userId = await ensureTestUser();
  console.log('✅ Usuário:', userId);

  console.log('📦 Criando produto de teste...');
  const productId = await createTestProduct(userId);
  console.log('✅ Produto criado:', productId);

  console.log('🛒 Testando venda normal (qtd=1)...');
  const res1 = await createSale(userId, productId, 1);
  console.log('   Status:', res1.status, 'Body:', res1.body);
  if (res1.status !== 200) throw new Error('Venda normal falhou');

  console.log('🧱 Testando proteção de overflow (qtd enorme)...');
  const res2 = await createSale(userId, productId, 1000000000);
  console.log('   Status:', res2.status, 'Body:', res2.body);
  if (res2.status !== 422) throw new Error('Proteção de overflow não acionada como esperado');

  console.log('\n🎉 Teste de vendas via API concluído com sucesso!');
  process.exit(0);
}

run().catch(err => { console.error('💥 Erro no teste:', err); process.exit(1); });
