// Script para adicionar usuário diretamente no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Dados do usuário (podem ser passados como argumentos)
const email = process.argv[2] || 'joeltere9@gmail.com';
const password = process.argv[3] || 'joel';

async function addUser() {
  try {
    console.log(`🔄 Criando usuário: ${email}`);
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Confirma o email automaticamente
    });
    
    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      return;
    }
    
    console.log(`✅ Usuário criado no Auth com sucesso!`);
    console.log(`   - ID: ${authData.user.id}`);
    console.log(`   - Email: ${authData.user.email}`);
    
    // Criar registro na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        firebase_uid: authData.user.id, // Definir firebase_uid para compatibilidade com RLS
        email: authData.user.email,
        name: email.split('@')[0], // Usar parte do email como nome inicial
        account_type: 'personal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erro ao criar registro na tabela users:', userError.message);
      return;
    }
    
    console.log(`✅ Registro criado na tabela users:`, userData);
    
    // As tabelas pessoais serão criadas automaticamente quando o usuário fizer login
    // devido às políticas RLS e triggers configurados
    console.log(`✅ Usuário configurado para usar tabelas pessoais automaticamente`);
    
    console.log('\n🎉 Usuário criado com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`🆔 User ID: ${authData.user.id}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
addUser();