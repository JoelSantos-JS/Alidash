const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID do usuário real (joeltere9@gmail.com)
const REAL_USER_ID = 'a8a4b3fb-a614-4690-9f5d-fd4dda9c3b53';

async function insertDataForRealUser() {
  console.log('🔧 Corrigindo dados pessoais para o usuário real...');
  console.log(`👤 Usuário: ${REAL_USER_ID}`);
  
  try {
    // 1. Inserir receitas pessoais
    console.log('💰 Inserindo receitas pessoais...');
    const incomes = [
      {
        user_id: REAL_USER_ID,
        date: new Date().toISOString().split('T')[0], // Hoje
        description: 'Salário Janeiro 2025',
        amount: 5000.00,
        category: 'salary',
        source: 'Empresa XYZ Ltda',
        is_recurring: true,
        is_taxable: true,
        notes: 'Salário mensal CLT'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 dias atrás
        description: 'Freelance Website',
        amount: 1500.00,
        category: 'freelance',
        source: 'Cliente ABC',
        is_recurring: false,
        is_taxable: true,
        notes: 'Desenvolvimento de website institucional'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 dias atrás
        description: 'Rendimento Poupança',
        amount: 45.30,
        category: 'investment',
        source: 'Banco XYZ',
        is_recurring: true,
        is_taxable: false,
        notes: 'Rendimento mensal da poupança'
      }
    ];

    const { data: incomesData, error: incomesError } = await supabase
      .from('personal_incomes')
      .insert(incomes)
      .select();

    if (incomesError) {
      console.error('❌ Erro ao inserir receitas:', incomesError);
    } else {
      console.log('✅ Receitas inseridas:', incomesData.length);
    }

    // 2. Inserir gastos pessoais
    console.log('💸 Inserindo gastos pessoais...');
    const expenses = [
      {
        user_id: REAL_USER_ID,
        date: new Date().toISOString().split('T')[0], // Hoje
        description: 'Supermercado',
        amount: 350.00,
        category: 'food',
        payment_method: 'debit_card',
        is_essential: true,
        merchant: 'Supermercado ABC',
        notes: 'Compras mensais da família'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 dias atrás
        description: 'Cinema',
        amount: 45.00,
        category: 'entertainment',
        payment_method: 'credit_card',
        is_essential: false,
        merchant: 'Cinemark Shopping',
        notes: 'Filme com a família - final de semana'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 dias atrás
        description: 'Conta de Luz',
        amount: 180.50,
        category: 'utilities',
        payment_method: 'pix',
        is_essential: true,
        merchant: 'CEMIG',
        notes: 'Conta de energia elétrica - Janeiro'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias atrás
        description: 'Gasolina',
        amount: 120.00,
        category: 'transportation',
        payment_method: 'debit_card',
        is_essential: true,
        merchant: 'Posto Shell',
        notes: 'Abastecimento do carro'
      },
      {
        user_id: REAL_USER_ID,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 dias atrás
        description: 'Plano de Saúde',
        amount: 280.00,
        category: 'healthcare',
        payment_method: 'automatic_debit',
        is_essential: true,
        merchant: 'Unimed',
        notes: 'Mensalidade do plano de saúde familiar'
      }
    ];

    const { data: expensesData, error: expensesError } = await supabase
      .from('personal_expenses')
      .insert(expenses)
      .select();

    if (expensesError) {
      console.error('❌ Erro ao inserir gastos:', expensesError);
    } else {
      console.log('✅ Gastos inseridos:', expensesData.length);
    }

    // 3. Inserir orçamento pessoal
    console.log('📊 Inserindo orçamento pessoal...');
    const currentDate = new Date();
    const budget = {
      user_id: REAL_USER_ID,
      name: `Orçamento ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      categories: {
        food: 800,
        transportation: 300,
        utilities: 400,
        healthcare: 300,
        entertainment: 200,
        housing: 1000
      },
      total_budget: 3000.00,
      status: 'active',
      notes: 'Orçamento mensal familiar'
    };

    const { data: budgetData, error: budgetError } = await supabase
      .from('personal_budgets')
      .insert(budget)
      .select();

    if (budgetError) {
      console.error('❌ Erro ao inserir orçamento:', budgetError);
    } else {
      console.log('✅ Orçamento inserido:', budgetData.length);
    }

    // 4. Inserir metas pessoais
    console.log('🎯 Inserindo metas pessoais...');
    const goals = [
      {
        user_id: REAL_USER_ID,
        name: 'Reserva de Emergência',
        description: 'Reserva para 6 meses de gastos',
        type: 'emergency_fund',
        target_amount: 18000.00,
        current_amount: 3500.00,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
        priority: 'high',
        monthly_contribution: 800.00,
        notes: 'Meta prioritária para segurança financeira'
      },
      {
        user_id: REAL_USER_ID,
        name: 'Viagem para Europa',
        description: 'Viagem de férias para Europa em família',
        type: 'vacation',
        target_amount: 15000.00,
        current_amount: 2000.00,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 meses
        priority: 'medium',
        monthly_contribution: 500.00,
        notes: 'Viagem planejada para julho'
      },
      {
        user_id: REAL_USER_ID,
        name: 'Carro Novo',
        description: 'Troca do carro atual por um modelo mais novo',
        type: 'purchase',
        target_amount: 25000.00,
        current_amount: 5000.00,
        deadline: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 meses
        priority: 'medium',
        monthly_contribution: 600.00,
        notes: 'Entrada para financiamento de carro novo'
      }
    ];

    const { data: goalsData, error: goalsError } = await supabase
      .from('personal_goals')
      .insert(goals)
      .select();

    if (goalsError) {
      console.error('❌ Erro ao inserir metas:', goalsError);
    } else {
      console.log('✅ Metas inseridas:', goalsData.length);
    }

    console.log('\n🎉 Dados corrigidos com sucesso!');
    console.log('📊 Resumo para o usuário real:');
    console.log(`   💰 Receitas: ${incomesData?.length || 0}`);
    console.log(`   💸 Gastos: ${expensesData?.length || 0}`);
    console.log(`   📊 Orçamentos: ${budgetData?.length || 0}`);
    console.log(`   🎯 Metas: ${goalsData?.length || 0}`);
    console.log('\n✅ Agora o dashboard pessoal deve funcionar!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function verifyUserData() {
  console.log('\n🔍 Verificando dados do usuário real...');
  
  const tables = [
    { name: 'personal_incomes', label: 'Receitas' },
    { name: 'personal_expenses', label: 'Gastos' },
    { name: 'personal_budgets', label: 'Orçamentos' },
    { name: 'personal_goals', label: 'Metas' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .eq('user_id', REAL_USER_ID);
      
      if (error) {
        console.error(`❌ Erro ao verificar ${table.label}:`, error.message);
      } else {
        console.log(`✅ ${table.label}: ${count || 0} registros`);
      }
    } catch (err) {
      console.error(`💥 Erro crítico ao verificar ${table.label}:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Corrigindo dados pessoais para o usuário real...');
  console.log(`👤 Usuário: joeltere9@gmail.com (${REAL_USER_ID})`);
  
  // Verificar dados atuais
  await verifyUserData();
  
  // Inserir dados para o usuário real
  await insertDataForRealUser();
  
  // Verificar novamente
  await verifyUserData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { insertDataForRealUser, verifyUserData };