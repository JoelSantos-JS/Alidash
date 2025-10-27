const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUsersPolicies() {
  console.log('🔄 Verificando e testando políticas da tabela users...\n');

  try {
    // 1. Verificar se conseguimos acessar a tabela users
    console.log('📋 Verificando acesso à tabela users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
      return;
    } else {
      console.log('✅ Tabela users acessível');
      console.log(`📊 Total de usuários: ${usersData?.length || 0}`);
    }

    // 2. Testar inserção de usuário (para verificar políticas)
    console.log('\n🧪 Testando políticas de inserção...');
    
    const testUserId = 'test-' + Date.now();
    const testUser = {
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir usuário de teste:', insertError.message);
      
      if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
        console.log('⚠️  RLS está ativo e bloqueando inserções não autorizadas');
        console.log('📝 Isso indica que as políticas estão funcionando');
      }
    } else {
      console.log('✅ Usuário de teste inserido com sucesso');
      console.log('📝 Isso indica que as políticas permitem inserção com service role');
      
      // Remover o usuário de teste
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);

      if (deleteError) {
        console.log('⚠️  Erro ao remover usuário de teste:', deleteError.message);
      } else {
        console.log('✅ Usuário de teste removido');
      }
    }

    // 3. Verificar se existem referências ao firebase_uid em outras tabelas
    console.log('\n🔍 Verificando dependências do firebase_uid em outras tabelas...');
    
    const tablesToCheck = [
      'products', 'sales', 'transactions', 'debts', 'debt_payments',
      'goals', 'goal_milestones', 'goal_reminders', 'dreams', 'bets',
      'revenues', 'expenses', 'personal_budgets', 'personal_goals',
      'personal_incomes', 'personal_expenses'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (!error && data) {
          const hasUserIdField = data.length > 0 && 'user_id' in data[0];
          const hasFirebaseUidField = data.length > 0 && 'firebase_uid' in data[0];
          
          console.log(`  📋 ${table}: ${hasUserIdField ? '✅ user_id' : '❌ sem user_id'} ${hasFirebaseUidField ? '⚠️ firebase_uid' : '✅ sem firebase_uid'}`);
        }
      } catch (err) {
        console.log(`  📋 ${table}: ❌ erro ao verificar`);
      }
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n📋 INSTRUÇÕES PARA ATUALIZAR POLÍTICAS MANUALMENTE:');
    console.log('=====================================');
    console.log('Como não conseguimos executar SQL diretamente, você pode:');
    console.log('');
    console.log('1. Acessar o painel do Supabase: https://supabase.com/dashboard');
    console.log('2. Ir para SQL Editor');
    console.log('3. Executar o arquivo update-users-policies.sql');
    console.log('');
    console.log('Ou usar o Supabase CLI:');
    console.log('supabase db reset --linked');
    console.log('');
    console.log('📄 O arquivo update-users-policies.sql contém todos os comandos necessários');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
updateUsersPolicies();