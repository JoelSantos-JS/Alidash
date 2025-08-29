// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!firebaseConfig.apiKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getFirestore(firebaseApp);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID de teste (substitua por um ID real se necessário)
const TEST_USER_ID = 'test-user-products-sync';

async function testProductsSync() {
  console.log('🚀 Iniciando teste de sincronização de produtos...\n');

  try {
    // 1. Verificar produtos existentes no Firebase
    console.log('📋 Verificando produtos no Firebase...');
    const firebaseRef = doc(firebaseDb, 'user-data', TEST_USER_ID);
    const firebaseDoc = await getDoc(firebaseRef);
    
    let firebaseProducts = [];
    if (firebaseDoc.exists()) {
      firebaseProducts = firebaseDoc.data().products || [];
      console.log(`✅ ${firebaseProducts.length} produtos encontrados no Firebase`);
    } else {
      console.log('ℹ️ Nenhum produto encontrado no Firebase');
    }

    // 2. Verificar produtos existentes no Supabase
    console.log('\n📋 Verificando produtos no Supabase...');
    const { data: supabaseProducts, error: supabaseError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (supabaseError) {
      console.log('⚠️ Erro ao buscar produtos no Supabase:', supabaseError.message);
    } else {
      console.log(`✅ ${supabaseProducts?.length || 0} produtos encontrados no Supabase`);
    }

    // 3. Criar produto de teste no Firebase
    console.log('\n➕ Criando produto de teste no Firebase...');
    const testProduct = {
      id: new Date().getTime().toString(),
      name: 'Produto Teste Sincronização',
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpressLink: 'https://example.com',
      imageUrl: '',
      description: 'Produto criado para testar sincronização',
      purchasePrice: 100,
      shippingCost: 20,
      importTaxes: 10,
      packagingCost: 5,
      marketingCost: 15,
      otherCosts: 0,
      totalCost: 150,
      sellingPrice: 200,
      expectedProfit: 50,
      profitMargin: 25,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date(),
      roi: 33.33,
      actualProfit: 0,
      sales: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(firebaseRef, {
      products: [testProduct, ...firebaseProducts]
    }, { merge: true });

    console.log('✅ Produto de teste criado no Firebase');

    // 4. Verificar se o produto foi sincronizado para o Supabase
    console.log('\n🔄 Aguardando sincronização...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: updatedSupabaseProducts, error: updatedSupabaseError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (updatedSupabaseError) {
      console.log('❌ Erro ao verificar sincronização:', updatedSupabaseError.message);
    } else {
      const newProduct = updatedSupabaseProducts?.find(p => p.name === testProduct.name);
      if (newProduct) {
        console.log('✅ Produto sincronizado com sucesso para o Supabase!');
        console.log('📊 Detalhes do produto sincronizado:');
        console.log(`   - ID: ${newProduct.id}`);
        console.log(`   - Nome: ${newProduct.name}`);
        console.log(`   - Categoria: ${newProduct.category}`);
        console.log(`   - Preço de compra: R$ ${newProduct.purchase_price}`);
        console.log(`   - Preço de venda: R$ ${newProduct.selling_price}`);
      } else {
        console.log('❌ Produto não foi sincronizado para o Supabase');
      }
    }

    // 5. Testar API de produtos
    console.log('\n🌐 Testando API de produtos...');
    const apiUrl = 'http://localhost:3000/api/products/get';
    const response = await fetch(`${apiUrl}?user_id=${TEST_USER_ID}`);
    
    if (response.ok) {
      const apiData = await response.json();
      console.log(`✅ API retornou ${apiData.products?.length || 0} produtos`);
    } else {
      console.log('❌ Erro na API:', response.status, response.statusText);
    }

    console.log('\n✅ Teste de sincronização concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testProductsSync().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 