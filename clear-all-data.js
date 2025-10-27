const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllData() {
  console.log('🗑️ Iniciando limpeza completa do banco de dados...\n');

  try {
    // Lista de todas as tabelas na ordem correta para evitar conflitos de foreign key
    const tables = [
      // Tabelas dependentes primeiro
      'goal_milestones',
      'goal_reminders', 
      'debt_payments',
      'sales',
      'transactions',
      'expenses',
      'revenues',
      'debts',
      'goals',
      'products',
      'bets',
      'dreams',
      'firebase_backup',
      'users' // Por último
    ];

    let totalDeleted = 0;

    for (const table of tables) {
      console.log(`🧹 Limpando tabela: ${table}`);
      
      try {
        const { data, error, count } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.log(`   ⚠️ Erro ao limpar ${table}:`, error.message);
        } else {
          console.log(`   ✅ Tabela ${table} limpa com sucesso`);
          if (count !== null) {
            totalDeleted += count;
            console.log(`   📊 ${count} registros removidos`);
          }
        }
      } catch (tableError) {
        console.log(`   ⚠️ Erro ao acessar tabela ${table}:`, tableError.message);
      }
      
      console.log(''); // Linha em branco para separar
    }

    console.log('🎉 Limpeza completa finalizada!');
    console.log(`📊 Total de registros removidos: ${totalDeleted}`);
    console.log('\n✨ Banco de dados está agora completamente limpo e pronto para novos dados!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar a limpeza
clearAllData();