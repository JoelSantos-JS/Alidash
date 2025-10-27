require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testLoginRedirectFlow() {
  console.log('🧪 Testando fluxo de login e identificando problema de redirecionamento...');
  
  try {
    // Initialize Supabase clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test credentials
    const email = 'joeltere9@gmail.com';
    const password = 'joel123';
    
    console.log('\n🔐 Passo 1: Tentando fazer login...');
    console.log('📧 Email:', email);
    
    // Step 1: Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError.message);
      return;
    }
    
    console.log('✅ Autenticação bem-sucedida!');
    console.log('👤 Supabase User ID:', authData.user.id);
    console.log('📧 Email confirmado:', authData.user.email);
    console.log('🆔 ID Type:', typeof authData.user.id);
    
    // Step 2: Check if user exists in users table
    console.log('\n🔍 Passo 2: Verificando usuário na tabela users...');
    
    // Check if the ID is a valid UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authData.user.id);
    console.log('🆔 ID é UUID válido:', isValidUUID);
    console.log('🆔 ID value:', authData.user.id);
    
    let userData = null;
    
    // Try to find user by ID first
    if (isValidUUID) {
      console.log('🔍 Procurando por ID...');
      const { data: userById, error: userByIdError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (!userByIdError && userById) {
        userData = userById;
        console.log('✅ Usuário encontrado por ID:', userData.email);
      } else {
        console.log('⚠️ Usuário não encontrado por ID:', userByIdError?.message);
      }
    }
    
    // Try to find by firebase_uid if not found by ID
    if (!userData) {
      console.log('🔍 Procurando por firebase_uid...');
      const { data: userByFirebaseUid, error: userByFirebaseUidError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('firebase_uid', authData.user.id)
        .single();
      
      if (!userByFirebaseUidError && userByFirebaseUid) {
        userData = userByFirebaseUid;
        console.log('✅ Usuário encontrado por firebase_uid:', userData.email);
      } else {
        console.log('⚠️ Usuário não encontrado por firebase_uid:', userByFirebaseUidError?.message);
      }
    }
    
    // Try to find by email if still not found
    if (!userData) {
      console.log('🔍 Procurando por email...');
      const { data: userByEmail, error: userByEmailError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();
      
      if (!userByEmailError && userByEmail) {
        userData = userByEmail;
        console.log('✅ Usuário encontrado por email:', userData.email);
      } else {
        console.log('⚠️ Usuário não encontrado por email:', userByEmailError?.message);
      }
    }
    
    // Step 3: Analyze the current state
    console.log('\n📊 Passo 3: Analisando estado atual...');
    console.log('  - Auth Session:', !!authData.session);
    console.log('  - Auth User:', !!authData.user);
    console.log('  - User Data:', !!userData);
    
    if (userData) {
      console.log('  - User ID:', userData.id);
      console.log('  - Firebase UID:', userData.firebase_uid);
      console.log('  - Email:', userData.email);
      console.log('  - Account Type:', userData.account_type);
      console.log('  - Last Login:', userData.last_login);
    }
    
    // Step 4: Simulate the frontend auth state change
    console.log('\n🔄 Passo 4: Simulando mudança de estado no frontend...');
    
    // This is what should happen in the useAuth hook:
    // 1. onAuthStateChange fires
    // 2. session and supabaseUser are set
    // 3. loadUserData is called
    // 4. user state is set
    // 5. redirect logic runs
    
    console.log('📝 Sequência esperada:');
    console.log('  1. ✅ onAuthStateChange detecta login');
    console.log('  2. ✅ Session e supabaseUser definidos');
    console.log('  3. ✅ loadUserData encontra/cria usuário');
    console.log('  4. ✅ Estado user definido');
    console.log('  5. 🤔 Lógica de redirecionamento executa');
    
    // Step 5: Check redirect conditions
    console.log('\n🧭 Passo 5: Verificando condições de redirecionamento...');
    const currentPath = '/login'; // Simulating being on login page
    const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/cadastro');
    const hasUser = !!userData;
    const loading = false; // After auth state change completes
    
    console.log('  - Current Path:', currentPath);
    console.log('  - Is Auth Page:', isAuthPage);
    console.log('  - Has User:', hasUser);
    console.log('  - Loading:', loading);
    
    console.log('\n🎯 Resultado esperado:');
    if (!loading) {
      if (!hasUser && !isAuthPage) {
        console.log('  → Deveria redirecionar para /login');
      } else if (hasUser && isAuthPage) {
        console.log('  → ✅ Deveria redirecionar para / (dashboard)');
        console.log('  → Esta é a condição atual - o redirecionamento deveria acontecer!');
      } else {
        console.log('  → Nenhum redirecionamento necessário');
      }
    } else {
      console.log('  → Aguardando carregamento...');
    }
    
    // Cleanup
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');
    
    console.log('\n🔍 DIAGNÓSTICO:');
    console.log('O fluxo de autenticação está funcionando corretamente.');
    console.log('O problema pode estar em:');
    console.log('1. 🐛 Estado de loading não está sendo atualizado corretamente');
    console.log('2. 🐛 useEffect de redirecionamento não está sendo executado');
    console.log('3. 🐛 Dependências do useEffect estão incorretas');
    console.log('4. 🐛 Router.push não está funcionando');
    
  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  }
}

testLoginRedirectFlow().catch(console.error);