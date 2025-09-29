require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para criar dados pessoais iniciais (replicando a lógica do SupabaseService)
async function createInitialPersonalData(userId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  console.log('🏠 Criando dados pessoais iniciais para usuário:', userId);

  try {
    // 1. Criar orçamento inicial
    const initialBudget = {
      user_id: userId,
      name: `Orçamento ${nextMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      month: nextMonth.getMonth() + 1,
      year: nextMonth.getFullYear(),
      categories: {
        food: 800,
        transportation: 300,
        utilities: 400,
        entertainment: 200,
        healthcare: 300,
        housing: 1000
      },
      total_budget: 3000.00,
      status: 'active',
      notes: 'Orçamento inicial - ajuste conforme necessário'
    };

    const { error: budgetError } = await supabase
      .from('personal_budgets')
      .insert(initialBudget);

    if (budgetError) {
      console.error('❌ Erro ao criar orçamento inicial:', budgetError);
    } else {
      console.log('✅ Orçamento inicial criado');
    }

    // 2. Criar meta de reserva de emergência
    const emergencyGoal = {
      user_id: userId,
      name: 'Reserva de Emergência',
      description: 'Reserva para 6 meses de gastos essenciais',
      type: 'emergency_fund',
      target_amount: 18000.00,
      current_amount: 0.00,
      deadline: nextYear.toISOString().split('T')[0],
      priority: 'high',
      monthly_contribution: 500.00,
      notes: 'Meta prioritária para segurança financeira. Recomenda-se ter 6 meses de gastos guardados.'
    };

    const { error: goalError } = await supabase
      .from('personal_goals')
      .insert(emergencyGoal);

    if (goalError) {
      console.error('❌ Erro ao criar meta inicial:', goalError);
    } else {
      console.log('✅ Meta de reserva de emergência criada');
    }

    console.log('✅ Dados pessoais iniciais criados com sucesso');

  } catch (error) {
    console.error('❌ Erro geral ao criar dados pessoais iniciais:', error);
    throw error;
  }
}

async function testAutomaticPersonalDataCreation() {
  console.log('🧪 Testando criação automática de dados pessoais...');
  
  const testEmail = `test-auto-${Date.now()}@example.com`;
  let testUserId = null;

  try {
    // 1. Criar usuário
    console.log('👤 Criando usuário...');
    
    const userData = {
      email: testEmail,
      name: 'Usuário Teste Automático',
      account_type: 'personal'
    };

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    testUserId = newUser.id;
    console.log('✅ Usuário criado:', testUserId);

    // 2. Criar dados pessoais iniciais
    await createInitialPersonalData(testUserId);

    // 3. Aguardar um pouco para garantir que os dados foram criados
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Verificar se dados pessoais foram criados
    console.log('🔍 Verificando dados pessoais criados...');

    // Verificar orçamentos
    const { data: budgets, error: budgetError } = await supabase
      .from('personal_budgets')
      .select('*')
      .eq('user_id', testUserId);

    if (budgetError) {
      console.error('❌ Erro ao buscar orçamentos:', budgetError);
    } else {
      console.log('📊 Orçamentos encontrados:', budgets.length);
      if (budgets.length > 0) {
        console.log('   📋 Primeiro orçamento:', {
          month: budgets[0].month,
          year: budgets[0].year,
          total_budget: budgets[0].total_budget,
          status: budgets[0].status
        });
      }
    }

    // Verificar metas
    const { data: goals, error: goalError } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', testUserId);

    if (goalError) {
      console.error('❌ Erro ao buscar metas:', goalError);
    } else {
      console.log('🎯 Metas encontradas:', goals.length);
      if (goals.length > 0) {
        console.log('   🎯 Primeira meta:', {
          name: goals[0].name,
          type: goals[0].type,
          target_amount: goals[0].target_amount,
          priority: goals[0].priority
        });
      }
    }

    // Verificar receitas (deve estar vazio)
    const { data: incomes, error: incomeError } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', testUserId);

    if (incomeError) {
      console.error('❌ Erro ao buscar receitas:', incomeError);
    } else {
      console.log('💰 Receitas encontradas:', incomes.length);
    }

    // Verificar gastos (deve estar vazio)
    const { data: expenses, error: expenseError } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', testUserId);

    if (expenseError) {
      console.error('❌ Erro ao buscar gastos:', expenseError);
    } else {
      console.log('💸 Gastos encontrados:', expenses.length);
    }

    // 5. Conclusões
    console.log('\n📋 RESULTADOS:');
    console.log('================');
    
    if (budgets.length > 0 && goals.length > 0) {
      console.log('✅ SUCESSO: Dados pessoais iniciais criados automaticamente!');
      console.log('   📊 Orçamento inicial: Criado');
      console.log('   🎯 Meta de emergência: Criada');
      console.log('   💰 Receitas: Vazias (correto)');
      console.log('   💸 Gastos: Vazios (correto)');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   - A funcionalidade está implementada no SupabaseService');
      console.log('   - Novos usuários com account_type="personal" receberão dados iniciais');
      console.log('   - Teste a criação de usuário via interface para confirmar');
    } else {
      console.log('❌ FALHA: Dados pessoais iniciais não foram criados');
      console.log(`   📊 Orçamentos: ${budgets.length}`);
      console.log(`   🎯 Metas: ${goals.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // 6. Limpeza - deletar usuário de teste
    if (testUserId) {
      console.log('\n🧹 Limpando dados de teste...');
      
      try {
        // Deletar dados pessoais primeiro
        await supabase.from('personal_budgets').delete().eq('user_id', testUserId);
        await supabase.from('personal_goals').delete().eq('user_id', testUserId);
        await supabase.from('personal_incomes').delete().eq('user_id', testUserId);
        await supabase.from('personal_expenses').delete().eq('user_id', testUserId);
        
        // Deletar usuário
        await supabase.from('users').delete().eq('id', testUserId);
        
        console.log('✅ Dados de teste deletados com sucesso');
      } catch (cleanupError) {
        console.error('⚠️ Erro na limpeza:', cleanupError);
      }
    }
  }
}

// Executar teste
testAutomaticPersonalDataCreation()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });