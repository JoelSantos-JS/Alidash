const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPersonalTablesStructure() {
  console.log('🔍 Verificando estrutura das tabelas pessoais...\n');

  try {
    // Verificar se as tabelas pessoais existem
    const tables = ['personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals', 'personal_categories'];
    
    for (const table of tables) {
      console.log(`📋 Verificando tabela: ${table}`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Erro ao acessar ${table}:`, error.message);
        } else {
          console.log(`✅ Tabela ${table} existe e é acessível`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table} não encontrada ou inacessível`);
      }
    }

    // Verificar estrutura da tabela goals (que funcionou no teste anterior)
    console.log('\n🔍 Verificando estrutura da tabela goals...');
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (goalError) {
      console.log('❌ Erro ao acessar goals:', goalError);
    } else {
      console.log('✅ Tabela goals acessível');
      
      // Tentar inserir uma meta simples para ver quais campos são obrigatórios
      console.log('\n🧪 Testando inserção na tabela goals...');
      const { data: testGoal, error: testGoalError } = await supabase
        .from('goals')
        .insert([{
          user_id: 'test-user-id',
          title: 'Meta Teste',
          description: 'Teste de inserção',
          target_amount: 1000.00,
          target_date: '2025-12-31',
          category: 'financial',
          type: 'financial'
        }])
        .select()
        .single();

      if (testGoalError) {
        console.log('❌ Erro ao inserir meta teste:', testGoalError);
      } else {
        console.log('✅ Meta teste inserida com sucesso:', testGoal.id);
        
        // Limpar o teste
        await supabase.from('goals').delete().eq('id', testGoal.id);
        console.log('🧹 Meta teste removida');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkPersonalTablesStructure();