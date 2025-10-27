require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigarProblema() {
  console.log('🔍 INVESTIGANDO: Por que transações parceladas não aparecem nas despesas\n');

  try {
    // 1. Verificar transações parceladas na tabela transactions
    console.log('📋 1. TRANSAÇÕES PARCELADAS (tabela transactions):');
    const { data: installmentTransactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true)
      .eq('type', 'expense');

    if (transError) {
      console.error('❌ Erro ao buscar transações parceladas:', transError);
      return;
    }

    console.log(`✅ Encontradas ${installmentTransactions.length} transações parceladas do tipo expense`);
    installmentTransactions.forEach((trans, index) => {
      console.log(`   ${index + 1}. ${trans.description} - R$ ${trans.amount} (ID: ${trans.id})`);
    });

    // 2. Verificar despesas na tabela expenses
    console.log('\n💰 2. DESPESAS REGULARES (tabela expenses):');
    const { data: regularExpenses, error: expError } = await supabase
      .from('expenses')
      .select('*');

    if (expError) {
      console.error('❌ Erro ao buscar despesas regulares:', expError);
      return;
    }

    console.log(`✅ Encontradas ${regularExpenses.length} despesas regulares`);
    regularExpenses.forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.description} - R$ ${exp.amount} (ID: ${exp.id})`);
    });

    // 3. Verificar o que a API de despesas retorna
    console.log('\n🌐 3. TESTANDO API DE DESPESAS:');
    
    // Pegar um user_id das transações parceladas
    if (installmentTransactions.length > 0) {
      const testUserId = installmentTransactions[0].user_id;
      console.log(`   Testando com user_id: ${testUserId}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/expenses/get?user_id=${testUserId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API retornou ${data.expenses?.length || 0} despesas`);
          
          if (data.expenses && data.expenses.length > 0) {
            data.expenses.forEach((exp, index) => {
              console.log(`      ${index + 1}. ${exp.description} - R$ ${exp.amount}`);
            });
          } else {
            console.log('   ⚠️ Nenhuma despesa retornada pela API!');
          }
        } else {
          console.log(`   ❌ Erro na API: ${response.status}`);
        }
      } catch (apiError) {
        console.log(`   ❌ Erro ao chamar API: ${apiError.message}`);
      }
    }

    // 4. Propor soluções
    console.log('\n💡 4. SOLUÇÕES PROPOSTAS:');
    console.log('   A) Modificar a API de despesas para incluir transações parceladas');
    console.log('   B) Criar uma view unificada que combine expenses + transactions parceladas');
    console.log('   C) Modificar a página de despesas para buscar ambas as tabelas');
    
    console.log('\n🎯 RECOMENDAÇÃO: Opção C - Modificar página de despesas');
    console.log('   - Buscar expenses normais');
    console.log('   - Buscar transactions com is_installment=true e type=expense');
    console.log('   - Combinar e exibir ambos na interface');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

investigarProblema();