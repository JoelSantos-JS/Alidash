require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIFix() {
  console.log('🧪 Testando correção da API de criação de transações...\n');

  try {
    // Buscar um usuário de teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuário de teste:', usersError);
      return;
    }

    const testUser = users[0];
    console.log(`👤 Usuário de teste: ${testUser.id}`);

    // Testar criação via API
    console.log('\n📝 Testando criação de transação de despesa via API...');
    
    const transactionData = {
      user_id: testUser.id,
      transaction: {
        id: Date.now().toString(),
        description: 'Teste API corrigida - Despesa',
        amount: 150.75,
        type: 'expense',
        category: 'Alimentação',
        paymentMethod: 'pix',
        status: 'completed',
        date: new Date().toISOString(),
        notes: 'Teste da correção da API',
        isInstallment: false,
        totalInstallments: 1,
        currentInstallment: 1,
        tags: []
      }
    };

    // Simular chamada para a API
    const response = await fetch('http://localhost:3000/api/transactions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Transação criada via API:', result.id);

    // Aguardar um pouco para garantir que a criação automática aconteceu
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se a despesa foi criada automaticamente
    const { data: autoExpense, error: autoExpError } = await supabase
      .from('expenses')
      .select('*')
      .eq('transaction_id', result.id)
      .single();

    if (autoExpError) {
      console.log('❌ Despesa não foi criada automaticamente:', autoExpError);
    } else {
      console.log('✅ Despesa criada automaticamente:', autoExpense.id);
      console.log(`   - Valor: R$ ${autoExpense.amount}`);
      console.log(`   - Tipo: ${autoExpense.type}`);
    }

    // Verificar se a transação aparece na listagem
    console.log('\n📋 Verificando se a transação aparece na listagem...');
    
    const listResponse = await fetch(`http://localhost:3000/api/transactions/get?user_id=${testUser.id}`);
    
    if (!listResponse.ok) {
      console.error('❌ Erro ao buscar transações:', listResponse.status);
      return;
    }

    const listResult = await listResponse.json();
    const foundTransaction = listResult.transactions.find(t => t.id === result.id);

    if (foundTransaction) {
      console.log('✅ Transação encontrada na listagem:', foundTransaction.id);
    } else {
      console.log('❌ Transação NÃO encontrada na listagem');
    }

    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    
    if (autoExpense) {
      await supabase
        .from('expenses')
        .delete()
        .eq('id', autoExpense.id);
    }

    await supabase
      .from('transactions')
      .delete()
      .eq('id', result.id);

    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  console.log('\n🎉 Teste concluído!');
}

// Executar o teste
testAPIFix();