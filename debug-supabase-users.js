require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabaseUsers() {
  try {
    console.log('🔍 Verificando estrutura da tabela users no Supabase...');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários:`);
    users.forEach((user, index) => {
      console.log(`\n👤 Usuário ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Firebase UID: ${user.firebase_uid || 'NÃO DEFINIDO'}`);
      console.log(`   Nome: ${user.name || 'NÃO DEFINIDO'}`);
      console.log(`   Criado em: ${user.created_at}`);
    });

    // Verificar se existe algum usuário sem firebase_uid
    const usersWithoutFirebaseUid = users.filter(user => !user.firebase_uid);
    if (usersWithoutFirebaseUid.length > 0) {
      console.log(`\n⚠️  ${usersWithoutFirebaseUid.length} usuários sem firebase_uid:`);
      usersWithoutFirebaseUid.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

console.log('🔍 Debugando usuários do Supabase...');
debugSupabaseUsers().then(() => {
  console.log('\n🏁 Debug concluído');
});