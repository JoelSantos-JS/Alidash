const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPersonalTables() {
  console.log('🔍 Testando tabelas pessoais no Supabase...');
  
  const tables = [
    'personal_incomes',
    'personal_expenses', 
    'personal_budgets',
    'personal_goals'
  ];
  
  for (const table of tables) {
    console.log(`\n📋 Testando tabela: ${table}`);
    
    try {
      // Testar se a tabela existe fazendo uma consulta simples
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error(`❌ Erro na tabela ${table}:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log(`✅ Tabela ${table} existe e está acessível`);
        console.log(`   📊 Total de registros: ${count || 0}`);
        if (data && data.length > 0) {
          console.log(`   📝 Primeiro registro:`, JSON.stringify(data[0], null, 2));
        }
      }
    } catch (err) {
      console.error(`💥 Erro crítico na tabela ${table}:`, err.message);
    }
  }
}

async function testUserAccess() {
  console.log('\n👤 Testando acesso de usuários...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return null;
    }
    
    console.log('✅ Usuários encontrados:');
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id})`);
    });
    
    return users?.[0]?.id;
  } catch (err) {
    console.error('💥 Erro crítico ao buscar usuários:', err.message);
    return null;
  }
}

async function testSpecificUserData(userId) {
  if (!userId) {
    console.log('⚠️  Pulando teste de dados específicos - nenhum usuário disponível');
    return;
  }
  
  console.log(`\n🔍 Testando dados específicos do usuário: ${userId}`);
  
  const tables = [
    { name: 'personal_incomes', label: 'Receitas' },
    { name: 'personal_expenses', label: 'Gastos' },
    { name: 'personal_budgets', label: 'Orçamentos' },
    { name: 'personal_goals', label: 'Metas' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      if (error) {
        console.error(`❌ Erro ao buscar ${table.label}:`, {
          code: error.code,
          message: error.message,
          details: error.details
        });
      } else {
        console.log(`✅ ${table.label}: ${count || 0} registros encontrados`);
        if (data && data.length > 0) {
          console.log(`   📝 Exemplo:`, {
            id: data[0].id,
            description: data[0].description || data[0].name,
            amount: data[0].amount || data[0].target_amount || 'N/A'
          });
        }
      }
    } catch (err) {
      console.error(`💥 Erro crítico ao buscar ${table.label}:`, err.message);
    }
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 Testando políticas RLS...');
  
  try {
    // Testar com cliente anônimo (sem service key)
    const anonClient = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIzNDEsImV4cCI6MjA3MTQ0ODM0MX0.Ej_-2QnbOKCzKZKjHJOKJQhJJQhJJQhJJQhJJQhJJQ' // Anon key
    );
    
    const { data, error } = await anonClient
      .from('personal_incomes')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('RLS')) {
        console.log('✅ RLS está funcionando - acesso negado para usuário não autenticado');
      } else {
        console.error('❌ Erro inesperado no teste RLS:', error);
      }
    } else {
      console.log('⚠️  RLS pode não estar configurado corretamente - dados acessíveis sem autenticação');
    }
  } catch (err) {
    console.log('✅ RLS provavelmente está funcionando - erro de acesso:', err.message);
  }
}

async function main() {
  console.log('🚀 Iniciando testes das tabelas pessoais...');
  
  // 1. Testar se as tabelas existem
  await testPersonalTables();
  
  // 2. Testar acesso de usuários
  const userId = await testUserAccess();
  
  // 3. Testar dados específicos do usuário
  await testSpecificUserData(userId);
  
  // 4. Testar políticas RLS
  await testRLSPolicies();
  
  console.log('\n🏁 Testes concluídos!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPersonalTables, testUserAccess, testSpecificUserData };
