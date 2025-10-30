const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessGoals() {
  try {
    console.log('🔍 Verificando metas empresariais...');
    
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('category', 'business');
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('🎯 Metas empresariais encontradas:', goals?.length || 0);
    
    if (goals && goals.length > 0) {
      goals.forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.name}`);
        console.log(`   Target: ${goal.target_value}`);
        console.log(`   Current: ${goal.current_value}`);
        console.log(`   Progress: ${((goal.current_value / goal.target_value) * 100).toFixed(1)}%`);
        console.log(`   User ID: ${goal.user_id}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma meta empresarial encontrada no banco');
    }

    // Verificar todas as metas para debug
    console.log('\n🔍 Verificando todas as metas...');
    const { data: allGoals, error: allError } = await supabase
      .from('goals')
      .select('name, category, target_value, current_value, user_id');
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as metas:', allError);
    } else {
      console.log('📊 Total de metas:', allGoals?.length || 0);
      allGoals?.forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.name} (${goal.category}) - ${goal.current_value}/${goal.target_value}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkBusinessGoals();