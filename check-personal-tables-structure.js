require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersonalTablesUserIdType() {
  console.log('🔍 Testando tipo de user_id nas tabelas pessoais...\n');

  const testUserId = 'test_text_user_id_123';

  // Teste 1: personal_budgets
  console.log('📊 Testando personal_budgets...');
  try {
    const { data, error } = await supabase
      .from('personal_budgets')
      .insert({
        user_id: testUserId,
        name: 'Teste Budget',
        month: 12,
        year: 2024,
        categories: { test: 100 },
        total_budget: 100,
        status: 'active'
      })
      .select();

    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      if (error.message.includes('uuid')) {
        console.log('   → user_id ainda é UUID, precisa ser alterado para TEXT');
      }
    } else {
      console.log('✅ Sucesso: user_id aceita TEXT');
      // Limpar teste
      await supabase.from('personal_budgets').delete().eq('user_id', testUserId);
    }
  } catch (err) {
    console.log(`❌ Erro: ${err.message}`);
  }

  // Teste 2: personal_goals
  console.log('\n🎯 Testando personal_goals...');
  try {
    const { data, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id: testUserId,
        name: 'Teste Goal',
        description: 'Teste',
        type: 'savings',
        target_amount: 1000,
        current_amount: 0,
        deadline: '2025-12-31',
        priority: 'medium'
      })
      .select();

    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      if (error.message.includes('uuid')) {
        console.log('   → user_id ainda é UUID, precisa ser alterado para TEXT');
      }
    } else {
      console.log('✅ Sucesso: user_id aceita TEXT');
      // Limpar teste
      await supabase.from('personal_goals').delete().eq('user_id', testUserId);
    }
  } catch (err) {
    console.log(`❌ Erro: ${err.message}`);
  }

  console.log('\n📋 CONCLUSÃO:');
  console.log('Se você viu erros de UUID acima, execute o script fix-personal-tables-schema.sql');
  console.log('Se você viu sucessos, as tabelas já estão configuradas corretamente');
}

// Executar teste
testPersonalTablesUserIdType()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });