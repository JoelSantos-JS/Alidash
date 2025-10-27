// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseUsers() {
  console.log('🔍 Verificando usuários no Supabase...\n');
  
  try {
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no Supabase');
      console.log('💡 Você precisa criar um usuário primeiro');
      return;
    }
    
    console.log(`✅ ${users.length} usuário(s) encontrado(s) no Supabase:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name || 'N/A'}`);
      console.log(`   Firebase UID: ${user.firebase_uid || 'N/A'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log('');
    });
    
    // Verificar se existe o usuário específico
    const targetUser = users.find(u => 
      u.email === 'davi10@gmail.com'
    );
    
    if (targetUser) {
      console.log('🎯 Usuário davi10@gmail.com encontrado no Supabase!');
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Firebase UID: ${targetUser.firebase_uid || 'N/A'}`);
      console.log(`   Criado em: ${targetUser.created_at}`);
    } else {
      console.log('⚠️ Usuário davi10@gmail.com NÃO encontrado no Supabase');
      console.log('💡 Precisamos sincronizar este usuário com o Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

// Executar verificação
checkSupabaseUsers();