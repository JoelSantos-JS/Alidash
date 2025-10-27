// Script para verificar e corrigir usuário existente
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = process.argv[2] || 'joeltere9@gmail.com';

async function checkAndFixUser() {
  try {
    console.log(`🔍 Verificando usuário: ${email}`);
    
    // Buscar usuário no Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários no Auth:', authError.message);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      console.log('❌ Usuário não encontrado no Auth');
      return;
    }
    
    console.log(`✅ Usuário encontrado no Auth:`);
    console.log(`   - ID: ${authUser.id}`);
    console.log(`   - Email: ${authUser.email}`);
    console.log(`   - Criado em: ${authUser.created_at}`);
    
    // Verificar se existe na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário na tabela users:', userError.message);
      return;
    }
    
    if (userData) {
      console.log(`✅ Usuário já existe na tabela users:`);
      console.log(`   - ID: ${userData.id}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Nome: ${userData.name}`);
      console.log(`   - Tipo de conta: ${userData.account_type}`);
    } else {
      console.log(`⚠️ Usuário não existe na tabela users. Criando...`);
      
      // Criar registro na tabela users
      const { data: newUserData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          firebase_uid: authUser.id, // Definir firebase_uid para compatibilidade com RLS
          email: authUser.email,
          name: email.split('@')[0],
          account_type: 'personal',
          created_at: authUser.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar registro na tabela users:', insertError.message);
        return;
      }
      
      console.log(`✅ Registro criado na tabela users:`, newUserData);
    }
    
    console.log('\n🎉 Usuário verificado e configurado com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${authUser.id}`);
    console.log(`🔑 Pode fazer login com a senha configurada`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
checkAndFixUser();