const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertPersonalTestData() {
  try {
    console.log('🚀 Iniciando inserção de dados de teste pessoais...');
    
    // Buscar um usuário existente para usar como exemplo
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Nenhum usuário encontrado:', usersError);
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Usando usuário:', users[0].email, '(ID:', userId, ')');
    
    // 1. Inserir receitas pessoais
    console.log('\n💰 Inserindo receitas pessoais...');
    const incomes = [
      {
        user_id: userId,
        date: '2025-01-05',
        description: 'Salário Janeiro 2025',
        amount: 5500.00,
        category: 'salary',
        source: 'Empresa ABC Ltda',
        is_recurring: true,
        is_taxable: true,
        notes: 'Salário mensal'
      },
      {
        user_id: userId,
        date: '2025-01-10',
        description: 'Freelance - Design de Logo',
        amount: 800.00,
        category: 'freelance',
        source: 'Cliente XYZ',
        is_recurring: false,
        is_taxable: true,
        notes: 'Projeto de identidade visual'
      },
      {
        user_id: userId,
        date: '2025-01-08',
        description: 'Dividendos Ações PETR4',
        amount: 125.50,
        category: 'investment',
        source: 'Corretora Clear',
        is_recurring: false,
        is_taxable: true,
        notes: 'Dividendos trimestrais'
      },
      {
        user_id: userId,
        date: '2025-01-03',
        description: 'Cashback Cartão de Crédito',
        amount: 45.80,
        category: 'bonus',
        source: 'Banco Inter',
        is_recurring: false,
        is_taxable: false,
        notes: 'Cashback dezembro 2024'
      },
      {
        user_id: userId,
        date: '2025-01-01',
        description: 'Aluguel Quarto Extra',
        amount: 600.00,
        category: 'rental',
        source: 'Inquilino João Silva',
        is_recurring: true,
        is_taxable: true,
        notes: 'Aluguel mensal do quarto'
      }
    ];
    
    const { data: insertedIncomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .insert(incomes)
      .select();
    
    if (incomesError) {
      console.error('❌ Erro ao inserir receitas:', incomesError);
    } else {
      console.log('✅ Receitas inseridas:', insertedIncomes.length);
    }
    
    // 2. Inserir gastos pessoais
    console.log('\n💸 Inserindo gastos pessoais...');
    const expenses = [
      {
        user_id: userId,
        date: '2025-01-10',
        description: 'Supermercado Pão de Açúcar',
        amount: 285.50,
        category: 'food',
        subcategory: 'groceries',
        payment_method: 'debit_card',
        is_essential: true,
        location: 'Shopping Center Norte',
        merchant: 'Pão de Açúcar',
        notes: 'Compras da semana'
      },
      {
        user_id: userId,
        date: '2025-01-09',
        description: 'Combustível Posto Shell',
        amount: 120.00,
        category: 'transportation',
        subcategory: 'fuel',
        payment_method: 'credit_card',
        is_essential: true,
        location: 'Av. Paulista, 1000',
        merchant: 'Shell',
        notes: 'Tanque cheio'
      },
      {
        user_id: userId,
        date: '2025-01-08',
        description: 'Netflix + Spotify Premium',
        amount: 49.90,
        category: 'entertainment',
        subcategory: 'streaming',
        payment_method: 'credit_card',
        is_essential: false,
        notes: 'Assinaturas mensais'
      },
      {
        user_id: userId,
        date: '2025-01-07',
        description: 'Farmácia Droga Raia',
        amount: 67.80,
        category: 'healthcare',
        subcategory: 'pharmacy',
        payment_method: 'debit_card',
        is_essential: true,
        location: 'Rua Augusta, 500',
        merchant: 'Droga Raia',
        notes: 'Medicamentos e vitaminas'
      },
      {
        user_id: userId,
        date: '2025-01-06',
        description: 'Almoço Restaurante Japonês',
        amount: 65.00,
        category: 'food',
        subcategory: 'restaurant',
        payment_method: 'pix',
        is_essential: false,
        location: 'Liberdade',
        merchant: 'Sushi Yassu',
        notes: 'Almoço de domingo'
      },
      {
        user_id: userId,
        date: '2025-01-05',
        description: 'Conta de Luz ENEL',
        amount: 180.45,
        category: 'utilities',
        subcategory: 'electricity',
        payment_method: 'automatic_debit',
        is_essential: true,
        notes: 'Conta de dezembro 2024'
      },
      {
        user_id: userId,
        date: '2025-01-04',
        description: 'Uber para o trabalho',
        amount: 25.50,
        category: 'transportation',
        subcategory: 'rideshare',
        payment_method: 'credit_card',
        is_essential: true,
        notes: 'Transporte para reunião'
      },
      {
        user_id: userId,
        date: '2025-01-03',
        description: 'Corte de Cabelo',
        amount: 45.00,
        category: 'personal_care',
        subcategory: 'haircut',
        payment_method: 'cash',
        is_essential: false,
        location: 'Barbearia do João',
        notes: 'Corte + barba'
      },
      {
        user_id: userId,
        date: '2025-01-02',
        description: 'Academia Smart Fit',
        amount: 89.90,
        category: 'healthcare',
        subcategory: 'gym',
        payment_method: 'automatic_debit',
        is_essential: false,
        notes: 'Mensalidade janeiro'
      },
      {
        user_id: userId,
        date: '2025-01-01',
        description: 'Presente Ano Novo - Perfume',
        amount: 150.00,
        category: 'gifts',
        payment_method: 'credit_card',
        is_essential: false,
        location: 'Shopping Iguatemi',
        merchant: 'O Boticário',
        notes: 'Presente para namorada'
      }
    ];
    
    const { data: insertedExpenses, error: expensesError } = await supabase
      .from('personal_expenses')
      .insert(expenses)
      .select();
    
    if (expensesError) {
      console.error('❌ Erro ao inserir gastos:', expensesError);
    } else {
      console.log('✅ Gastos inseridos:', insertedExpenses.length);
    }
    
    // 3. Inserir metas pessoais
    console.log('\n🎯 Inserindo metas pessoais...');
    const goals = [
      {
        user_id: userId,
        name: 'Reserva de Emergência',
        description: 'Reserva para 6 meses de gastos essenciais',
        type: 'emergency_fund',
        target_amount: 15000.00,
        current_amount: 8500.00,
        deadline: '2025-12-31',
        priority: 'high',
        status: 'active',
        monthly_contribution: 500.00,
        notes: 'Meta prioritária para segurança financeira'
      },
      {
        user_id: userId,
        name: 'Viagem para Europa',
        description: 'Viagem de 15 dias para França e Itália',
        type: 'vacation',
        target_amount: 8000.00,
        current_amount: 3200.00,
        deadline: '2025-07-15',
        priority: 'medium',
        status: 'active',
        monthly_contribution: 800.00,
        notes: 'Incluindo passagens, hospedagem e gastos'
      },
      {
        user_id: userId,
        name: 'Novo MacBook Pro',
        description: 'MacBook Pro M3 para trabalho freelance',
        type: 'purchase',
        target_amount: 12000.00,
        current_amount: 4500.00,
        deadline: '2025-06-30',
        priority: 'medium',
        status: 'active',
        monthly_contribution: 1200.00,
        notes: 'Investimento para aumentar produtividade'
      },
      {
        user_id: userId,
        name: 'Curso de Especialização',
        description: 'MBA em Gestão Financeira',
        type: 'education',
        target_amount: 25000.00,
        current_amount: 2500.00,
        deadline: '2026-03-01',
        priority: 'low',
        status: 'active',
        monthly_contribution: 1000.00,
        notes: 'Investimento em educação e carreira'
      },
      {
        user_id: userId,
        name: 'Entrada do Apartamento',
        description: 'Entrada para financiamento imobiliário',
        type: 'home_purchase',
        target_amount: 80000.00,
        current_amount: 15000.00,
        deadline: '2026-12-31',
        priority: 'high',
        status: 'active',
        monthly_contribution: 2500.00,
        notes: 'Sonho da casa própria'
      }
    ];
    
    const { data: insertedGoals, error: goalsError } = await supabase
      .from('personal_goals')
      .insert(goals)
      .select();
    
    if (goalsError) {
      console.error('❌ Erro ao inserir metas:', goalsError);
    } else {
      console.log('✅ Metas inseridas:', insertedGoals.length);
    }
    
    // 4. Inserir orçamento pessoal
    console.log('\n📊 Inserindo orçamento pessoal...');
    const budget = {
      user_id: userId,
      name: 'Orçamento Janeiro 2025',
      month: 1,
      year: 2025,
      categories: {
        housing: 1200.00,
        food: 800.00,
        transportation: 400.00,
        healthcare: 300.00,
        entertainment: 200.00,
        personal_care: 150.00,
        utilities: 250.00,
        other: 200.00
      },
      total_budget: 3500.00,
      total_spent: 0,
      total_remaining: 3500.00,
      status: 'active',
      notes: 'Orçamento mensal baseado na renda atual'
    };
    
    const { data: insertedBudget, error: budgetError } = await supabase
      .from('personal_budgets')
      .insert([budget])
      .select();
    
    if (budgetError) {
      console.error('❌ Erro ao inserir orçamento:', budgetError);
    } else {
      console.log('✅ Orçamento inserido:', insertedBudget.length);
    }
    
    console.log('\n🎉 Dados de teste pessoais inseridos com sucesso!');
    console.log('📈 Resumo:');
    console.log(`   💰 Receitas: ${insertedIncomes?.length || 0}`);
    console.log(`   💸 Gastos: ${insertedExpenses?.length || 0}`);
    console.log(`   🎯 Metas: ${insertedGoals?.length || 0}`);
    console.log(`   📊 Orçamentos: ${insertedBudget?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
insertPersonalTestData();