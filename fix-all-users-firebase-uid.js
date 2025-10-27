// Script para corrigir firebase_uid de todos os usuários que não têm esse campo definido
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

async function fixAllUsersFirebaseUid() {
  try {
    console.log('🔧 Corrigindo firebase_uid de todos os usuários...\n');
    
    // 1. Buscar todos os usuários sem firebase_uid
    console.log('1. Buscando usuários sem firebase_uid...');
    const { data: usersWithoutFirebaseUid, error: searchError } = await supabase
      .from('users')
      .select('id, email, firebase_uid, name')
      .is('firebase_uid', null);
    
    if (searchError) {
      console.error('❌ Erro ao buscar usuários:', searchError.message);
      return;
    }
    
    console.log(`📋 Encontrados ${usersWithoutFirebaseUid.length} usuários sem firebase_uid`);
    
    if (usersWithoutFirebaseUid.length === 0) {
      console.log('✅ Todos os usuários já têm firebase_uid definido!');
      return;
    }
    
    // 2. Corrigir cada usuário
    console.log('\n2. Corrigindo usuários...');
    let correctedCount = 0;
    
    for (const user of usersWithoutFirebaseUid) {
      console.log(`   Corrigindo: ${user.email} (ID: ${user.id})`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ firebase_uid: user.id })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`   ❌ Erro ao corrigir ${user.email}:`, updateError.message);
      } else {
        console.log(`   ✅ ${user.email} corrigido`);
        correctedCount++;
      }
    }
    
    // 3. Verificar resultado
    console.log(`\n3. Resultado:`);
    console.log(`   ✅ ${correctedCount} usuários corrigidos`);
    console.log(`   ❌ ${usersWithoutFirebaseUid.length - correctedCount} usuários com erro`);
    
    // 4. Verificar se ainda há usuários sem firebase_uid
    console.log('\n4. Verificação final...');
    const { data: remainingUsers, error: finalCheckError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .is('firebase_uid', null);
    
    if (finalCheckError) {
      console.error('❌ Erro na verificação final:', finalCheckError.message);
    } else {
      if (remainingUsers.length === 0) {
        console.log('🎉 Todos os usuários agora têm firebase_uid definido!');
      } else {
        console.log(`⚠️ Ainda há ${remainingUsers.length} usuários sem firebase_uid:`);
        remainingUsers.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
fixAllUsersFirebaseUid();