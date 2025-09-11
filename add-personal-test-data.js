const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const USER_ID = 'a8a4b3fb-a614-4690-9f5d-fd4dda9c3b53';

async function addPersonalTestData() {
  console.log('💰 Adicionando dados de teste para o dashboard pessoal...');
  
  try {
    // Dados de receitas pessoais para setembro 2025
    const incomes = [
      {
        user_id: USER_ID,
        date: '2025-09-01',
        description: 'Salário',
        amount: 5000,
        category: 'salary',
        source: 'job',
        is_recurring: true,
        recurring_info: { frequency: 'monthly', day: 1 }
      },
      {
        user_id: USER_ID,
        date: '2025-09-15',
        description: 'Freelance',
        amount: 1500,
        category: 'freelance',
        source: 'work',
        is_recurring: false
      },
      {
        user_id: USER_ID,
        date: '2025-09-20',
        description: 'Venda de produto',
        amount: 300,
        category: 'sales',
        source: 'business',
        is_recurring: false
      }
    ];
    
    // Dados de gastos pessoais adicionais para setembro 2025
    const expenses = [
      {
        user_id: USER_ID,
        date: '2025-09-05',
        description: 'Aluguel',
        amount: 1200,
        category: 'housing',
        subcategory: 'rent',
        payment_method: 'bank_transfer',
        is_essential: true,
        is_recurring: true,
        recurring_info: { frequency: 'monthly', day: 5 }
      },
      {
        user_id: USER_ID,
        date: '2025-09-08',
        description: 'Conta de luz',
        amount: 150,
        category: 'utilities',
        subcategory: 'electricity',
        payment_method: 'bank_transfer',
        is_essential: true,
        is_recurring: false
      },
      {
        user_id: USER_ID,
        date: '2025-09-12',
        description: 'Supermercado',
        amount: 400,
        category: 'food',
        subcategory: 'groceries',
        payment_method: 'debit_card',
        is_essential: true,
        is_recurring: false
      },
      {
        user_id: USER_ID,
        date: '2025-09-15',
        description: 'Cinema',
        amount: 50,
        category: 'entertainment',
        subcategory: 'movies',
        payment_method: 'credit_card',
        is_essential: false,
        is_recurring: false
      },
      {
        user_id: USER_ID,
        date: '2025-09-18',
        description: 'Gasolina',
        amount: 200,
        category: 'transportation',
        subcategory: 'fuel',
        payment_method: 'debit_card',
        is_essential: true,
        is_recurring: false
      },
      {
        user_id: USER_ID,
        date: '2025-09-22',
        description: 'Restaurante',
        amount: 120,
        category: 'food',
        subcategory: 'dining_out',
        payment_method: 'credit_card',
        is_essential: false,
        is_recurring: false
      }
    ];
    
    // Inserir receitas
    console.log('📈 Inserindo receitas...');
    const { data: incomesResult, error: incomesError } = await supabase
      .from('personal_incomes')
      .insert(incomes)
      .select();
    
    if (incomesError) {
      console.error('❌ Erro ao inserir receitas:', incomesError);
    } else {
      console.log('✅ Receitas inseridas:', incomesResult.length);
    }
    
    // Inserir gastos
    console.log('📉 Inserindo gastos...');
    const { data: expensesResult, error: expensesError } = await supabase
      .from('personal_expenses')
      .insert(expenses)
      .select();
    
    if (expensesError) {
      console.error('❌ Erro ao inserir gastos:', expensesError);
    } else {
      console.log('✅ Gastos inseridos:', expensesResult.length);
    }
    
    // Verificar totais
    console.log('\n📊 Resumo dos dados inseridos:');
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const essentialExpenses = expenses.filter(e => e.is_essential).reduce((sum, expense) => sum + expense.amount, 0);
    const nonEssentialExpenses = totalExpenses - essentialExpenses;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    
    console.log(`💰 Total de receitas: R$ ${totalIncome.toFixed(2)}`);
    console.log(`💸 Total de gastos: R$ ${totalExpenses.toFixed(2)}`);
    console.log(`🏠 Gastos essenciais: R$ ${essentialExpenses.toFixed(2)}`);
    console.log(`🎯 Gastos não essenciais: R$ ${nonEssentialExpenses.toFixed(2)}`);
    console.log(`💵 Saldo: R$ ${balance.toFixed(2)}`);
    console.log(`📈 Taxa de poupança: ${savingsRate.toFixed(1)}%`);
    
    console.log('\n✅ Dados de teste adicionados com sucesso!');
    console.log('🎯 Agora o dashboard pessoal deve mostrar os valores corretos.');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
  }
}

addPersonalTestData().catch(console.error);