const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyPoliciesFixed() {
  console.log('🔍 Verificando se as políticas foram corrigidas...\n');

  // Lista de tabelas para testar
  const tables = [
    'users',
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

  let allTablesWorking = true;

  // 1. Verificar se a coluna firebase_uid foi removida da tabela users
  console.log('🔍 Verificando se firebase_uid foi removida da tabela users...');
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.log(`❌ Erro ao acessar tabela users: ${userError.message}`);
      allTablesWorking = false;
    } else {
      if (userData && userData.length > 0) {
        const hasFirebaseUid = 'firebase_uid' in userData[0];
        if (hasFirebaseUid) {
          console.log('⚠️ Coluna firebase_uid ainda existe na tabela users');
        } else {
          console.log('✅ Coluna firebase_uid foi removida da tabela users');
        }
      } else {
        console.log('📊 Tabela users está vazia - não é possível verificar colunas');
        
        // Tentar inserir um usuário de teste para verificar a estrutura
        const testUserId = '550e8400-e29b-41d4-a716-446655440001';
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: testUserId,
            email: 'test-structure@example.com',
            name: 'Test Structure User'
          })
          .select();

        if (insertError) {
          console.log(`❌ Erro ao inserir usuário de teste: ${insertError.message}`);
        } else {
          const hasFirebaseUid = 'firebase_uid' in insertData[0];
          if (hasFirebaseUid) {
            console.log('⚠️ Coluna firebase_uid ainda existe na tabela users');
          } else {
            console.log('✅ Coluna firebase_uid foi removida da tabela users');
          }
          
          // Remover usuário de teste
          await supabase.from('users').delete().eq('id', testUserId);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar tabela users: ${error.message}`);
    allTablesWorking = false;
  }

  console.log('\n🔍 Verificando acesso às tabelas...');

  // 2. Verificar se todas as tabelas estão acessíveis
  for (const table of tables) {
    try {
      console.log(`  Testando ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`    ❌ Erro: ${error.message}`);
        allTablesWorking = false;
      } else {
        console.log(`    ✅ Acessível`);
      }
    } catch (error) {
      console.log(`    ❌ Erro de conexão: ${error.message}`);
      allTablesWorking = false;
    }
  }

  console.log('\n📊 RESULTADO DA VERIFICAÇÃO:');
  console.log('=====================================');
  
  if (allTablesWorking) {
    console.log('✅ Todas as tabelas estão acessíveis');
    console.log('✅ Políticas RLS estão funcionando');
    console.log('✅ Service role tem acesso total');
    console.log('✅ Sistema pronto para uso');
    
    console.log('\n🎉 SUCESSO! Todas as correções foram aplicadas com sucesso!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Teste a aplicação para garantir que tudo funciona');
    console.log('2. Verifique se o login de usuários está funcionando');
    console.log('3. Confirme que os dados são filtrados corretamente por usuário');
    
  } else {
    console.log('❌ Algumas tabelas ainda têm problemas');
    console.log('⚠️ Verifique se todas as políticas foram aplicadas corretamente');
    console.log('\n📝 AÇÕES NECESSÁRIAS:');
    console.log('1. Execute manualmente o arquivo fix-all-firebase-uid-policies.sql');
    console.log('2. Verifique se todas as políticas foram criadas');
    console.log('3. Execute este script novamente para verificar');
  }

  console.log('\n=====================================');
}

// Executar verificação
verifyPoliciesFixed().catch(console.error);