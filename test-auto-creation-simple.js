require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simular a lógica do createTransaction
async function createTransactionWithAutoCreation(transactionData) {
  console.log('🔄 Iniciando createTransaction...');
  
  // 1. Criar a transação
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (transactionError) {
    console.error('❌ Erro ao criar transação:', transactionError);
    throw transactionError;
  }

  console.log(`✅ Transação criada: ${transaction.id}`);

  // 2. Criar receita/despesa automaticamente
  try {
    if (transactionData.type === 'revenue') {
      console.log('🔄 Criando receita automaticamente...');
      
      const revenueData = {
        user_id: transactionData.user_id,
        date: transactionData.date,
        description: transactionData.description,
        amount: transactionData.amount,
        category: 'Vendas de Produtos', // Categoria obrigatória
        source: 'other', // Usar valor válido do enum
        notes: transactionData.notes || '',
        transaction_id: transaction.id
      };

      const { data: revenue, error: revenueError } = await supabase
        .from('revenues')
        .insert(revenueData)
        .select()
        .single();

      if (revenueError) {
        console.error('❌ Erro ao criar receita:', revenueError);
      } else {
        console.log(`✅ Receita criada automaticamente: ${revenue.id}`);
      }
    } else if (transactionData.type === 'expense') {
      console.log('🔄 Criando despesa automaticamente...');
      
      const expenseData = {
        user_id: transactionData.user_id,
        date: transactionData.date,
        description: transactionData.description,
        amount: transactionData.amount,
        category: transactionData.category || 'Outros',
        type: 'purchase', // Tipo de despesa válido
        supplier: transactionData.supplier || '',
        notes: transactionData.notes || '',
        transaction_id: transaction.id
      };

      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (expenseError) {
        console.error('❌ Erro ao criar despesa:', expenseError);
      } else {
        console.log(`✅ Despesa criada automaticamente: ${expense.id}`);
      }
    }
  } catch (autoError) {
    console.error('❌ Erro na criação automática:', autoError);
  }

  return transaction;
}

async function testTransactionAutoCreation() {
  console.log('🧪 Testando criação automática de receitas/despesas...\n');

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

    // Teste 1: Criar transação de receita
    console.log('\n📈 Teste 1: Criando transação de receita...');
    
    const revenueTransactionData = {
      user_id: testUser.id,
      description: 'Teste de receita automática',
      amount: 1000.50,
      date: new Date().toISOString(),
      category: 'Salário',
      type: 'revenue',
      status: 'completed',
      notes: 'Teste automatizado'
    };

    const revenueTransaction = await createTransactionWithAutoCreation(revenueTransactionData);

    // Verificar se a receita foi criada
    const { data: autoRevenue, error: autoRevError } = await supabase
      .from('revenues')
      .select('*')
      .eq('transaction_id', revenueTransaction.id)
      .single();

    if (autoRevError) {
      console.log('❌ Receita não encontrada:', autoRevError);
    } else {
      console.log('✅ Receita encontrada na verificação:', autoRevenue.id);
    }

    // Teste 2: Criar transação de despesa
    console.log('\n💸 Teste 2: Criando transação de despesa...');
    
    const expenseTransactionData = {
      user_id: testUser.id,
      description: 'Teste de despesa automática',
      amount: 500.25,
      date: new Date().toISOString(),
      category: 'Alimentação',
      type: 'expense',
      status: 'completed',
      notes: 'Teste automatizado'
    };

    const expenseTransaction = await createTransactionWithAutoCreation(expenseTransactionData);

    // Verificar se a despesa foi criada
    const { data: autoExpense, error: autoExpError } = await supabase
      .from('expenses')
      .select('*')
      .eq('transaction_id', expenseTransaction.id)
      .single();

    if (autoExpError) {
      console.log('❌ Despesa não encontrada:', autoExpError);
    } else {
      console.log('✅ Despesa encontrada na verificação:', autoExpense.id);
    }

    console.log('\n🧹 Limpando dados de teste...');
    
    // Limpar dados de teste
    await supabase
      .from('revenues')
      .delete()
      .like('description', '%Teste de receita automática%');

    await supabase
      .from('expenses')
      .delete()
      .like('description', '%Teste de despesa automática%');

    await supabase
      .from('transactions')
      .delete()
      .like('description', '%Teste de%automática%');

    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  console.log('\n🎉 Teste concluído!');
}

// Executar o teste
testTransactionAutoCreation();