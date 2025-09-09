const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID do usuário de teste (substitua pelo seu Firebase UID)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'; // Você precisa usar um UUID válido do seu usuário

async function insertPersonalSampleData() {
  console.log('🏠 Inserindo dados de exemplo nas tabelas pessoais...');
  
  try {
    // 1. Inserir receitas pessoais
    console.log('💰 Inserindo receitas pessoais...');
    const incomes = [
      {
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
      user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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
        user_id: TEST_USER_ID,
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

    console.log('\n🎉 Dados de exemplo inseridos com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   💰 Receitas: ${incomesData?.length || 0}`);
    console.log(`   💸 Gastos: ${expensesData?.length || 0}`);
    console.log(`   📊 Orçamentos: ${budgetData?.length || 0}`);
    console.log(`   🎯 Metas: ${goalsData?.length || 0}`);
    console.log('\n✅ Agora você pode testar o dashboard pessoal!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função para verificar se o usuário existe
async function checkUser() {
  console.log('👤 Verificando usuário...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name')
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return null;
  }

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário encontrado. Você precisa fazer login primeiro.');
    return null;
  }

  console.log('👥 Usuários encontrados:');
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
  });

  return users[0].id; // Retorna o ID do primeiro usuário
}

// Função principal
async function main() {
  console.log('🚀 Iniciando inserção de dados pessoais de exemplo...');
  
  // Verificar se há usuários
  const userId = await checkUser();
  
  if (!userId) {
    console.log('\n❌ Não foi possível encontrar um usuário válido.');
    console.log('💡 Faça login na aplicação primeiro para criar um usuário.');
    return;
  }

  // Usar o ID do usuário real encontrado
  const realUserId = userId;
  console.log(`\n🔑 Usando usuário: ${realUserId}`);
  
  // Substituir o TEST_USER_ID pelo ID real
  global.TEST_USER_ID = realUserId;
  
  // Inserir dados de exemplo
  await insertPersonalSampleData();
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { insertPersonalSampleData, checkUser };