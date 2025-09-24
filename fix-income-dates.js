require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIncomeData() {
  console.log('🔍 Verificando e corrigindo dados de renda...');
  
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
  
  // Data atual (janeiro 2025)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Janeiro = 1
  const currentYear = currentDate.getFullYear(); // 2025
  
  console.log(`📅 Mês atual: ${currentMonth}/${currentYear}`);
  
  // Atualizar as rendas existentes para janeiro 2025
  const { data: existingIncomes } = await supabase
    .from('personal_incomes')
    .select('*')
    .eq('user_id', user.id);
    
  console.log('📊 Rendas existentes:', existingIncomes?.length || 0);
  
  if (existingIncomes && existingIncomes.length > 0) {
    for (const income of existingIncomes) {
      const newDate = `2025-01-15`; // 15 de janeiro de 2025
      
      const { error } = await supabase
        .from('personal_incomes')
        .update({ income_date: newDate })
        .eq('id', income.id);
        
      if (error) {
        console.error(`❌ Erro ao atualizar renda ${income.id}:`, error);
      } else {
        console.log(`✅ Renda atualizada: ${income.description} -> ${newDate}`);
      }
    }
  }
  
  console.log('🎉 Dados de renda atualizados para janeiro 2025!');
}

fixIncomeData().catch(console.error);