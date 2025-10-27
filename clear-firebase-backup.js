const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearFirebaseBackup() {
  try {
    console.log('🗑️ Limpando tabela firebase_backup...');
    
    // Usar SQL direto para limpar a tabela
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'DELETE FROM firebase_backup'
    });
    
    if (error) {
      console.log('⚠️ Tentando método alternativo...');
      // Método alternativo: buscar todos os IDs e deletar um por um
      const { data: records, error: fetchError } = await supabase
        .from('firebase_backup')
        .select('id');
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (records && records.length > 0) {
        for (const record of records) {
          const { error: deleteError } = await supabase
            .from('firebase_backup')
            .delete()
            .eq('id', record.id);
          
          if (deleteError) {
            console.log(`❌ Erro ao deletar registro ${record.id}:`, deleteError.message);
          } else {
            console.log(`✅ Registro ${record.id} deletado`);
          }
        }
      }
    } else {
      console.log('✅ Tabela firebase_backup limpa com sucesso');
    }
    
    // Verificar se está vazia
    const { count, error: countError } = await supabase
      .from('firebase_backup')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('⚠️ Erro ao verificar contagem:', countError.message);
    } else {
      console.log(`📊 Registros restantes na firebase_backup: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar firebase_backup:', error.message);
  }
}

clearFirebaseBackup();