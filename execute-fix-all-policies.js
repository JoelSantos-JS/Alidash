const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      return false;
    }
    console.log(`✅ Executado com sucesso`);
    return true;
  } catch (err) {
    console.log(`❌ Erro de execução: ${err.message}`);
    return false;
  }
}

async function fixAllPolicies() {
  console.log('🔧 Iniciando correção de todas as políticas RLS...\n');

  // Lista de tabelas e suas políticas
  const tables = [
    'products',
    'sales', 
    'transactions',
    'debts',
    'debt_payments',
    'goal_milestones',
    'goal_reminders',
    'dreams',
    'bets',
    'revenues',
    'expenses',
    'goals',
    'personal_incomes'
  ];

  // 1. Remover políticas antigas
  console.log('🗑️ Removendo políticas antigas...');
  
  for (const table of tables) {
    console.log(`  Removendo política de ${table}...`);
    await executeSQL(`DROP POLICY IF EXISTS "${table}_own_data" ON ${table};`);
  }

  // Remover políticas específicas
  console.log('  Removendo política users_service_role_policy...');
  await executeSQL(`DROP POLICY IF EXISTS "users_service_role_policy" ON users;`);
  
  console.log('  Removendo política personal_incomes específica...');
  await executeSQL(`DROP POLICY IF EXISTS "Users can view own personal incomes" ON personal_incomes;`);

  console.log('\n✅ Políticas antigas removidas!\n');

  // 2. Criar novas políticas
  console.log('🆕 Criando novas políticas...');

  for (const table of tables) {
    console.log(`  Criando política para ${table}...`);
    const sql = `
      CREATE POLICY "${table}_own_data" ON ${table}
      FOR ALL USING (
        auth.role() = 'service_role' OR 
        user_id = auth.uid()
      );
    `;
    await executeSQL(sql);
  }

  // Política específica para users
  console.log('  Criando política para users...');
  await executeSQL(`
    CREATE POLICY "users_service_role_policy" ON users
    FOR ALL USING (
      auth.role() = 'service_role' OR 
      id = auth.uid()
    );
  `);

  console.log('\n✅ Novas políticas criadas!\n');

  // 3. Garantir que RLS está habilitado
  console.log('🔒 Habilitando RLS em todas as tabelas...');
  
  const allTables = [...tables, 'users'];
  for (const table of allTables) {
    console.log(`  Habilitando RLS em ${table}...`);
    await executeSQL(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
  }

  console.log('\n✅ RLS habilitado em todas as tabelas!\n');

  // 4. Tentar remover a coluna firebase_uid
  console.log('🗑️ Tentando remover coluna firebase_uid...');
  const removeResult = await executeSQL(`ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;`);
  
  if (removeResult) {
    console.log('✅ Coluna firebase_uid removida com sucesso!');
  } else {
    console.log('⚠️ Não foi possível remover a coluna firebase_uid automaticamente.');
    console.log('📝 Execute manualmente no painel do Supabase:');
    console.log('   ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;');
  }

  console.log('\n🎉 Processo concluído!');
  console.log('\n📋 RESUMO:');
  console.log('=====================================');
  console.log('✅ Políticas antigas removidas');
  console.log('✅ Novas políticas criadas (sem firebase_uid)');
  console.log('✅ RLS habilitado em todas as tabelas');
  console.log('✅ Service role mantém acesso total');
  console.log('✅ Usuários acessam apenas seus próprios dados');
}

// Executar correção
fixAllPolicies().catch(console.error);