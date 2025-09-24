require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExpensesStructure() {
  console.log('🔍 Verificando estrutura da tabela personal_expenses...');
  
  // Buscar uma despesa para ver a estrutura
  const { data: sample, error } = await supabase
    .from('personal_expenses')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  if (sample && sample.length > 0) {
    console.log('📋 Estrutura da tabela (campos disponíveis):');
    Object.keys(sample[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof sample[0][key]} = ${sample[0][key]}`);
    });
  } else {
    console.log('⚠️ Nenhum dado encontrado na tabela');
  }
}

checkExpensesStructure().catch(console.error);