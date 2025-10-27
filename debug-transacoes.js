const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTransacoes() {
  console.log('🔍 Debug completo das transações...\n');

  try {
    // 1. Buscar todas as transações sem filtros
    console.log('📊 1. Buscando TODAS as transações (sem filtros)...');
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todas as transações:', allError);
    } else {
      console.log(`✅ Total de transações na tabela: ${allTransactions.length}`);
      
      if (allTransactions.length > 0) {
        console.log('\n📝 Detalhes de cada transação:');
        allTransactions.forEach((t, i) => {
          console.log(`--- Transação ${i + 1} ---`);
          console.log(`ID: ${t.id}`);
          console.log(`Descrição: ${t.description}`);
          console.log(`Valor: ${t.amount}`);
          console.log(`Tipo: ${t.type}`);
          console.log(`Usuário: ${t.user_id}`);
          console.log(`Data: ${t.date}`);
          console.log(`Criado em: ${t.created_at}`);
          console.log('');
        });
      }
    }

    // 2. Verificar se há dados em outras tabelas relacionadas
    console.log('🔍 2. Verificando outras tabelas relacionadas...');
    
    // Verificar revenues
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*');
    
    if (!revenuesError) {
      console.log(`📈 Receitas encontradas: ${revenues.length}`);
    }

    // Verificar expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*');
    
    if (!expensesError) {
      console.log(`💸 Despesas encontradas: ${expenses.length}`);
    }

    // Verificar personal_incomes
    const { data: personalIncomes, error: personalError } = await supabase
      .from('personal_incomes')
      .select('*');
    
    if (!personalError) {
      console.log(`💰 Receitas pessoais encontradas: ${personalIncomes.length}`);
    }

    // 3. Verificar se o usuário específico tem transações
    console.log('\n👤 3. Verificando transações por usuário...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name');

    if (!usersError && users.length > 0) {
      for (const user of users) {
        const { data: userTransactions, error: userError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id);

        if (!userError) {
          console.log(`Usuário ${user.email || user.name || user.id}: ${userTransactions.length} transações`);
        }
      }
    }

    // 4. Testar a API diretamente
    console.log('\n🌐 4. Testando API de transações...');
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      console.log(`Testando com usuário: ${testUserId}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/transactions/get?user_id=${testUserId}`);
        const result = await response.json();
        console.log('Resposta da API:', result);
      } catch (apiError) {
        console.log('❌ Erro ao testar API (servidor pode não estar rodando):', apiError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

debugTransacoes();