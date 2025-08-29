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

// SEU FIREBASE UID - Substitua pelo seu UID real
const MY_FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // UID do joeltere9

async function migrateMyProducts() {
  console.log(`🚀 Migrando produtos do usuário: ${MY_FIREBASE_UID}\n`);

  try {
    // 1. Buscar dados do usuário no Firebase
    console.log('📋 Buscando dados do usuário no Firebase...');
    const userDocRef = doc(firebaseDb, 'user-data', MY_FIREBASE_UID);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log('❌ Usuário não encontrado no Firebase');
      console.log('   Verifique se o Firebase UID está correto');
      return;
    }

    const userData = userDocSnap.data();
    const products = userData.products || [];
    
    console.log(`✅ Usuário encontrado: ${userData.name || userData.email || MY_FIREBASE_UID}`);
    console.log(`📦 ${products.length} produtos encontrados no Firebase`);

    if (products.length === 0) {
      console.log('ℹ️ Nenhum produto para migrar');
      return;
    }

    // 2. Buscar usuário correspondente no Supabase
    console.log('\n🔍 Buscando usuário no Supabase...');
    const { data: supabaseUser, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .eq('firebase_uid', MY_FIREBASE_UID)
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado no Supabase:', userError.message);
      console.log('   Verifique se o Firebase UID está correto');
      return;
    }

    console.log(`✅ Usuário encontrado no Supabase: ${supabaseUser.name || supabaseUser.email}`);
    console.log(`   - ID: ${supabaseUser.id}`);
    console.log(`   - Firebase UID: ${supabaseUser.firebase_uid}`);

    // 3. Limpar produtos existentes no Supabase (opcional)
    console.log('\n🧹 Limpando produtos existentes no Supabase...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('user_id', supabaseUser.id);

    if (deleteError) {
      console.log('⚠️ Erro ao limpar produtos:', deleteError.message);
    } else {
      console.log('✅ Produtos existentes removidos');
    }

    // 4. Migrar produtos
    console.log('\n🔄 Migrando produtos...');
    let productsMigrated = 0;
    let productsSkipped = 0;

    for (const product of products) {
      try {
        // Converter produto do Firebase para formato do Supabase
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

        // Inserir produto no Supabase
        const { error: insertError } = await supabase
          .from('products')
          .insert(supabaseProduct);

        if (insertError) {
          console.log(`   ❌ Erro ao migrar "${product.name}": ${insertError.message}`);
        } else {
          console.log(`   ✅ Migrado: ${product.name} (${product.category})`);
          console.log(`      - Compra: R$ ${product.purchasePrice} | Venda: R$ ${product.sellingPrice}`);
          productsMigrated++;
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar "${product.name}": ${error.message}`);
      }
    }

    // 5. Verificar resultado
    console.log('\n📋 Verificando produtos migrados...');
    const { data: migratedProducts, error: checkError } = await supabase
      .from('products')
      .select('id, name, category, purchase_price, selling_price')
      .eq('user_id', supabaseUser.id);

    if (checkError) {
      console.log('❌ Erro ao verificar produtos:', checkError.message);
    } else {
      console.log(`✅ ${migratedProducts?.length || 0} produtos no Supabase:`);
      migratedProducts?.forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
        console.log(`     Compra: R$ ${product.purchase_price} | Venda: R$ ${product.selling_price}`);
      });
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   - Produtos no Firebase: ${products.length}`);
    console.log(`   - Produtos migrados: ${productsMigrated}`);
    console.log(`   - Produtos no Supabase: ${migratedProducts?.length || 0}`);
    console.log('✅ Migração concluída com sucesso!');

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Acesse http://localhost:9002');
    console.log('   2. Faça login com seu usuário');
    console.log('   3. Os produtos estarão disponíveis no Supabase');
    console.log('   4. Use o Supabase como banco principal');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateMyProducts().then(() => {
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 