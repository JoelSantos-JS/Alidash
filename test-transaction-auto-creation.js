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

// Registrar ts-node para importar TypeScript
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    target: 'es2020',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true
  }
});

// Importar o serviço Supabase
const { SupabaseAdminService } = require('./src/lib/supabase-service.ts');
const supabaseService = new SupabaseAdminService();

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
    const revenueTransaction = {
      description: 'Teste de receita automática',
      amount: 1000.50,
      date: new Date(),
      category: 'Salário',
      type: 'revenue',
      notes: 'Teste automatizado'
    };

    const createdRevTransaction = await supabaseService.createTransaction(testUser.id, revenueTransaction);
    console.log(`✅ Transação de receita criada: ${createdRevTransaction.id}`);

    // Verificar se a receita foi criada automaticamente
    const { data: autoRevenue, error: autoRevError } = await supabase
      .from('revenues')
      .select('*')
      .eq('transaction_id', createdRevTransaction.id)
      .single();

    if (autoRevError) {
      console.log('❌ Receita não foi criada automaticamente:', autoRevError);
    } else {
      console.log('✅ Receita criada automaticamente:', autoRevenue.id);
      console.log(`   - Valor: R$ ${autoRevenue.amount}`);
      console.log(`   - Fonte: ${autoRevenue.source}`);
    }

    // Teste 2: Criar transação de despesa
    console.log('\n📉 Teste 2: Criando transação de despesa...');
    const expenseTransaction = {
      description: 'Teste de despesa automática',
      amount: 250.75,
      date: new Date(),
      category: 'Alimentação',
      type: 'expense',
      notes: 'Teste automatizado'
    };

    const createdExpTransaction = await supabaseService.createTransaction(testUser.id, expenseTransaction);
    console.log(`✅ Transação de despesa criada: ${createdExpTransaction.id}`);

    // Verificar se a despesa foi criada automaticamente
    const { data: autoExpense, error: autoExpError } = await supabase
      .from('expenses')
      .select('*')
      .eq('transaction_id', createdExpTransaction.id)
      .single();

    if (autoExpError) {
      console.log('❌ Despesa não foi criada automaticamente:', autoExpError);
    } else {
      console.log('✅ Despesa criada automaticamente:', autoExpense.id);
      console.log(`   - Valor: R$ ${autoExpense.amount}`);
      console.log(`   - Tipo: ${autoExpense.type}`);
    }

    // Limpeza: Remover dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    if (autoRevenue) {
      await supabase.from('revenues').delete().eq('id', autoRevenue.id);
    }
    if (autoExpense) {
      await supabase.from('expenses').delete().eq('id', autoExpense.id);
    }
    
    await supabase.from('transactions').delete().eq('id', createdRevTransaction.id);
    await supabase.from('transactions').delete().eq('id', createdExpTransaction.id);
    
    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testTransactionAutoCreation();