require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Simular as funções do SupabaseService
const getUserById = async (id) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log('❌ Erro ao buscar por ID:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.log('❌ Erro geral ao buscar por ID:', error.message);
    return null;
  }
};

const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.log('❌ Erro ao buscar por email:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.log('❌ Erro geral ao buscar por email:', error.message);
    return null;
  }
};

const createUser = async (userData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.log('❌ Erro ao criar usuário:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.log('❌ Erro geral ao criar usuário:', error);
    throw error;
  }
};

async function testFrontendLogin() {
  try {
    console.log('🔐 Testando fluxo de login do frontend...');
    
    // 1. Fazer login com usuário existente
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'joeltere9@gmail.com',
      password: 'Teste123!'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log('✅ Login bem-sucedido:', authData.user.email);
    console.log('🆔 User ID:', authData.user.id);

    // 2. Simular loadUserData
    console.log('\n🔍 Simulando loadUserData...');
    
    // Try to get user by Supabase UUID first using admin service
    let userData = await getUserById(authData.user.id);
    console.log('📊 User data by ID:', userData ? '✅ Encontrado' : '❌ Não encontrado');
    
    // If not found, try to get by email (for migrated users)
    if (!userData) {
      console.log('🔄 User not found by ID, trying by email...');
      userData = await getUserByEmail(authData.user.email);
      console.log('📊 User data by email:', userData ? '✅ Encontrado' : '❌ Não encontrado');
      
      if (!userData) {
        console.log('➕ Creating new user record...');
        // Create a new user record using admin service to bypass RLS
        userData = await createUser({
          id: authData.user.id, // Use Supabase Auth ID
          email: authData.user.email,
          name: authData.user.user_metadata?.name || null,
          account_type: 'personal'
        });
        console.log('✅ New user created:', userData);
      }
    }

    if (userData) {
      console.log('\n🎉 Fluxo de login completo bem-sucedido!');
      console.log('👤 Dados do usuário:', {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        account_type: userData.account_type
      });
    } else {
      console.log('\n❌ Falha no fluxo de login - usuário não encontrado/criado');
    }

    // 3. Fazer logout
    await supabase.auth.signOut();
    console.log('🚪 Logout realizado');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testFrontendLogin();