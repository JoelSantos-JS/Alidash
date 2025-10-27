const fetch = require('node-fetch');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Erro HTTP ${response.status}: ${error}`);
      return false;
    }

    console.log(`✅ Executado com sucesso`);
    return true;
  } catch (err) {
    console.log(`❌ Erro de execução: ${err.message}`);
    return false;
  }
}

async function fixPoliciesManually() {
  console.log('🔧 Tentando corrigir políticas via REST API...\n');

  // Como a função exec_sql não está disponível, vamos mostrar as instruções manuais
  console.log('⚠️ A função exec_sql não está disponível no Supabase.');
  console.log('📝 Você precisa executar manualmente no painel do Supabase:\n');

  console.log('=====================================');
  console.log('INSTRUÇÕES PARA EXECUÇÃO MANUAL:');
  console.log('=====================================\n');

  console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
  console.log('2. Vá para seu projeto VoxCash');
  console.log('3. Clique em "SQL Editor" no menu lateral');
  console.log('4. Execute os seguintes comandos SQL:\n');

  // Lista de comandos SQL para executar
  const sqlCommands = [
    '-- REMOVER POLÍTICAS ANTIGAS',
    'DROP POLICY IF EXISTS "products_own_data" ON products;',
    'DROP POLICY IF EXISTS "sales_own_data" ON sales;',
    'DROP POLICY IF EXISTS "transactions_own_data" ON transactions;',
    'DROP POLICY IF EXISTS "debts_own_data" ON debts;',
    'DROP POLICY IF EXISTS "debt_payments_own_data" ON debt_payments;',
    'DROP POLICY IF EXISTS "goal_milestones_own_data" ON goal_milestones;',
    'DROP POLICY IF EXISTS "goal_reminders_own_data" ON goal_reminders;',
    'DROP POLICY IF EXISTS "dreams_own_data" ON dreams;',
    'DROP POLICY IF EXISTS "bets_own_data" ON bets;',
    'DROP POLICY IF EXISTS "revenues_own_data" ON revenues;',
    'DROP POLICY IF EXISTS "expenses_own_data" ON expenses;',
    'DROP POLICY IF EXISTS "goals_own_data" ON goals;',
    'DROP POLICY IF EXISTS "users_service_role_policy" ON users;',
    'DROP POLICY IF EXISTS "Users can view own personal incomes" ON personal_incomes;',
    '',
    '-- CRIAR NOVAS POLÍTICAS',
    `CREATE POLICY "products_own_data" ON products FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "sales_own_data" ON sales FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "transactions_own_data" ON transactions FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "debts_own_data" ON debts FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "debt_payments_own_data" ON debt_payments FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "goal_milestones_own_data" ON goal_milestones FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "goal_reminders_own_data" ON goal_reminders FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "dreams_own_data" ON dreams FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "bets_own_data" ON bets FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "revenues_own_data" ON revenues FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "expenses_own_data" ON expenses FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "goals_own_data" ON goals FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "Users can view own personal incomes" ON personal_incomes FOR ALL USING (auth.role() = 'service_role' OR user_id = auth.uid());`,
    `CREATE POLICY "users_service_role_policy" ON users FOR ALL USING (auth.role() = 'service_role' OR id = auth.uid());`,
    '',
    '-- REMOVER COLUNA FIREBASE_UID',
    'ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;'
  ];

  sqlCommands.forEach(cmd => {
    console.log(cmd);
  });

  console.log('\n=====================================');
  console.log('ARQUIVO SQL CRIADO:');
  console.log('=====================================');
  console.log('📄 Você também pode usar o arquivo: fix-all-firebase-uid-policies.sql');
  console.log('📋 Copie e cole o conteúdo desse arquivo no SQL Editor do Supabase');

  console.log('\n=====================================');
  console.log('APÓS EXECUTAR:');
  console.log('=====================================');
  console.log('✅ Todas as políticas serão atualizadas');
  console.log('✅ A coluna firebase_uid será removida');
  console.log('✅ O sistema funcionará apenas com user_id/id');
  console.log('✅ Service role manterá acesso total');
}

// Executar
fixPoliciesManually().catch(console.error);