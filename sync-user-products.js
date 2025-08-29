// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
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

// Configurar usuário para sincronizar
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // UID do joeltere9

async function syncUserProducts() {
  console.log(`🚀 Sincronizando produtos do usuário: ${FIREBASE_UID}\n`);

  try {
    // 1. Buscar dados do usuário no Firebase
    console.log('📋 Buscando dados do usuário no Firebase...');
    const userDocRef = doc(firebaseDb, 'user-data', FIREBASE_UID);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log('❌ Usuário não encontrado no Firebase');
      return;
    }

    const userData = userDocSnap.data();
    const products = userData.products || [];
    
    console.log(`✅ Usuário encontrado: ${userData.name || userData.email || FIREBASE_UID}`);
    console.log(`📦 ${products.length} produtos encontrados no Firebase`);

    if (products.length === 0) {
      console.log('ℹ️ Nenhum produto para sincronizar');
      return;
    }

    // 2. Buscar usuário correspondente no Supabase
    console.log('\n🔍 Buscando usuário no Supabase...');
    const { data: supabaseUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', FIREBASE_UID)
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado no Supabase:', userError.message);
      console.log('   Verifique se o Firebase UID está correto');
      return;
    }

    console.log(`✅ Usuário encontrado no Supabase: ${supabaseUser.id}`);

    // 3. Sincronizar produtos
    console.log('\n🔄 Sincronizando produtos...');
    let productsSynced = 0;
    let productsSkipped = 0;

    for (const product of products) {
      try {
        // Verificar se o produto já existe no Supabase
        const { data: existingProduct, error: productCheckError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', supabaseUser.id)
          .eq('name', product.name)
          .single();

        if (productCheckError && productCheckError.code === 'PGRST116') {
          // Produto não existe, vamos criar
          const supabaseProduct = {
            user_id: supabaseUser.id,
            name: product.name || '',
            category: product.category || '',
            supplier: product.supplier || '',
            aliexpress_link: product.aliexpressLink || '',
            image_url: product.imageUrl || '',
            description: product.description || '',
            notes: product.notes || '',
            tracking_code: product.trackingCode || '',
            purchase_email: product.purchaseEmail || '',
            purchase_price: parseFloat(product.purchasePrice) || 0,
            shipping_cost: parseFloat(product.shippingCost) || 0,
            import_taxes: parseFloat(product.importTaxes) || 0,
            packaging_cost: parseFloat(product.packagingCost) || 0,
            marketing_cost: parseFloat(product.marketingCost) || 0,
            other_costs: parseFloat(product.otherCosts) || 0,
            selling_price: parseFloat(product.sellingPrice) || 0,
            expected_profit: parseFloat(product.expectedProfit) || 0,
            profit_margin: parseFloat(product.profitMargin) || 0,
            quantity: parseInt(product.quantity) || 1,
            quantity_sold: parseInt(product.quantitySold) || 0,
            status: product.status || 'purchased',
            purchase_date: product.purchaseDate?.toDate?.() || new Date(product.purchaseDate) || new Date(),
            roi: parseFloat(product.roi) || 0,
            actual_profit: parseFloat(product.actualProfit) || 0,
            days_to_sell: product.daysToSell || null
          };

          const { error: insertError } = await supabase
            .from('products')
            .insert(supabaseProduct);

          if (insertError) {
            console.log(`   ❌ Erro ao sincronizar "${product.name}": ${insertError.message}`);
          } else {
            console.log(`   ✅ Sincronizado: ${product.name} (${product.category})`);
            console.log(`      - Compra: R$ ${product.purchasePrice} | Venda: R$ ${product.sellingPrice}`);
            productsSynced++;
          }
        } else if (productCheckError) {
          console.log(`   ❌ Erro ao verificar "${product.name}": ${productCheckError.message}`);
        } else {
          console.log(`   ℹ️ Já existe: ${product.name}`);
          productsSkipped++;
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar "${product.name}": ${error.message}`);
      }
    }

    console.log('\n📊 Resumo da sincronização:');
    console.log(`   - Produtos no Firebase: ${products.length}`);
    console.log(`   - Produtos sincronizados: ${productsSynced}`);
    console.log(`   - Produtos já existentes: ${productsSkipped}`);
    console.log('✅ Sincronização concluída!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Executar sincronização
syncUserProducts().then(() => {
  console.log('\n🏁 Sincronização finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 