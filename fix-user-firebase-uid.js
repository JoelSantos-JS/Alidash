// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserFirebaseUid() {
  console.log('🔧 Corrigindo Firebase UID do usuário...\n');

  try {
    // 1. Buscar usuário joeltere9
    console.log('🔍 Buscando usuário joeltere9...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .eq('email', 'joeltere9@gmail.com')
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message);
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name || user.email}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Firebase UID atual: ${user.firebase_uid}`);

    // 2. Atualizar Firebase UID
    const correctFirebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';
    
    console.log(`🔄 Atualizando Firebase UID para: ${correctFirebaseUid}`);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ firebase_uid: correctFirebaseUid })
      .eq('id', user.id);

    if (updateError) {
      console.log('❌ Erro ao atualizar Firebase UID:', updateError.message);
      return;
    }

    console.log('✅ Firebase UID atualizado com sucesso!');

    // 3. Verificar atualização
    console.log('\n📋 Verificando atualização...');
    const { data: updatedUser, error: checkError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .eq('id', user.id)
      .single();

    if (checkError) {
      console.log('❌ Erro ao verificar usuário:', checkError.message);
    } else {
      console.log(`✅ Usuário atualizado:`);
      console.log(`   - ID: ${updatedUser.id}`);
      console.log(`   - Firebase UID: ${updatedUser.firebase_uid}`);
      console.log(`   - Email: ${updatedUser.email}`);
      console.log(`   - Nome: ${updatedUser.name}`);
    }

    // 4. Testar busca pelo Firebase UID
    console.log('\n🧪 Testando busca pelo Firebase UID...');
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .eq('firebase_uid', correctFirebaseUid)
      .single();

    if (testError) {
      console.log('❌ Erro ao buscar por Firebase UID:', testError.message);
    } else {
      console.log(`✅ Busca por Firebase UID funcionando:`);
      console.log(`   - ID: ${testUser.id}`);
      console.log(`   - Firebase UID: ${testUser.firebase_uid}`);
      console.log(`   - Email: ${testUser.email}`);
    }

    console.log('\n🎯 Firebase UID corrigido com sucesso!');
    console.log('   Agora você pode executar a migração de produtos.');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar correção
fixUserFirebaseUid().then(() => {
  console.log('\n🏁 Correção finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 