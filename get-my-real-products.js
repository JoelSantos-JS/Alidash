// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Variáveis do Firebase não encontradas');
  process.exit(1);
}

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// SEUS DADOS DE LOGIN
const MY_EMAIL = 'joeltere9@gmail.com';
const MY_PASSWORD = 'sua_senha_aqui'; // Você precisa fornecer sua senha

async function getMyRealProducts() {
  console.log(`🔍 Buscando produtos reais do usuário: ${MY_EMAIL}\n`);

  try {
    // 1. Fazer login no Firebase
    console.log('🔐 Fazendo login no Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, MY_EMAIL, MY_PASSWORD);
    const user = userCredential.user;
    
    console.log(`✅ Login realizado com sucesso!`);
    console.log(`   - UID: ${user.uid}`);
    console.log(`   - Email: ${user.email}`);

    // 2. Buscar dados do usuário no Firebase
    console.log('\n📋 Buscando dados do usuário no Firebase...');
    const userDocRef = doc(firebaseDb, 'user-data', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log('❌ Usuário não encontrado no Firebase');
      return;
    }

    const userData = userDocSnap.data();
    const products = userData.products || [];
    
    console.log(`✅ Usuário encontrado: ${userData.name || userData.email || user.uid}`);
    console.log(`📦 ${products.length} produtos encontrados no Firebase`);

    if (products.length === 0) {
      console.log('ℹ️ Nenhum produto encontrado no Firebase');
      console.log('   Isso significa que você não tem produtos salvos ainda.');
      return;
    }

    // 3. Mostrar produtos encontrados
    console.log('\n📦 Produtos encontrados no Firebase:');
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name || 'Produto sem nome'}`);
      console.log(`   - Categoria: ${product.category || 'Não definida'}`);
      console.log(`   - Fornecedor: ${product.supplier || 'Não definido'}`);
      console.log(`   - Preço de compra: R$ ${product.purchasePrice || 0}`);
      console.log(`   - Preço de venda: R$ ${product.sellingPrice || 0}`);
      console.log(`   - Quantidade: ${product.quantity || 1}`);
      console.log(`   - Status: ${product.status || 'Não definido'}`);
      console.log(`   - Data de compra: ${product.purchaseDate?.toDate?.() || product.purchaseDate || 'Não definida'}`);
      
      if (product.description) {
        console.log(`   - Descrição: ${product.description}`);
      }
      
      if (product.notes) {
        console.log(`   - Notas: ${product.notes}`);
      }
    });

    console.log('\n📊 Resumo:');
    console.log(`   - Total de produtos: ${products.length}`);
    console.log(`   - UID do usuário: ${user.uid}`);
    console.log(`   - Email: ${user.email}`);

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Copie o UID acima');
    console.log('   2. Execute o script de migração com o UID correto');
    console.log('   3. Os produtos serão migrados para o Supabase');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('❌ Usuário não encontrado');
      console.log('   Verifique se o email está correto');
    } else if (error.code === 'auth/wrong-password') {
      console.log('❌ Senha incorreta');
      console.log('   Verifique se a senha está correta');
    } else if (error.code === 'auth/invalid-email') {
      console.log('❌ Email inválido');
      console.log('   Verifique se o email está no formato correto');
    } else {
      console.error('❌ Erro durante o login:', error.message);
    }
  }
}

// Verificar se a senha foi fornecida
if (MY_PASSWORD === 'sua_senha_aqui') {
  console.log('❌ Você precisa fornecer sua senha no script');
  console.log('   Edite o arquivo e substitua "sua_senha_aqui" pela sua senha real');
  process.exit(1);
}

// Executar busca
getMyRealProducts().then(() => {
  console.log('\n🏁 Busca finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 