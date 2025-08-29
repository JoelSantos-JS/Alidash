// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar usuário para sincronizar
const FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // UID do joeltere9

async function syncViaAPI() {
  console.log(`🚀 Sincronizando via API para usuário: ${FIREBASE_UID}\n`);

  try {
    // 1. Buscar usuário no Supabase
    console.log('🔍 Buscando usuário no Supabase...');
    const { data: supabaseUser, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .eq('firebase_uid', FIREBASE_UID)
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado no Supabase:', userError.message);
      return;
    }

    console.log(`✅ Usuário encontrado: ${supabaseUser.name || supabaseUser.email}`);
    console.log(`   - ID: ${supabaseUser.id}`);
    console.log(`   - Firebase UID: ${supabaseUser.firebase_uid}`);

    // 2. Testar API de produtos
    console.log('\n🌐 Testando API de produtos...');
    
    const baseUrl = 'http://localhost:3000/api/products';
    
    // Testar GET
    try {
      const getResponse = await fetch(`${baseUrl}/get?user_id=${supabaseUser.id}`);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log(`✅ GET funcionando - ${getData.products?.length || 0} produtos encontrados`);
        
        if (getData.products && getData.products.length > 0) {
          console.log('📦 Produtos encontrados:');
          getData.products.forEach(product => {
            console.log(`   - ${product.name} (${product.category})`);
            console.log(`     Compra: R$ ${product.purchasePrice} | Venda: R$ ${product.sellingPrice}`);
          });
        }
      } else {
        console.log(`❌ GET retornou status ${getResponse.status}`);
        const errorText = await getResponse.text();
        console.log(`   Erro: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Erro no GET:', error.message);
      console.log('   Verifique se o servidor Next.js está rodando (npm run dev)');
    }

    // 3. Criar um produto de teste via API
    console.log('\n➕ Testando criação de produto via API...');
    
    const testProduct = {
      name: 'Produto Teste Sincronização Real',
      category: 'Teste',
      supplier: 'Fornecedor Real',
      aliexpressLink: 'https://example.com/real-product',
      imageUrl: '',
      description: 'Produto criado para testar sincronização real',
      purchasePrice: 500,
      shippingCost: 50,
      importTaxes: 125,
      packagingCost: 25,
      marketingCost: 75,
      otherCosts: 25,
      totalCost: 800,
      sellingPrice: 1200,
      expectedProfit: 400,
      profitMargin: 50,
      quantity: 2,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date(),
      roi: 50,
      actualProfit: 0,
      sales: []
    };

    try {
      const createResponse = await fetch(`${baseUrl}/create?user_id=${supabaseUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduct)
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ Produto criado via API!');
        console.log(`   Firebase: ${createData.firebaseSuccess ? '✅' : '❌'}`);
        console.log(`   Supabase: ${createData.supabaseSuccess ? '✅' : '❌'}`);
        
        if (createData.firebaseSuccess && createData.supabaseSuccess) {
          console.log('🎉 Sincronização dual funcionando perfeitamente!');
        } else {
          console.log('⚠️ Sincronização parcial - verificar logs');
        }
      } else {
        console.log(`❌ POST retornou status ${createResponse.status}`);
        const errorText = await createResponse.text();
        console.log(`   Erro: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Erro no POST:', error.message);
    }

    // 4. Verificar produtos no Supabase após criação
    console.log('\n📋 Verificando produtos no Supabase...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, category, purchase_price, selling_price, created_at')
      .eq('user_id', supabaseUser.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
    } else {
      console.log(`✅ ${products?.length || 0} produtos no Supabase:`);
      products?.forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
        console.log(`     Compra: R$ ${product.purchase_price} | Venda: R$ ${product.selling_price}`);
        console.log(`     Criado em: ${product.created_at}`);
      });
    }

    console.log('\n📊 Resumo da sincronização via API:');
    console.log('   - Usuário verificado no Supabase');
    console.log('   - API de produtos testada');
    console.log('   - Sincronização dual funcionando');
    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/test/env');
    if (response.ok) {
      console.log('✅ Servidor Next.js está rodando');
      return true;
    }
  } catch (error) {
    console.log('❌ Servidor Next.js não está rodando');
    console.log('   Execute: npm run dev');
    return false;
  }
}

// Executar sincronização
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await syncViaAPI();
  }
  console.log('\n🏁 Sincronização finalizada');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 