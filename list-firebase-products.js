// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuração Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar se as variáveis estão definidas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Variáveis de ambiente do Firebase não encontradas!');
  console.log('Verifique se o arquivo .env.local existe e contém:');
  console.log('- NEXT_PUBLIC_FIREBASE_API_KEY');
  console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  process.exit(1);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Credenciais para acessar o Firebase
const EMAIL = 'joeltere9@gmail.com';
const PASSWORD = '88127197'; // Você precisa colocar sua senha real
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';

async function listFirebaseProducts() {
  console.log('🔍 Conectando ao Firebase...');
  
  try {
    // Fazer login no Firebase
    console.log('🔐 Fazendo login no Firebase...');
    const userCredential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✅ Login realizado com sucesso!');
    
    // Buscar dados do usuário
    console.log('📋 Buscando produtos no Firebase...');
    const docRef = doc(db, "user-data", FIREBASE_UID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Dados encontrados no Firebase!');
      
      if (data.products && Array.isArray(data.products)) {
        console.log(`\n📦 Produtos encontrados: ${data.products.length}`);
        console.log('=' .repeat(50));
        
        data.products.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.name || 'Sem nome'}`);
          console.log(`   Categoria: ${product.category || 'N/A'}`);
          console.log(`   Preço de compra: R$ ${product.purchasePrice || 0}`);
          console.log(`   Preço de venda: R$ ${product.sellingPrice || 0}`);
          console.log(`   Lucro esperado: R$ ${product.expectedProfit || 0}`);
          console.log(`   Quantidade: ${product.quantity || 1}`);
          console.log(`   Fornecedor: ${product.supplier || 'N/A'}`);
          console.log(`   Status: ${product.status || 'N/A'}`);
          console.log('   ' + '-'.repeat(30));
        });
        
        console.log(`\n📊 Resumo:`);
        console.log(`   Total de produtos: ${data.products.length}`);
        console.log(`   Valor total investido: R$ ${data.products.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)}`);
        console.log(`   Valor total esperado: R$ ${data.products.reduce((sum, p) => sum + (p.sellingPrice || 0), 0)}`);
        console.log(`   Lucro total esperado: R$ ${data.products.reduce((sum, p) => sum + (p.expectedProfit || 0), 0)}`);
        
      } else {
        console.log('❌ Nenhum produto encontrado na estrutura de dados');
        console.log('Estrutura dos dados:', JSON.stringify(data, null, 2));
      }
      
    } else {
      console.log('❌ Documento não encontrado no Firebase');
    }
    
  } catch (error) {
    console.error('❌ Erro ao acessar Firebase:', error.message);
    
    if (error.code === 'auth/wrong-password') {
      console.log('\n💡 Dica: Você precisa colocar sua senha real no script');
      console.log('Edite o arquivo e substitua "sua_senha_aqui" pela sua senha real');
    }
  }
}

// Executar
listFirebaseProducts(); 