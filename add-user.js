// Script para adicionar um novo usuário
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

// Dados do usuário a ser criado
const email = 'davi10@gmail.com';
const password = 'davi123';

async function createUser() {
  try {
    console.log(`Criando usuário: ${email}`);
    
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Usuário criado com sucesso! UID: ${user.uid}`);
    
    // Criar documento para o usuário no Firestore
    const userDocData = {
      email: user.email,
      createdAt: serverTimestamp(),
      isSuperAdmin: false,
    };
    
    await setDoc(doc(db, "users", user.uid), userDocData);
    console.log(`Documento do usuário criado no Firestore`);
    
    console.log('Processo concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    process.exit(1);
  }
}

// Executar a função
createUser();