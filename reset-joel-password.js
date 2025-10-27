// Script para resetar a senha do usuário Joel
const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail } = require('firebase/auth');

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

const email = 'joeltere9@gmail.com';

async function resetPassword() {
  try {
    console.log(`📧 Enviando email de reset de senha para: ${email}`);
    
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Email de reset de senha enviado com sucesso!');
    console.log('📬 Verifique sua caixa de entrada e spam.');
    console.log('🔗 Clique no link do email para redefinir sua senha.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao enviar email de reset:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Usuário não encontrado. Vamos tentar criar o usuário...');
      
      // Tentar criar o usuário
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      const { getFirestore, doc, setDoc, serverTimestamp, Timestamp } = require('firebase/firestore');
      
      const db = getFirestore(app);
      const password = 'joel123456'; // Nova senha mais segura
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log(`✅ Usuário criado com sucesso!`);
        console.log(`   - UID: ${user.uid}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Senha: ${password}`);
        
        // Criar documento no Firestore
        const userDocData = {
          email: user.email,
          createdAt: serverTimestamp(),
          isSuperAdmin: true,
          proSubscription: {
            plan: 'lifetime',
            startedAt: Timestamp.fromDate(new Date()),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)),
          }
        };
        
        await setDoc(doc(db, "users", user.uid), userDocData);
        console.log(`✅ Documento do usuário criado no Firestore`);
        
        process.exit(0);
      } catch (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

// Executar a função
resetPassword();