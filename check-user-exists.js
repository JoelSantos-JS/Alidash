require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserExists() {
  try {
    const userId = '428c3f35-4c70-43e5-bb1c-d550ef450427';
    
    console.log('🔍 Verificando se usuário existe com service role...');
    
    // Buscar usuário usando service role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else {
      console.log('✅ Usuário encontrado:', userData);
    }

    // Buscar por email também
    console.log('\n🔍 Buscando por email...');
    const { data: userByEmail, error: emailError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'joeltere9@gmail.com')
      .single();

    if (emailError) {
      console.error('❌ Erro ao buscar por email:', emailError);
    } else {
      console.log('✅ Usuário encontrado por email:', userByEmail);
    }

    // Listar todos os usuários
    console.log('\n📋 Listando todos os usuários...');
    const { data: allUsers, error: listError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, account_type, created_at');

    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
    } else {
      console.log('👥 Total de usuários:', allUsers?.length || 0);
      allUsers?.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserExists();