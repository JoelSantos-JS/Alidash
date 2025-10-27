require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function debugCurrentUser() {
  console.log('🔍 Debugando usuário atual...\n');
  
  try {
    // Tentar fazer login com o usuário que está tendo problemas
    console.log('🔐 Fazendo login no Firebase...');
    // Vamos tentar com o usuário joel5060@gmail.com que vimos na lista
    const userCredential = await signInWithEmailAndPassword(auth, 'joel5060@gmail.com', 'joel5060');
    const firebaseUser = userCredential.user;
    
    console.log('✅ Login no Firebase bem-sucedido!');
    console.log(`   Firebase UID: ${firebaseUser.uid}`);
    console.log(`   Email: ${firebaseUser.email}`);
    console.log(`   Display Name: ${firebaseUser.displayName || 'N/A'}`);
    
    // Verificar se este usuário existe no Supabase
    console.log('\n🔍 Verificando se usuário existe no Supabase...');
    const { data: supabaseUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUser.uid)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário no Supabase:', error);
      return;
    }
    
    if (supabaseUser) {
      console.log('✅ Usuário encontrado no Supabase!');
      console.log(`   Supabase ID: ${supabaseUser.id}`);
      console.log(`   Email: ${supabaseUser.email}`);
      console.log(`   Nome: ${supabaseUser.name || 'N/A'}`);
      console.log(`   Firebase UID: ${supabaseUser.firebase_uid}`);
      console.log(`   Criado em: ${supabaseUser.created_at}`);
    } else {
      console.log('❌ Usuário NÃO encontrado no Supabase!');
      console.log('💡 O usuário precisa ser sincronizado entre Firebase e Supabase');
      
      // Verificar se existe um usuário com o mesmo email
      console.log('\n🔍 Verificando se existe usuário com mesmo email...');
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', firebaseUser.email)
        .single();
      
      if (emailUser) {
        console.log('⚠️ Encontrado usuário com mesmo email mas Firebase UID diferente:');
        console.log(`   Supabase ID: ${emailUser.id}`);
        console.log(`   Firebase UID no Supabase: ${emailUser.firebase_uid || 'N/A'}`);
        console.log(`   Firebase UID atual: ${firebaseUser.uid}`);
        console.log('💡 Pode ser necessário atualizar o firebase_uid no Supabase');
      } else {
        console.log('❌ Nenhum usuário encontrado com este email no Supabase');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Usuário não existe no Firebase Auth');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Senha incorreta');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Email inválido');
    }
  }
}

// Executar debug
debugCurrentUser().then(() => {
  console.log('\n🏁 Debug concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});