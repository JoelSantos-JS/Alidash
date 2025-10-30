const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRefreshGoals() {
  try {
    console.log('🔄 Forçando atualização das metas...');
    
    // Buscar todas as metas
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', '21152f1a-3ffd-477a-9016-57f57d2fc0e8');
    
    if (error) {
      console.error('❌ Erro ao buscar metas:', error);
      return;
    }
    
    console.log(`📊 Encontradas ${goals.length} metas`);
    
    // Atualizar o timestamp de updated_at de todas as metas para forçar refresh
    for (const goal of goals) {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar meta ${goal.name}:`, updateError);
      } else {
        console.log(`✅ Meta "${goal.name}" atualizada`);
      }
    }
    
    console.log('🎯 Todas as metas foram atualizadas!');
    console.log('💡 Agora recarregue a página no navegador (Ctrl+F5) para ver as mudanças');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

forceRefreshGoals();