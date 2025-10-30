const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFrontendData() {
  try {
    console.log('🔍 Debugando dados para o frontend...');
    
    // Buscar dados como a API faz
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', '21152f1a-3ffd-477a-9016-57f57d2fc0e8');
    
    if (error) {
      console.error('❌ Erro ao buscar metas:', error);
      return;
    }
    
    console.log(`📊 Total de metas encontradas: ${goals.length}`);
    
    // Simular a conversão que o frontend faz
    const goalsForFrontend = goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      category: goal.category,
      type: goal.type,
      targetValue: parseFloat(goal.target_value) || 0,
      currentValue: parseFloat(goal.current_value) || 0,
      unit: goal.unit,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
      createdDate: new Date(goal.created_date),
      priority: goal.priority,
      status: goal.status,
      notes: goal.notes,
      tags: goal.tags || [],
      progress: goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0
    }));
    
    console.log('\n📋 Metas processadas para o frontend:');
    goalsForFrontend.forEach((goal, index) => {
      console.log(`\n${index + 1}. ${goal.name}`);
      console.log(`   Categoria: ${goal.category}`);
      console.log(`   Valor atual: ${goal.currentValue}`);
      console.log(`   Valor alvo: ${goal.targetValue}`);
      console.log(`   Progresso: ${goal.progress.toFixed(1)}%`);
      console.log(`   Status: ${goal.status}`);
      console.log(`   Prioridade: ${goal.priority}`);
      console.log(`   Prazo: ${goal.deadline ? goal.deadline.toLocaleDateString('pt-BR') : 'Sem prazo'}`);
    });
    
    // Verificar especificamente as metas empresariais
    const businessGoals = goalsForFrontend.filter(g => g.category === 'business');
    console.log(`\n🏢 Metas empresariais: ${businessGoals.length}`);
    
    businessGoals.forEach((goal, index) => {
      console.log(`\n🎯 Meta empresarial ${index + 1}: ${goal.name}`);
      console.log(`   Progresso: ${goal.currentValue}/${goal.targetValue} (${goal.progress.toFixed(1)}%)`);
      console.log(`   Status: ${goal.status}`);
    });
    
    // Testar a API diretamente
    console.log('\n🌐 Testando API diretamente...');
    try {
      const response = await fetch(`http://localhost:3000/api/goals?user_id=21152f1a-3ffd-477a-9016-57f57d2fc0e8`);
      const apiData = await response.json();
      
      if (apiData.success) {
        console.log(`✅ API retornou ${apiData.goals.length} metas`);
        console.log('📦 Primeira meta da API:', {
          name: apiData.goals[0]?.name,
          current_value: apiData.goals[0]?.current_value,
          target_value: apiData.goals[0]?.target_value,
          category: apiData.goals[0]?.category
        });
      } else {
        console.log('❌ API retornou erro:', apiData.error);
      }
    } catch (apiError) {
      console.error('❌ Erro ao testar API:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugFrontendData();