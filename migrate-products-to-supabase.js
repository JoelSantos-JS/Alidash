// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');
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

async function migrateProductsToSupabase() {
  console.log('🚀 Iniciando migração de produtos do Firebase para Supabase...\n');

  try {
    // 1. Buscar todos os usuários no Firebase
    console.log('📋 Buscando usuários no Firebase...');
    const usersCollection = collection(firebaseDb, 'user-data');
    const usersSnapshot = await getDocs(usersCollection);
    
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ ${users.length} usuários encontrados no Firebase`);

    let totalProductsMigrated = 0;
    let totalUsersProcessed = 0;

    // 2. Processar cada usuário
    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.id}`);
      
      const products = user.products || [];
      console.log(`📦 ${products.length} produtos encontrados para este usuário`);

      if (products.length === 0) {
        console.log('ℹ️ Nenhum produto para migrar');
        continue;
      }

      // 3. Verificar se o usuário existe no Supabase
      const { data: supabaseUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.log('⚠️ Erro ao buscar usuário no Supabase:', userError.message);
        continue;
      }

      const supabaseUserId = supabaseUser?.id || user.id;
      console.log(`🔄 Usando ID do Supabase: ${supabaseUserId}`);

      // 4. Migrar produtos
      let productsMigrated = 0;
      for (const product of products) {
        try {
          // Converter produto do Firebase para formato do Supabase
          const supabaseProduct = {
            user_id: supabaseUserId,
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
            console.log(`❌ Erro ao migrar produto "${product.name}":`, insertError.message);
          } else {
            productsMigrated++;
            console.log(`✅ Produto migrado: ${product.name}`);
          }

        } catch (error) {
          console.log(`❌ Erro ao processar produto "${product.name}":`, error.message);
        }
      }

      console.log(`✅ ${productsMigrated}/${products.length} produtos migrados para o usuário ${user.id}`);
      totalProductsMigrated += productsMigrated;
      totalUsersProcessed++;

      // Aguardar um pouco para não sobrecarregar o banco
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   - Usuários processados: ${totalUsersProcessed}`);
    console.log(`   - Produtos migrados: ${totalProductsMigrated}`);
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateProductsToSupabase().then(() => {
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 