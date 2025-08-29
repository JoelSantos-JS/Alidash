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

async function syncRealUsersAndProducts() {
  console.log('🚀 Iniciando sincronização de usuários reais e produtos...\n');

  try {
    // 1. Buscar usuários reais no Firebase
    console.log('📋 Buscando usuários reais no Firebase...');
    const usersCollection = collection(firebaseDb, 'user-data');
    const usersSnapshot = await getDocs(usersCollection);
    
    const firebaseUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      firebaseUsers.push({
        firebaseUid: doc.id,
        email: userData.email || '',
        name: userData.name || userData.displayName || '',
        avatarUrl: userData.avatarUrl || userData.photoURL || '',
        accountType: userData.accountType || 'personal',
        products: userData.products || [],
        createdAt: userData.createdAt || new Date(),
        updatedAt: userData.updatedAt || new Date()
      });
    });

    console.log(`✅ ${firebaseUsers.length} usuários encontrados no Firebase`);

    if (firebaseUsers.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado no Firebase');
      return;
    }

    let totalUsersSynced = 0;
    let totalProductsSynced = 0;

    // 2. Para cada usuário do Firebase, sincronizar para Supabase
    for (const firebaseUser of firebaseUsers) {
      console.log(`\n👤 Sincronizando usuário: ${firebaseUser.name || firebaseUser.email || firebaseUser.firebaseUid}`);
      
      // Verificar se o usuário já existe no Supabase
      const { data: existingSupabaseUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUser.firebaseUid)
        .single();

      let supabaseUserId;

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // Usuário não existe no Supabase, vamos criar
        console.log('   ➕ Criando usuário no Supabase...');
        
        const { data: newSupabaseUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            firebase_uid: firebaseUser.firebaseUid,
            email: firebaseUser.email,
            name: firebaseUser.name,
            avatar_url: firebaseUser.avatarUrl,
            account_type: firebaseUser.accountType,
            created_at: firebaseUser.createdAt?.toDate?.() || new Date(),
            updated_at: firebaseUser.updatedAt?.toDate?.() || new Date()
          })
          .select()
          .single();

        if (createUserError) {
          console.log(`   ❌ Erro ao criar usuário no Supabase: ${createUserError.message}`);
          continue;
        }

        supabaseUserId = newSupabaseUser.id;
        console.log(`   ✅ Usuário criado no Supabase: ${supabaseUserId}`);
        totalUsersSynced++;
      } else if (userCheckError) {
        console.log(`   ❌ Erro ao verificar usuário no Supabase: ${userCheckError.message}`);
        continue;
      } else {
        // Usuário já existe no Supabase
        supabaseUserId = existingSupabaseUser.id;
        console.log(`   ✅ Usuário já existe no Supabase: ${supabaseUserId}`);
      }

      // 3. Sincronizar produtos deste usuário
      const products = firebaseUser.products || [];
      console.log(`   📦 ${products.length} produtos encontrados no Firebase`);

      if (products.length === 0) {
        console.log('   ℹ️ Nenhum produto para sincronizar');
        continue;
      }

      let productsSynced = 0;
      for (const product of products) {
        try {
          // Verificar se o produto já existe no Supabase (por nome e usuário)
          const { data: existingProduct, error: productCheckError } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', supabaseUserId)
            .eq('name', product.name)
            .single();

          if (productCheckError && productCheckError.code === 'PGRST116') {
            // Produto não existe, vamos criar
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

            const { error: insertError } = await supabase
              .from('products')
              .insert(supabaseProduct);

            if (insertError) {
              console.log(`   ❌ Erro ao sincronizar produto "${product.name}": ${insertError.message}`);
            } else {
              console.log(`   ✅ Produto sincronizado: ${product.name}`);
              productsSynced++;
            }
          } else if (productCheckError) {
            console.log(`   ❌ Erro ao verificar produto "${product.name}": ${productCheckError.message}`);
          } else {
            console.log(`   ℹ️ Produto já existe: ${product.name}`);
          }

        } catch (error) {
          console.log(`   ❌ Erro ao processar produto "${product.name}": ${error.message}`);
        }
      }

      totalProductsSynced += productsSynced;
      console.log(`   📊 ${productsSynced}/${products.length} produtos sincronizados`);

      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da sincronização:');
    console.log(`   - Usuários do Firebase: ${firebaseUsers.length}`);
    console.log(`   - Usuários sincronizados: ${totalUsersSynced}`);
    console.log(`   - Produtos sincronizados: ${totalProductsSynced}`);
    console.log('✅ Sincronização concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Executar sincronização
syncRealUsersAndProducts().then(() => {
  console.log('\n🏁 Sincronização finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 