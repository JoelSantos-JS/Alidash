const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured');
  process.exit(1);
}

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
