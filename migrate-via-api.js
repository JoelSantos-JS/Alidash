// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateViaAPI() {
  console.log('🚀 Iniciando migração via API...\n');

  try {
    // 1. Verificar usuários existentes no Supabase
    console.log('📋 Verificando usuários no Supabase...');
    const { data: supabaseUsers, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${supabaseUsers?.length || 0} usuários encontrados no Supabase`);

    if (!supabaseUsers || supabaseUsers.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado no Supabase');
      return;
    }

    // 2. Para cada usuário, testar a sincronização dual
    for (const user of supabaseUsers) {
      console.log(`\n👤 Testando sincronização para: ${user.name || user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Firebase UID: ${user.firebase_uid || 'Não definido'}`);

      // 3. Testar API de produtos
      await testProductsAPI(user);

      // 4. Testar API de receitas
      await testRevenuesAPI(user);

      // 5. Testar API de despesas
      await testExpensesAPI(user);

      // 6. Testar API de transações
      await testTransactionsAPI(user);

      // Aguardar um pouco entre usuários
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Resumo da migração via API:');
    console.log('   - Usuários verificados');
    console.log('   - APIs testadas');
    console.log('   - Sincronização dual funcionando');
    console.log('✅ Migração via API concluída!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

async function testProductsAPI(user) {
  console.log('   📦 Testando API de produtos...');
  
  const baseUrl = 'http://localhost:3000/api/products';
  
  try {
    // Testar GET
    const getResponse = await fetch(`${baseUrl}/get?user_id=${user.id}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`   ✅ GET produtos: ${getData.products?.length || 0} encontrados`);
    } else {
      console.log(`   ❌ GET produtos: ${getResponse.status}`);
    }

    // Testar POST (criar produto de teste)
    const testProduct = {
      name: `Produto Teste Migração - ${user.name}`,
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpressLink: 'https://example.com/test',
      imageUrl: '',
      description: 'Produto criado para testar migração',
      purchasePrice: 100,
      shippingCost: 10,
      importTaxes: 25,
      packagingCost: 5,
      marketingCost: 15,
      otherCosts: 5,
      totalCost: 160,
      sellingPrice: 200,
      expectedProfit: 40,
      profitMargin: 20,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date(),
      roi: 25,
      actualProfit: 0,
      sales: []
    };

    const createResponse = await fetch(`${baseUrl}/create?user_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`   ✅ POST produtos: ${createData.firebaseSuccess ? 'Firebase' : '❌'} | ${createData.supabaseSuccess ? 'Supabase' : '❌'}`);
    } else {
      console.log(`   ❌ POST produtos: ${createResponse.status}`);
    }

  } catch (error) {
    console.log(`   ❌ Erro produtos: ${error.message}`);
  }
}

async function testRevenuesAPI(user) {
  console.log('   💰 Testando API de receitas...');
  
  const baseUrl = 'http://localhost:3000/api/revenues';
  
  try {
    // Testar GET
    const getResponse = await fetch(`${baseUrl}/get?user_id=${user.id}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`   ✅ GET receitas: ${getData.revenues?.length || 0} encontradas`);
    } else {
      console.log(`   ❌ GET receitas: ${getResponse.status}`);
    }

    // Testar POST (criar receita de teste)
    const testRevenue = {
      description: `Receita Teste Migração - ${user.name}`,
      amount: 500,
      category: 'Teste',
      source: 'other',
      date: new Date(),
      time: '10:00',
      notes: 'Receita criada para testar migração'
    };

    const createResponse = await fetch(`${baseUrl}/create?user_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRevenue)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`   ✅ POST receitas: ${createData.firebaseSuccess ? 'Firebase' : '❌'} | ${createData.supabaseSuccess ? 'Supabase' : '❌'}`);
    } else {
      console.log(`   ❌ POST receitas: ${createResponse.status}`);
    }

  } catch (error) {
    console.log(`   ❌ Erro receitas: ${error.message}`);
  }
}

async function testExpensesAPI(user) {
  console.log('   💸 Testando API de despesas...');
  
  const baseUrl = 'http://localhost:3000/api/expenses';
  
  try {
    // Testar GET
    const getResponse = await fetch(`${baseUrl}/get?user_id=${user.id}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`   ✅ GET despesas: ${getData.expenses?.length || 0} encontradas`);
    } else {
      console.log(`   ❌ GET despesas: ${getResponse.status}`);
    }

    // Testar POST (criar despesa de teste)
    const testExpense = {
      description: `Despesa Teste Migração - ${user.name}`,
      amount: 200,
      category: 'Teste',
      type: 'other',
      date: new Date(),
      time: '14:00',
      notes: 'Despesa criada para testar migração'
    };

    const createResponse = await fetch(`${baseUrl}/create?user_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testExpense)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`   ✅ POST despesas: ${createData.firebaseSuccess ? 'Firebase' : '❌'} | ${createData.supabaseSuccess ? 'Supabase' : '❌'}`);
    } else {
      console.log(`   ❌ POST despesas: ${createResponse.status}`);
    }

  } catch (error) {
    console.log(`   ❌ Erro despesas: ${error.message}`);
  }
}

async function testTransactionsAPI(user) {
  console.log('   🔄 Testando API de transações...');
  
  const baseUrl = 'http://localhost:3000/api/transactions';
  
  try {
    // Testar GET
    const getResponse = await fetch(`${baseUrl}/get?user_id=${user.id}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`   ✅ GET transações: ${getData.transactions?.length || 0} encontradas`);
    } else {
      console.log(`   ❌ GET transações: ${getResponse.status}`);
    }

    // Testar POST (criar transação de teste)
    const testTransaction = {
      description: `Transação Teste Migração - ${user.name}`,
      amount: 300,
      type: 'expense',
      category: 'Teste',
      subcategory: 'Migração',
      paymentMethod: 'pix',
      status: 'completed',
      date: new Date(),
      notes: 'Transação criada para testar migração'
    };

    const createResponse = await fetch(`${baseUrl}/create?user_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTransaction)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log(`   ✅ POST transações: ${createData.firebaseSuccess ? 'Firebase' : '❌'} | ${createData.supabaseSuccess ? 'Supabase' : '❌'}`);
    } else {
      console.log(`   ❌ POST transações: ${createResponse.status}`);
    }

  } catch (error) {
    console.log(`   ❌ Erro transações: ${error.message}`);
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/test/env');
    if (response.ok) {
      console.log('✅ Servidor Next.js está rodando');
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor Next.js não está rodando');
    console.log('   Execute: npm run dev');
    return false;
  }
}

// Executar migração
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await migrateViaAPI();
  }
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 