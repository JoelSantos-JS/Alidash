// Script para testar o fluxo completo de login
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'joeltere9@gmail.com';
const password = 'joel123';

async function testLoginFlow() {
  try {
    console.log(`🔐 Testando login do usuário: ${email}\n`);
    
    // 1. Tentar fazer login
    console.log('1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log(`   - User ID: ${authData.user.id}`);
    console.log(`   - Email: ${authData.user.email}`);
    
    // 2. Simular o loadUserData
    console.log('\n2. Simulando loadUserData...');
    
    // Tentar buscar por ID primeiro
    console.log(`   Buscando usuário por ID: ${authData.user.id}`);
    const { data: userById, error: userByIdError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (userByIdError && userByIdError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar por ID:', userByIdError.message);
      return;
    }
    
    if (userById) {
      console.log('✅ Usuário encontrado por ID:', {
        id: userById.id,
        email: userById.email,
        name: userById.name,
        account_type: userById.account_type
      });
    } else {
      console.log('⚠️ Usuário não encontrado por ID, tentando por email...');
      
      // Tentar buscar por email
      const { data: userByEmail, error: userByEmailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();
      
      if (userByEmailError && userByEmailError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar por email:', userByEmailError.message);
        return;
      }
      
      if (userByEmail) {
        console.log('✅ Usuário encontrado por email:', {
          id: userByEmail.id,
          email: userByEmail.email,
          name: userByEmail.name,
          account_type: userByEmail.account_type
        });
      } else {
        console.log('❌ Usuário não encontrado nem por ID nem por email');
        return;
      }
    }
    
    // 3. Atualizar last_login
    console.log('\n3. Atualizando last_login...');
    const userData = userById || userByEmail;
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar last_login:', updateError.message);
    } else {
      console.log('✅ Last_login atualizado com sucesso');
    }
    
    // 4. Fazer logout
    console.log('\n4. Fazendo logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso');
    }
    
    console.log('\n🎉 Fluxo de login testado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
testLoginFlow();