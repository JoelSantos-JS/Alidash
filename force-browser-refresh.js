const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceBrowserRefresh() {
  try {
    console.log('🔄 Forçando atualização do cache do navegador...');
    
    // Atualizar o timestamp de todas as metas para forçar refresh
    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('id, name')
      .eq('user_id', '21152f1a-3ffd-477a-9016-57f57d2fc0e8');
    
    if (fetchError) {
      console.error('❌ Erro ao buscar metas:', fetchError);
      return;
    }
    
    console.log(`📊 Encontradas ${goals.length} metas para atualizar`);
    
    // Atualizar o updated_at de todas as metas
    const { data: updatedGoals, error: updateError } = await supabase
      .from('goals')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', '21152f1a-3ffd-477a-9016-57f57d2fc0e8')
      .select('id, name, updated_at');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar timestamps:', updateError);
      return;
    }
    
    console.log(`✅ ${updatedGoals.length} metas atualizadas com novos timestamps`);
    
    // Mostrar algumas metas atualizadas
    updatedGoals.slice(0, 3).forEach((goal, index) => {
      console.log(`${index + 1}. ${goal.name} - Atualizado em: ${new Date(goal.updated_at).toLocaleString('pt-BR')}`);
    });
    
    console.log('\n🌐 Agora atualize a página no navegador (Ctrl+F5 ou Ctrl+Shift+R)');
    console.log('📱 Ou abra o DevTools e desabilite o cache temporariamente');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

forceBrowserRefresh();