const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFirebaseUidPersonalData() {
  console.log('🔥 Testando criação de dados pessoais com firebase_uid...');
  
  // Usar um firebase_uid de teste
  const testFirebaseUid = 'firebase-test-uid-' + Date.now();
  
  try {
    // 1. Testar criação de receita pessoal
    console.log('\n💰 Testando criação de receita pessoal...');
    const { data: incomeData, error: incomeError } = await supabase
      .from('personal_incomes')
      .insert({
        user_id: testFirebaseUid,
        description: 'Teste Receita Firebase UID',
        amount: 1000,
        date: new Date().toISOString().split('T')[0],
        category: 'salary',
        source: 'test'
      })
      .select();
    
    if (incomeError) {
      console.error('❌ Erro ao criar receita:', incomeError);
    } else {
      console.log('✅ Receita criada com sucesso:', incomeData[0]);
    }
    
    // 2. Testar criação de despesa pessoal
    console.log('\n💸 Testando criação de despesa pessoal...');
    const { data: expenseData, error: expenseError } = await supabase
      .from('personal_expenses')
      .insert({
        user_id: testFirebaseUid,
        description: 'Teste Despesa Firebase UID',
        amount: 50,
        date: new Date().toISOString().split('T')[0],
        category: 'food'
      })
      .select();
    
    if (expenseError) {
      console.error('❌ Erro ao criar despesa:', expenseError);
    } else {
      console.log('✅ Despesa criada com sucesso:', expenseData[0]);
    }
    
    // 3. Testar criação de orçamento pessoal
    console.log('\n📊 Testando criação de orçamento pessoal...');
    const { data: budgetData, error: budgetError } = await supabase
      .from('personal_budgets')
      .insert({
        user_id: testFirebaseUid,
        category: 'food',
        amount: 500,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      })
      .select();
    
    if (budgetError) {
      console.error('❌ Erro ao criar orçamento:', budgetError);
    } else {
      console.log('✅ Orçamento criado com sucesso:', budgetData[0]);
    }
    
    // 4. Testar criação de meta pessoal
    console.log('\n🎯 Testando criação de meta pessoal...');
    const { data: goalData, error: goalError } = await supabase
      .from('personal_goals')
      .insert({
        user_id: testFirebaseUid,
        name: 'Meta Teste Firebase UID',
        description: 'Meta de teste para firebase_uid',
        type: 'savings',
        target_amount: 5000,
        current_amount: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'active'
      })
      .select();
    
    if (goalError) {
      console.error('❌ Erro ao criar meta:', goalError);
    } else {
      console.log('✅ Meta criada com sucesso:', goalData[0]);
    }
    
    // 5. Verificar se os dados foram criados corretamente
    console.log('\n🔍 Verificando dados criados...');
    
    const tables = ['personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('user_id', testFirebaseUid);
      
      if (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error);
      } else {
        console.log(`✅ ${table}: ${count} registros encontrados`);
      }
    }
    
    // 6. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', testFirebaseUid);
      
      if (error) {
        console.error(`❌ Erro ao limpar ${table}:`, error);
      } else {
        console.log(`✅ ${table} limpo com sucesso`);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro crítico no teste:', err);
  }
}

async function testExistingUserData() {
  console.log('\n👤 Testando dados de usuário existente...');
  
  try {
    // Buscar um usuário existente com firebase_uid
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .not('firebase_uid', 'is', null)
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário com firebase_uid encontrado');
      return;
    }
    
    const user = users[0];
    console.log(`📋 Testando com usuário: ${user.email} (firebase_uid: ${user.firebase_uid})`);
    
    // Verificar se consegue acessar dados pessoais usando firebase_uid
    const tables = ['personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('user_id', user.firebase_uid);
      
      if (error) {
        console.error(`❌ Erro ao acessar ${table} com firebase_uid:`, error);
      } else {
        console.log(`✅ ${table}: ${count} registros encontrados para firebase_uid`);
      }
      
      // Também testar com UUID do usuário
      const { data: dataUuid, error: errorUuid, count: countUuid } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (errorUuid) {
        console.error(`❌ Erro ao acessar ${table} com UUID:`, errorUuid);
      } else {
        console.log(`✅ ${table}: ${countUuid} registros encontrados para UUID`);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro no teste de usuário existente:', err);
  }
}

async function main() {
  console.log('🚀 Iniciando testes de firebase_uid para dados pessoais...\n');
  
  await testFirebaseUidPersonalData();
  await testExistingUserData();
  
  console.log('\n🏁 Testes concluídos!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testFirebaseUidPersonalData, testExistingUserData };