// Script para verificar a estrutura da tabela de usuários
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTable() {
  console.log('🔍 Verificando tabela de usuários...\n');
  
  try {
    // 1. Verificar todos os usuários
    console.log('1️⃣ Listando todos os usuários:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`📊 Total de usuários: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 Usuário ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Firebase UID: ${user.firebase_uid || 'NÃO DEFINIDO'}`);
      console.log(`   Nome: ${user.name || 'NÃO DEFINIDO'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log('');
    });
    
    // 2. Verificar se há usuários sem firebase_uid
    const usersWithoutFirebaseUid = users.filter(user => !user.firebase_uid);
    
    if (usersWithoutFirebaseUid.length > 0) {
      console.log(`⚠️  ${usersWithoutFirebaseUid.length} usuário(s) sem Firebase UID:`);
      usersWithoutFirebaseUid.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log('');
    }
    
    // 3. Verificar transações para cada usuário
    console.log('3️⃣ Verificando transações por usuário:');
    
    for (const user of users) {
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      
      if (!transError) {
        console.log(`💳 ${user.email}: ${transactions.length} transações`);
      }
    }
    
    console.log('\n4️⃣ Verificando receitas por usuário:');
    
    for (const user of users) {
      const { data: revenues, error: revError } = await supabase
        .from('revenues')
        .select('*')
        .eq('user_id', user.id);
      
      if (!revError) {
        console.log(`💰 ${user.email}: ${revenues.length} receitas`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkUsersTable();