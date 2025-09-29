const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewUserPersonalData() {
  try {
    console.log('🧪 Testando criação de dados pessoais para novo usuário...\n');
    
    // 1. Criar um usuário de teste
    const testUserEmail = `test-user-${Date.now()}@example.com`;
    const testFirebaseUid = `test-uid-${Date.now()}`;
    
    console.log('👤 Criando usuário de teste...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        firebase_uid: testFirebaseUid,
        email: testUserEmail,
        name: 'Usuário Teste',
        account_type: 'personal'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário criado:', newUser.email, '(ID:', newUser.id, ')');
    
    // 2. Verificar se dados pessoais foram criados automaticamente
    console.log('\n🔍 Verificando dados pessoais criados automaticamente...');
    
    // Verificar receitas
    const { data: incomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', newUser.id);
    
    console.log(`💰 Receitas encontradas: ${incomes?.length || 0}`);
    if (incomesError) console.log('   ⚠️ Erro:', incomesError.message);
    
    // Verificar gastos
    const { data: expenses, error: expensesError } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', newUser.id);
    
    console.log(`💸 Gastos encontrados: ${expenses?.length || 0}`);
    if (expensesError) console.log('   ⚠️ Erro:', expensesError.message);
    
    // Verificar orçamentos
    const { data: budgets, error: budgetsError } = await supabase
      .from('personal_budgets')
      .select('*')
      .eq('user_id', newUser.id);
    
    console.log(`📊 Orçamentos encontrados: ${budgets?.length || 0}`);
    if (budgetsError) console.log('   ⚠️ Erro:', budgetsError.message);
    
    // Verificar metas
    const { data: goals, error: goalsError } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', newUser.id);
    
    console.log(`🎯 Metas encontradas: ${goals?.length || 0}`);
    if (goalsError) console.log('   ⚠️ Erro:', goalsError.message);
    
    // 3. Testar acesso via API do dashboard pessoal
    console.log('\n🌐 Testando acesso via API...');
    
    try {
      // Simular chamada da API de resumo pessoal
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      console.log(`📅 Buscando resumo para ${month}/${year}...`);
      
      // Buscar resumo mensal (simulando a API)
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_personal_summary', {
          p_user_id: newUser.id,
          p_month: month,
          p_year: year
        });
      
      if (summaryError) {
        console.log('⚠️ Função get_personal_summary não existe, testando manualmente...');
        
        // Calcular resumo manualmente
        const totalIncomes = incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
        const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
        const balance = totalIncomes - totalExpenses;
        
        console.log(`   💰 Total de receitas: R$ ${totalIncomes.toFixed(2)}`);
        console.log(`   💸 Total de gastos: R$ ${totalExpenses.toFixed(2)}`);
        console.log(`   💵 Saldo: R$ ${balance.toFixed(2)}`);
      } else {
        console.log('✅ Resumo obtido via função:', summaryData);
      }
      
    } catch (apiError) {
      console.log('⚠️ Erro ao testar API:', apiError.message);
    }
    
    // 4. Verificar políticas RLS
    console.log('\n🔒 Testando políticas RLS...');
    
    // Criar cliente com usuário anônimo para testar RLS
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    try {
      const { data: rlsTest, error: rlsError } = await anonClient
        .from('personal_incomes')
        .select('*')
        .eq('user_id', newUser.id);
      
      if (rlsError) {
        console.log('✅ RLS funcionando - acesso negado para usuário não autenticado');
      } else {
        console.log('⚠️ RLS pode não estar funcionando - dados acessíveis sem autenticação');
      }
    } catch (rlsTestError) {
      console.log('✅ RLS funcionando - erro de acesso:', rlsTestError.message);
    }
    
    // 5. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);
    
    if (deleteError) {
      console.log('⚠️ Erro ao deletar usuário de teste:', deleteError.message);
      console.log('   💡 Você pode deletar manualmente o usuário:', newUser.id);
    } else {
      console.log('✅ Usuário de teste deletado com sucesso');
    }
    
    // 6. Conclusões
    console.log('\n📋 CONCLUSÕES:');
    console.log('================');
    
    if ((incomes?.length || 0) === 0 && (expenses?.length || 0) === 0 && 
        (budgets?.length || 0) === 0 && (goals?.length || 0) === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Novos usuários não recebem dados pessoais iniciais automaticamente');
      console.log('💡 SOLUÇÃO NECESSÁRIA: Implementar criação automática de dados iniciais');
      console.log('   - Criar orçamento padrão');
      console.log('   - Criar categorias básicas');
      console.log('   - Criar meta de reserva de emergência');
      console.log('   - Adicionar dados de exemplo (opcional)');
    } else {
      console.log('✅ Dados pessoais são criados automaticamente para novos usuários');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testNewUserPersonalData().catch(console.error);
}

module.exports = { testNewUserPersonalData };