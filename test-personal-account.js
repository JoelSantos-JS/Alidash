const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPersonalAccount() {
  console.log('🧪 Testando Conta Pessoal...\n');

  try {
    // 1. Criar usuário pessoal
    console.log('1️⃣ Criando usuário pessoal...');
    const personalUser = {
      email: 'teste.pessoal@example.com',
      name: 'João Silva',
      account_type: 'personal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([personalUser])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário pessoal criado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      account_type: user.account_type
    });

    // 2. Verificar se dados pessoais iniciais foram criados automaticamente
    console.log('\n2️⃣ Verificando dados pessoais iniciais...');
    
    // Verificar categorias pessoais
    const { data: categories, error: catError } = await supabase
      .from('personal_categories')
      .select('*')
      .eq('user_id', user.id);

    if (!catError && categories && categories.length > 0) {
      console.log('✅ Categorias pessoais encontradas:', categories.length);
    } else {
      console.log('⚠️ Nenhuma categoria pessoal encontrada');
    }

    // Verificar receitas pessoais
    const { data: incomes, error: incError } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', user.id);

    if (!incError && incomes && incomes.length > 0) {
      console.log('✅ Receitas pessoais encontradas:', incomes.length);
    } else {
      console.log('⚠️ Nenhuma receita pessoal encontrada');
    }

    // Verificar despesas pessoais
    const { data: expenses, error: expError } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', user.id);

    if (!expError && expenses && expenses.length > 0) {
      console.log('✅ Despesas pessoais encontradas:', expenses.length);
    } else {
      console.log('⚠️ Nenhuma despesa pessoal encontrada');
    }

    // Verificar orçamentos pessoais
    const { data: budgets, error: budError } = await supabase
      .from('personal_budgets')
      .select('*')
      .eq('user_id', user.id);

    if (!budError && budgets && budgets.length > 0) {
      console.log('✅ Orçamentos pessoais encontrados:', budgets.length);
    } else {
      console.log('⚠️ Nenhum orçamento pessoal encontrado');
    }

    // 3. Testar criação manual de dados pessoais
    console.log('\n3️⃣ Testando criação manual de dados pessoais...');

    // Criar receita pessoal
    const { data: newIncome, error: incomeError } = await supabase
      .from('personal_incomes')
      .insert([{
        user_id: user.id,
        description: 'Salário',
        amount: 5000.00,
        date: new Date().toISOString().split('T')[0],
        category: 'salary',
        source: 'employment', // Campo obrigatório
        is_recurring: false,
        is_taxable: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (incomeError) {
      console.log('❌ Erro ao criar receita:', incomeError);
    } else {
      console.log('✅ Receita pessoal criada:', newIncome.description, 'R$', newIncome.amount);
    }

    // Criar despesa pessoal
    const { data: newExpense, error: expenseError } = await supabase
      .from('personal_expenses')
      .insert([{
        user_id: user.id,
        description: 'Supermercado',
        amount: 300.00,
        date: new Date().toISOString().split('T')[0],
        category: 'food',
        payment_method: 'debit_card', // Campo obrigatório
        is_essential: true,
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (expenseError) {
      console.log('❌ Erro ao criar despesa:', expenseError);
    } else {
      console.log('✅ Despesa pessoal criada:', newExpense.description, 'R$', newExpense.amount);
    }

    // Criar meta pessoal
    const { data: newGoal, error: goalError } = await supabase
      .from('goals')
      .insert([{
        user_id: user.id,
        name: 'Reserva de Emergência', // Campo correto é 'name', não 'title'
        description: 'Juntar 6 meses de salário',
        target_value: 30000.00, // Campo correto é 'target_value', não 'target_amount'
        current_value: 0.00, // Campo correto é 'current_value', não 'current_amount'
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'financial',
        type: 'savings',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (goalError) {
      console.log('❌ Erro ao criar meta:', goalError);
    } else {
      console.log('✅ Meta pessoal criada:', newGoal.name, 'R$', newGoal.target_value);
    }

    // 4. Verificar totais
    console.log('\n4️⃣ Resumo da conta pessoal:');
    
    const { data: totalIncomes } = await supabase
      .from('personal_incomes')
      .select('amount')
      .eq('user_id', user.id);

    const { data: totalExpenses } = await supabase
      .from('personal_expenses')
      .select('amount')
      .eq('user_id', user.id);

    const { data: totalGoals } = await supabase
      .from('goals')
      .select('target_value')
      .eq('user_id', user.id);

    const incomeSum = totalIncomes?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const expenseSum = totalExpenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const goalSum = totalGoals?.reduce((sum, item) => sum + item.target_value, 0) || 0;

    console.log(`📊 Total de receitas: R$ ${incomeSum.toFixed(2)}`);
    console.log(`📊 Total de despesas: R$ ${expenseSum.toFixed(2)}`);
    console.log(`📊 Saldo: R$ ${(incomeSum - expenseSum).toFixed(2)}`);
    console.log(`🎯 Total em metas: R$ ${goalSum.toFixed(2)}`);

    console.log('\n✅ Teste da conta pessoal concluído com sucesso!');
    return user;

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testPersonalAccount();