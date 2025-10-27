// Script para verificar o firebase_uid do usuário joeltere9@gmail.com
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

async function checkUserFirebaseUid() {
  try {
    console.log(`🔍 Verificando firebase_uid do usuário: ${email}\n`);
    
    // 1. Buscar usuário na tabela users
    console.log('1. Verificando usuário na tabela users...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, firebase_uid, name, account_type')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      firebase_uid: user.firebase_uid,
      name: user.name,
      account_type: user.account_type
    });
    
    // 2. Verificar se firebase_uid está definido
    if (!user.firebase_uid) {
      console.log('\n⚠️ firebase_uid não está definido! Isso explica o problema de RLS.');
      console.log('💡 Vou atualizar o firebase_uid para ser igual ao id do usuário...');
      
      // Atualizar firebase_uid
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ firebase_uid: user.id })
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar firebase_uid:', updateError.message);
      } else {
        console.log('✅ firebase_uid atualizado:', {
          id: updatedUser.id,
          email: updatedUser.email,
          firebase_uid: updatedUser.firebase_uid
        });
      }
    } else {
      console.log('\n✅ firebase_uid está definido corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
checkUserFirebaseUid();