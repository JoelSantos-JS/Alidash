const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersStructure() {
  console.log('🔍 Verificando estrutura da tabela users...\n');

  try {
    // 1. Verificar se a tabela users existe e suas colunas
    console.log('📋 ESTRUTURA DA TABELA USERS:');
    console.log('=====================================');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      // Fallback: tentar buscar dados da tabela diretamente
      console.log('Tentando verificar estrutura através de uma consulta simples...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erro ao acessar tabela users:', sampleError.message);
      } else {
        console.log('✅ Tabela users existe e está acessível');
        if (sampleData && sampleData.length > 0) {
          console.log('Colunas encontradas na tabela users:');
          Object.keys(sampleData[0]).forEach(column => {
            console.log(`  - ${column}`);
          });
        } else {
          console.log('Tabela users está vazia');
        }
      }
    } else {
      console.log('Estrutura da tabela users:');
      tableInfo?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
        if (col.column_default) {
          console.log(`    Default: ${col.column_default}`);
        }
      });
    }

    console.log('\n');

    // 2. Verificar se firebase_uid existe na tabela
    console.log('🔍 VERIFICANDO COLUNA FIREBASE_UID:');
    console.log('=====================================');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.log('❌ Erro ao verificar colunas:', userError.message);
    } else {
      const hasFirebaseUid = userData && userData.length > 0 && 'firebase_uid' in userData[0];
      console.log(`Coluna firebase_uid existe: ${hasFirebaseUid ? '✅ SIM' : '❌ NÃO'}`);
      
      if (hasFirebaseUid) {
        console.log('⚠️  A coluna firebase_uid precisa ser removida');
      } else {
        console.log('✅ A coluna firebase_uid já foi removida ou nunca existiu');
      }
    }

    // 3. Verificar políticas RLS usando uma abordagem diferente
    console.log('\n🔒 VERIFICANDO POLÍTICAS RLS:');
    console.log('=====================================');
    
    // Tentar inserir um registro de teste para verificar RLS
    const testUser = {
      id: 'test-user-id',
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
      if (insertError.message.includes('RLS')) {
        console.log('✅ RLS está ativo na tabela users');
      }
    } else {
      console.log('✅ Usuário de teste inserido com sucesso');
      
      // Remover o usuário de teste
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', 'test-user-id');

      if (deleteError) {
        console.log('⚠️  Erro ao remover usuário de teste:', deleteError.message);
      } else {
        console.log('✅ Usuário de teste removido');
      }
    }

    // 4. Verificar quantos usuários existem
    console.log('\n📊 ESTATÍSTICAS DA TABELA:');
    console.log('=====================================');
    
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Erro ao contar usuários:', countError.message);
    } else {
      console.log(`Total de usuários: ${count || 0}`);
    }

    console.log('\n✅ Verificação completa!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
checkUsersStructure();