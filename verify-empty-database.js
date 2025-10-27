const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEmptyDatabase() {
  console.log('🔍 Verificando se o banco de dados está realmente vazio...\n');

  const tables = [
    'users',
    'products', 
    'sales',
    'transactions',
    'expenses',
    'revenues',
    'debts',
    'debt_payments',
    'goals',
    'goal_milestones',
    'goal_reminders',
    'bets',
    'dreams',
    'firebase_backup'
  ];

  let totalRecords = 0;
  let isEmpty = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Erro ao verificar ${table}:`, error.message);
      } else {
        const recordCount = count || 0;
        totalRecords += recordCount;
        
        if (recordCount > 0) {
          isEmpty = false;
          console.log(`📊 ${table}: ${recordCount} registros encontrados`);
        } else {
          console.log(`✅ ${table}: vazia`);
        }
      }
    } catch (tableError) {
      console.log(`⚠️ Tabela ${table} não encontrada ou inacessível`);
    }
  }

  console.log('\n' + '='.repeat(50));
  
  if (isEmpty) {
    console.log('🎉 SUCESSO! O banco de dados está completamente vazio!');
    console.log('✨ Pronto para adicionar novos dados um por um.');
  } else {
    console.log(`⚠️ Ainda existem ${totalRecords} registros no banco de dados.`);
    console.log('Pode ser necessário executar a limpeza novamente.');
  }
  
  console.log('='.repeat(50));
}

// Executar a verificação
verifyEmptyDatabase();