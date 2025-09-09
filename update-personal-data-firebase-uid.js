const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase UID do usuário real
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';
const SUPABASE_USER_ID = 'a8a4b3fb-a614-4690-9f5d-fd4dda9c3b53';

async function updatePersonalDataToFirebaseUID() {
  console.log('🔄 Atualizando dados pessoais para usar Firebase UID...');
  console.log(`👤 Firebase UID: ${FIREBASE_UID}`);
  console.log(`🆔 Supabase ID atual: ${SUPABASE_USER_ID}`);
  
  const tables = [
    'personal_incomes',
    'personal_expenses', 
    'personal_budgets',
    'personal_goals'
  ];
  
  for (const table of tables) {
    console.log(`\n📋 Atualizando tabela: ${table}`);
    
    try {
      // 1. Verificar dados atuais
      const { data: currentData, error: selectError } = await supabase
        .from(table)
        .select('id, user_id')
        .eq('user_id', SUPABASE_USER_ID);
      
      if (selectError) {
        console.error(`❌ Erro ao buscar dados atuais em ${table}:`, selectError);
        continue;
      }
      
      console.log(`📊 Registros encontrados em ${table}: ${currentData?.length || 0}`);
      
      if (!currentData || currentData.length === 0) {
        console.log(`⚠️  Nenhum registro encontrado em ${table} para atualizar`);
        continue;
      }
      
      // 2. Atualizar user_id para Firebase UID
      const { data: updateData, error: updateError } = await supabase
        .from(table)
        .update({ user_id: FIREBASE_UID })
        .eq('user_id', SUPABASE_USER_ID)
        .select();
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ${table}:`, updateError);
      } else {
        console.log(`✅ ${table}: ${updateData?.length || 0} registros atualizados`);
      }
      
    } catch (err) {
      console.error(`💥 Erro crítico na tabela ${table}:`, err.message);
    }
  }
}

async function verifyUpdate() {
  console.log('\n🔍 Verificando atualização...');
  
  const tables = [
    'personal_incomes',
    'personal_expenses', 
    'personal_budgets',
    'personal_goals'
  ];
  
  for (const table of tables) {
    try {
      // Verificar com Firebase UID
      const { data: firebaseData, error: firebaseError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', FIREBASE_UID);
      
      // Verificar com Supabase ID (deve ser 0)
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', SUPABASE_USER_ID);
      
      if (firebaseError || supabaseError) {
        console.error(`❌ Erro ao verificar ${table}:`, firebaseError || supabaseError);
      } else {
        console.log(`📊 ${table}:`);
        console.log(`   Firebase UID (${FIREBASE_UID}): ${firebaseData?.length || 0} registros`);
        console.log(`   Supabase ID (${SUPABASE_USER_ID}): ${supabaseData?.length || 0} registros`);
      }
      
    } catch (err) {
      console.error(`💥 Erro ao verificar ${table}:`, err.message);
    }
  }
}

async function testPersonalDataAccess() {
  console.log('\n🧪 Testando acesso aos dados pessoais com Firebase UID...');
  
  try {
    // Testar busca de gastos por categoria (que estava falhando)
    console.log('📈 Testando getExpensesByCategory...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const { data: expenses, error } = await supabase
      .from('personal_expenses')
      .select('category, amount')
      .eq('user_id', FIREBASE_UID)
      .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .lt('date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
    
    if (error) {
      console.error('❌ Erro ao buscar gastos por categoria:', error);
    } else {
      console.log(`✅ Gastos encontrados: ${expenses?.length || 0}`);
      
      if (expenses && expenses.length > 0) {
        // Agrupar por categoria
        const categoryTotals = expenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});
        
        console.log('📊 Gastos por categoria:');
        Object.entries(categoryTotals).forEach(([category, amount]) => {
          console.log(`   ${category}: R$ ${amount}`);
        });
      }
    }
    
    // Testar outras consultas
    console.log('\n💰 Testando receitas...');
    const { data: incomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', FIREBASE_UID)
      .limit(5);
    
    if (incomesError) {
      console.error('❌ Erro ao buscar receitas:', incomesError);
    } else {
      console.log(`✅ Receitas encontradas: ${incomes?.length || 0}`);
    }
    
    console.log('\n🎯 Testando metas...');
    const { data: goals, error: goalsError } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', FIREBASE_UID)
      .limit(5);
    
    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
    } else {
      console.log(`✅ Metas encontradas: ${goals?.length || 0}`);
    }
    
  } catch (err) {
    console.error('💥 Erro no teste:', err.message);
  }
}

async function main() {
  console.log('🚀 Iniciando atualização para Firebase UID...');
  
  // 1. Atualizar dados para usar Firebase UID
  await updatePersonalDataToFirebaseUID();
  
  // 2. Verificar se a atualização funcionou
  await verifyUpdate();
  
  // 3. Testar acesso aos dados
  await testPersonalDataAccess();
  
  console.log('\n🎉 Processo concluído!');
  console.log('💡 Agora o dashboard pessoal deve funcionar com Firebase UID');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updatePersonalDataToFirebaseUID, verifyUpdate, testPersonalDataAccess };