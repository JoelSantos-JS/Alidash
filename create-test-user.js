// Script para criar um usuário de teste
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyArzg3zwPRGPAzqatLrX_UHUzhdLeRrp0E",
  authDomain: "aliinsights.firebaseapp.com",
  projectId: "aliinsights",
  storageBucket: "aliinsights.firebasestorage.app",
  messagingSenderId: "48131222137",
  appId: "1:48131222137:web:7fc2ec9861093a7e20c2a8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Dados do usuário de teste
const email = 'teste@voxcash.com';
const password = 'teste123456';

async function createTestUser() {
  try {
    console.log(`🔥 Criando usuário de teste: ${email}`);
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Usuário criado com sucesso!`);
    console.log(`   - UID: ${user.uid}`);
    console.log(`   - Email: ${user.email}`);
    
    // Criar documento para o usuário no Firestore
    const userDocData = {
      email: user.email,
      createdAt: serverTimestamp(),
      isSuperAdmin: false,
    };
    
    await setDoc(doc(db, "users", user.uid), userDocData);
    console.log(`✅ Documento do usuário criado no Firestore`);
    
    // Sincronizar com o Supabase
    console.log('\n🔄 Sincronizando com Supabase...');
    
    const fetch = require('node-fetch');
    
    const syncResponse = await fetch('http://localhost:3000/api/auth/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email: user.email,
        name: 'Usuário Teste',
        avatar_url: null
      })
    });
    
    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Usuário sincronizado com Supabase:');
      console.log(`   - ID Supabase: ${syncResult.user.id}`);
      console.log(`   - Email: ${syncResult.user.email}`);
      console.log(`   - Nome: ${syncResult.user.name}`);
      console.log(`   - Tipo de conta: ${syncResult.user.account_type}`);
    } else {
      console.log('⚠️ Erro ao sincronizar com Supabase:', await syncResponse.text());
    }
    
    // Testar login
    console.log('\n🔐 Testando login...');
    
    const { signInWithEmailAndPassword } = require('firebase/auth');
    
    try {
      const loginCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login bem-sucedido!');
      
      // Testar busca de dados
      console.log('\n📊 Testando busca de dados...');
      
      const userResponse = await fetch('http://localhost:3000/api/user/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: loginCredential.user.uid
        })
      });
      
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        const supabaseUserId = userResult.user.id;
        
        // Testar busca de transações
        const transactionsResponse = await fetch(`http://localhost:3000/api/transactions/get?user_id=${supabaseUserId}`);
        const revenuesResponse = await fetch(`http://localhost:3000/api/revenues/get?user_id=${supabaseUserId}`);
        
        console.log('✅ APIs funcionando:');
        console.log(`   - Usuário: ${userResponse.ok ? '✅' : '❌'}`);
        console.log(`   - Transações: ${transactionsResponse.ok ? '✅' : '❌'}`);
        console.log(`   - Receitas: ${revenuesResponse.ok ? '✅' : '❌'}`);
      }
      
    } catch (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    }
    
    console.log('\n🎉 Usuário de teste criado com sucesso!');
    console.log('\n📝 Credenciais para teste no frontend:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Senha: ${password}`);
    console.log(`   - Firebase UID: ${user.uid}`);
    
    console.log('\n💡 Agora você pode:');
    console.log('   1. Fazer login no frontend com essas credenciais');
    console.log('   2. Verificar se os dados aparecem no dashboard');
    console.log('   3. Testar todas as funcionalidades');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 O usuário já existe. Tentando fazer login...');
      
      try {
        const { signInWithEmailAndPassword } = require('firebase/auth');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log(`✅ Login bem-sucedido!`);
        console.log(`   - UID: ${user.uid}`);
        console.log(`   - Email: ${user.email}`);
        
        console.log('\n📝 Credenciais para teste:');
        console.log(`   - Email: ${email}`);
        console.log(`   - Senha: ${password}`);
        
        process.exit(0);
      } catch (loginError) {
        console.error('❌ Erro ao fazer login:', loginError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

// Executar a função
createTestUser();