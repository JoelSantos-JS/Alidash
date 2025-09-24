require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateIncomeData() {
  console.log('🔍 Atualizando dados de renda para setembro 2025...');
  
  // Buscar o usuário atual
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'joeltere9@gmail.com');
    
  if (!users || users.length === 0) {
    console.log('❌ Usuário não encontrado');
    return;
  }
  
  const user = users[0];
  console.log('✅ Usuário encontrado:', user.id);
  
  // Atualizar as rendas existentes para setembro 2025
  const { data: existingIncomes } = await supabase
    .from('personal_incomes')
    .select('*')
    .eq('user_id', user.id);
    
  console.log('📊 Rendas existentes:', existingIncomes?.length || 0);
  
  if (existingIncomes && existingIncomes.length > 0) {
    for (const income of existingIncomes) {
      const newDate = `2025-09-15`; // 15 de setembro de 2025
      
      const { error } = await supabase
        .from('personal_incomes')
        .update({ date: newDate })
        .eq('id', income.id);
        
      if (error) {
        console.error(`❌ Erro ao atualizar renda ${income.id}:`, error);
      } else {
        console.log(`✅ Renda atualizada: ${income.description} -> ${newDate}`);
      }
    }
  }
  
  console.log('🎉 Dados de renda atualizados para setembro 2025!');
}

updateIncomeData().catch(console.error);