// Carregar variáveis de ambiente
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { createClient } = require('@supabase/supabase-js');

// Configuração Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Inicializar Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credenciais
const EMAIL = 'joeltere9@gmail.com';
const PASSWORD = '88127197';
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';
const SUPABASE_USER_ID = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc';

async function migrateDirectToSupabase() {
  console.log('🚀 Iniciando migração direta para Supabase...\n');
  
  try {
    // 1. Fazer login no Firebase
    console.log('🔐 Fazendo login no Firebase...');
    await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Buscar produtos do Firebase
    console.log('📋 Buscando produtos no Firebase...');
    const docRef = doc(db, "user-data", FIREBASE_UID);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('❌ Nenhum dado encontrado no Firebase');
      return;
    }
    
    const data = docSnap.data();
    const products = data.products || [];
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado no Firebase');
      return;
    }
    
    console.log(`✅ ${products.length} produtos encontrados no Firebase\n`);
    
    // 3. Migrar cada produto diretamente para o Supabase
    console.log('🔄 Migrando produtos diretamente para Supabase...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`📦 Migrando ${i + 1}/${products.length}: ${product.name}`);
      
      try {
        // Preparar dados do produto para o Supabase
        const productData = {
          user_id: SUPABASE_USER_ID,
          name: product.name || 'Produto sem nome',
          category: product.category || 'Geral',
          supplier: product.supplier || 'N/A',
          aliexpress_link: product.aliexpressLink || '',
          image_url: product.imageUrl || '',
          description: product.description || '',
          notes: product.notes || '',
          tracking_code: product.trackingCode || '',
          purchase_email: product.purchaseEmail || 'joeltere9@gmail.com',
          purchase_price: product.purchasePrice || 0,
          shipping_cost: product.shippingCost || 0,
          import_taxes: product.importTaxes || 0,
          packaging_cost: product.packagingCost || 0,
          marketing_cost: product.marketingCost || 0,
          other_costs: product.otherCosts || 0,
          selling_price: product.sellingPrice || 0,
          expected_profit: product.expectedProfit || 0,
          profit_margin: product.profitMargin || 0,
          quantity: product.quantity || 1,
          status: product.status || 'purchased',
          created_at: product.createdAt || new Date().toISOString(),
          updated_at: product.updatedAt || new Date().toISOString()
        };
        
        // Inserir diretamente no Supabase
        const { data: insertedProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) {
          console.log(`   ❌ Erro: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Migrado com sucesso! ID: ${insertedProduct.id}`);
          successCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao migrar: ${error.message}`);
        errorCount++;
      }
      
      console.log(''); // Linha em branco
    }
    
    // 4. Resumo final
    console.log('📊 Resumo da migração:');
    console.log('=' .repeat(40));
    console.log(`   Produtos encontrados: ${products.length}`);
    console.log(`   Migrados com sucesso: ${successCount}`);
    console.log(`   Erros: ${errorCount}`);
    console.log(`   Taxa de sucesso: ${((successCount / products.length) * 100).toFixed(1)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migração concluída!');
      console.log('✅ Produtos migrados diretamente para o Supabase');
      console.log('✅ Supabase agora é o banco principal');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
  }
}

// Executar migração
migrateDirectToSupabase(); 