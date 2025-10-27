// Script para criar o usuário Joel no Firebase Auth
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

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

// Dados do usuário Joel
const email = 'joeltere9@gmail.com';
const password = 'joel123';

async function createJoelUser() {
  try {
    console.log(`🔥 Criando usuário no Firebase Auth: ${email}`);
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Usuário criado com sucesso!`);
    console.log(`   - UID: ${user.uid}`);
    console.log(`   - Email: ${user.email}`);
    
    // Verificar se é o super admin
    const isSuperAdmin = user.email === 'joeltere9@gmail.com';
    
    // Criar documento para o usuário no Firestore
    const userDocData = {
      email: user.email,
      createdAt: serverTimestamp(),
      isSuperAdmin: isSuperAdmin,
    };

    if (isSuperAdmin) {
      // Super admin gets a lifetime subscription
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
      userDocData.proSubscription = {
          plan: 'lifetime',
          startedAt: Timestamp.fromDate(new Date()),
          expiresAt: Timestamp.fromDate(farFutureDate),
      };
      console.log('👑 Configurando como Super Admin com assinatura vitalícia');
    }
    
    await setDoc(doc(db, "users", user.uid), userDocData);
    console.log(`✅ Documento do usuário criado no Firestore`);
    
    // Agora vamos sincronizar com o Supabase
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
        name: 'Joel Tere',
        avatar_url: null
      })
    });
    
    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Usuário sincronizado com Supabase:');
      console.log(`   - ID Supabase: ${syncResult.user.id}`);
    } else {
      console.log('⚠️ Erro ao sincronizar com Supabase:', await syncResponse.text());
    }
    
    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('\n📝 Credenciais para login:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Senha: ${password}`);
    console.log(`   - Firebase UID: ${user.uid}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 O usuário já existe no Firebase Auth.');
      console.log('   Tentando fazer login para obter o UID...');
      
      try {
        const { signInWithEmailAndPassword } = require('firebase/auth');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log(`✅ Login bem-sucedido!`);
        console.log(`   - UID: ${user.uid}`);
        console.log(`   - Email: ${user.email}`);
        
        // Tentar sincronizar com Supabase
        console.log('\n🔄 Tentando sincronizar com Supabase...');
        
        const fetch = require('node-fetch');
        
        const syncResponse = await fetch('http://localhost:3000/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebase_uid: user.uid,
            email: user.email,
            name: 'Joel Tere',
            avatar_url: null
          })
        });
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('✅ Usuário sincronizado com Supabase:');
          console.log(`   - ID Supabase: ${syncResult.user.id}`);
        } else {
          console.log('⚠️ Erro ao sincronizar com Supabase:', await syncResponse.text());
        }
        
        console.log('\n🎉 Usuário já existe e está configurado!');
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
createJoelUser();