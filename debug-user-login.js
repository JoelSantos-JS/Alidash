// Script para debugar o problema de login do usuário joeltere9@gmail.com
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

const email = 'joeltere9@gmail.com';

async function debugUserLogin() {
  try {
    console.log(`🔍 Debugando login do usuário: ${email}\n`);
    
    // 1. Verificar se o usuário existe no Supabase Auth
    console.log('1. Verificando usuário no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
      return;
    }
    
    const authUser = authUsers.users.find(user => user.email === email);
    if (authUser) {
      console.log(`✅ Usuário encontrado no Auth:`);
      console.log(`   - ID: ${authUser.id}`);
      console.log(`   - Email: ${authUser.email}`);
      console.log(`   - Email confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${authUser.created_at}`);
    } else {
      console.log('❌ Usuário não encontrado no Auth');
      return;
    }
    
    // 2. Verificar se o usuário existe na tabela users
    console.log('\n2. Verificando usuário na tabela users...');
    
    // Por ID
    console.log(`   Buscando por ID: ${authUser.id}`);
    const { data: userById, error: userByIdError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (userByIdError) {
      console.log(`   ❌ Erro ao buscar por ID: ${userByIdError.message} (código: ${userByIdError.code})`);
    } else {
      console.log(`   ✅ Usuário encontrado por ID:`, {
        id: userById.id,
        email: userById.email,
        name: userById.name,
        account_type: userById.account_type
      });
    }
    
    // Por email
    console.log(`   Buscando por email: ${email}`);
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userByEmailError) {
      console.log(`   ❌ Erro ao buscar por email: ${userByEmailError.message} (código: ${userByEmailError.code})`);
    } else {
      console.log(`   ✅ Usuário encontrado por email:`, {
        id: userByEmail.id,
        email: userByEmail.email,
        name: userByEmail.name,
        account_type: userByEmail.account_type
      });
    }
    
    // 3. Listar todos os usuários na tabela users para verificar
    console.log('\n3. Listando todos os usuários na tabela users...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, name, account_type')
      .order('created_at', { ascending: false });
    
    if (allUsersError) {
      console.error('❌ Erro ao listar usuários:', allUsersError.message);
    } else {
      console.log(`📋 Total de usuários na tabela: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }
    
    // 4. Tentar criar o usuário na tabela se não existir
    if (userByIdError && userByIdError.code === 'PGRST116') {
      console.log('\n4. Usuário não existe na tabela users, criando...');
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.email.split('@')[0],
          account_type: 'personal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar usuário na tabela:', createError.message);
      } else {
        console.log('✅ Usuário criado na tabela users:', newUser);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
debugUserLogin();