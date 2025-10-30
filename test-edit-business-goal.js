const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEditBusinessGoal() {
  try {
    console.log('🔍 Buscando uma meta empresarial para editar...');
    
    // Primeiro, vamos ver todas as metas para debug
    const { data: allGoals, error: allError } = await supabase
      .from('goals')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as metas:', allError);
      return;
    }
    
    console.log(`📊 Total de metas encontradas: ${allGoals?.length || 0}`);
    const businessGoals = allGoals?.filter(g => g.category === 'business') || [];
    console.log(`🏢 Metas empresariais encontradas: ${businessGoals.length}`);
    
    if (businessGoals.length > 0) {
      console.log('📋 Primeira meta empresarial:');
      console.log(businessGoals[0]);
    }
    
    // Buscar uma meta empresarial existente
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('category', 'business')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar metas:', fetchError);
      return;
    }
    
    console.log(`🔍 Resultado da consulta específica: ${goals?.length || 0} metas`);
    
    if (!goals || goals.length === 0) {
      console.log('❌ Nenhuma meta empresarial encontrada para editar');
      return;
    }

    const goalToEdit = goals[0];
    console.log(`✅ Meta encontrada: ${goalToEdit.title}`);
    console.log(`📊 Progresso atual: ${goalToEdit.current_value}/${goalToEdit.target_value}`);

    // Simular uma edição - vamos aumentar o valor atual
    const newCurrentValue = goalToEdit.current_value + 1000;
    
    console.log(`🔄 Editando meta: ${goalToEdit.title}`);
    console.log(`📈 Novo valor: ${newCurrentValue}/${goalToEdit.target_value}`);

    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({ 
        current_value: newCurrentValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalToEdit.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar meta:', updateError);
      return;
    }

    console.log('✅ Meta atualizada com sucesso!');
    console.log(`📊 Novo progresso: ${updatedGoal.current_value}/${updatedGoal.target_value}`);
    console.log(`📈 Percentual: ${((updatedGoal.current_value / updatedGoal.target_value) * 100).toFixed(1)}%`);

    // Testar se a edição persiste
    console.log('\n🔍 Verificando se a edição foi persistida...');
    const { data: verifyGoal, error: verifyError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalToEdit.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar meta:', verifyError);
      return;
    }

    if (verifyGoal.current_value === newCurrentValue) {
      console.log('✅ Edição confirmada! A meta foi atualizada corretamente.');
    } else {
      console.log('❌ Problema: A edição não foi persistida corretamente.');
    }

    // Reverter a mudança para não afetar os dados
    console.log('\n🔄 Revertendo a mudança...');
    await supabase
      .from('goals')
      .update({ 
        current_value: goalToEdit.current_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalToEdit.id);

    console.log('✅ Teste de edição concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testEditBusinessGoal();