require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function debugFirebaseUid() {
  console.log('🔍 Debugando firebase_uid no Supabase...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const targetFirebaseUid = 'cvaJfMdt5tX3vUydc9xLdRYbY483';
  const targetEmail = 'davi10@gmail.com';
  
  try {
    // 1. Buscar por firebase_uid
    console.log('🔍 Buscando por firebase_uid:', targetFirebaseUid);
    const { data: userByUid, error: uidError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', targetFirebaseUid)
      .single();
    
    if (uidError) {
      console.log('❌ Erro ao buscar por firebase_uid:', uidError.message);
    } else {
      console.log('✅ Usuário encontrado por firebase_uid:', {
        id: userByUid.id,
        email: userByUid.email,
        firebase_uid: userByUid.firebase_uid
      });
    }
    
    // 2. Buscar por email
    console.log('\n🔍 Buscando por email:', targetEmail);
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single();
    
    if (emailError) {
      console.log('❌ Erro ao buscar por email:', emailError.message);
    } else {
      console.log('✅ Usuário encontrado por email:', {
        id: userByEmail.id,
        email: userByEmail.email,
        firebase_uid: userByEmail.firebase_uid
      });
    }
    
    // 3. Listar todos os usuários para comparação
    console.log('\n📋 Listando todos os usuários para comparação...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.log('❌ Erro ao listar usuários:', allError.message);
    } else {
      console.log(`✅ Total de usuários: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} | firebase_uid: ${user.firebase_uid || 'null'} | id: ${user.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugFirebaseUid().catch(console.error);