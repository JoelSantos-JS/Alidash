require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLoginFlow() {
  try {
    console.log('🔐 Testando login com joeltere9@gmail.com...');
    
    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'joeltere9@gmail.com',
      password: 'joel123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }

    console.log('✅ Login bem-sucedido:', authData.user.email);
    console.log('🆔 User ID:', authData.user.id);

    // Tentar buscar usuário na tabela users
    console.log('\n🔍 Buscando usuário na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.log('⚠️ Usuário não encontrado por ID:', userError.message);
      
      // Tentar buscar por email
      console.log('🔍 Buscando por email...');
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();

      if (emailError) {
        console.log('⚠️ Usuário não encontrado por email:', emailError.message);
        
        // Tentar criar usuário usando service role
        console.log('\n➕ Tentando criar usuário com service role...');
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id, // Use Supabase Auth ID
            email: authData.user.email,
            name: authData.user.user_metadata?.name || null,
            account_type: 'personal'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar usuário:', createError);
          console.error('📋 Detalhes completos:', JSON.stringify(createError, null, 2));
        } else {
          console.log('✅ Usuário criado com sucesso:', newUser);
        }
      } else {
        console.log('✅ Usuário encontrado por email:', userByEmail);
      }
    } else {
      console.log('✅ Usuário encontrado por ID:', userData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testLoginFlow();