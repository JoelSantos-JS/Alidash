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

// SEU FIREBASE UID - Substitua pelo seu UID real
const MY_FIREBASE_UID = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // UID do joeltere9

async function migrateMyProductsViaAPI() {
  console.log(`🚀 Migrando produtos via API para usuário: ${MY_FIREBASE_UID}\n`);

  try {
    // 1. Buscar usuário no Supabase
    console.log('🔍 Buscando usuário no Supabase...');
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

    console.log(`✅ Usuário encontrado: ${supabaseUser.name || supabaseUser.email}`);
    console.log(`   - ID: ${supabaseUser.id}`);
    console.log(`   - Firebase UID: ${supabaseUser.firebase_uid}`);

    // 2. Verificar produtos existentes
    console.log('\n📋 Verificando produtos existentes...');
    const { data: existingProducts, error: existingError } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('user_id', supabaseUser.id);

    if (existingError) {
      console.log('❌ Erro ao verificar produtos:', existingError.message);
    } else {
      console.log(`📦 ${existingProducts?.length || 0} produtos existentes no Supabase`);
      if (existingProducts && existingProducts.length > 0) {
        existingProducts.forEach(product => {
          console.log(`   - ${product.name} (${product.category})`);
        });
      }
    }

    // 3. Testar API de produtos
    console.log('\n🌐 Testando API de produtos...');
    
    const baseUrl = 'http://localhost:9002/api/products';
    
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

    // 4. Criar produtos de exemplo (simulando migração)
    console.log('\n➕ Criando produtos de exemplo...');
    
    const exampleProducts = [
      {
        name: 'iPhone 15 Pro',
        category: 'Eletrônicos',
        supplier: 'Apple Store',
        aliexpressLink: '',
        imageUrl: '',
        description: 'Smartphone Apple iPhone 15 Pro 128GB',
        notes: 'Produto migrado do Firebase',
        trackingCode: '',
        purchaseEmail: '',
        purchasePrice: 4500,
        shippingCost: 0,
        importTaxes: 0,
        packagingCost: 0,
        marketingCost: 0,
        otherCosts: 0,
        totalCost: 4500,
        sellingPrice: 5500,
        expectedProfit: 1000,
        profitMargin: 18.18,
        quantity: 1,
        quantitySold: 0,
        status: 'purchased',
        purchaseDate: new Date(),
        roi: 22.22,
        actualProfit: 0,
        sales: []
      },
      {
        name: 'MacBook Air M2',
        category: 'Eletrônicos',
        supplier: 'Apple Store',
        aliexpressLink: '',
        imageUrl: '',
        description: 'Notebook Apple MacBook Air M2 13" 256GB',
        notes: 'Produto migrado do Firebase',
        trackingCode: '',
        purchaseEmail: '',
        purchasePrice: 7500,
        shippingCost: 0,
        importTaxes: 0,
        packagingCost: 0,
        marketingCost: 0,
        otherCosts: 0,
        totalCost: 7500,
        sellingPrice: 9000,
        expectedProfit: 1500,
        profitMargin: 16.67,
        quantity: 1,
        quantitySold: 0,
        status: 'purchased',
        purchaseDate: new Date(),
        roi: 20,
        actualProfit: 0,
        sales: []
      },
      {
        name: 'AirPods Pro',
        category: 'Acessórios',
        supplier: 'Apple Store',
        aliexpressLink: '',
        imageUrl: '',
        description: 'Fones de ouvido Apple AirPods Pro 2ª geração',
        notes: 'Produto migrado do Firebase',
        trackingCode: '',
        purchaseEmail: '',
        purchasePrice: 1800,
        shippingCost: 0,
        importTaxes: 0,
        packagingCost: 0,
        marketingCost: 0,
        otherCosts: 0,
        totalCost: 1800,
        sellingPrice: 2200,
        expectedProfit: 400,
        profitMargin: 18.18,
        quantity: 2,
        quantitySold: 0,
        status: 'purchased',
        purchaseDate: new Date(),
        roi: 22.22,
        actualProfit: 0,
        sales: []
      }
    ];

    let productsCreated = 0;
    for (const product of exampleProducts) {
      try {
        const createResponse = await fetch(`${baseUrl}/create?user_id=${supabaseUser.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product)
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log(`✅ Produto criado: ${product.name}`);
          console.log(`   Firebase: ${createData.firebaseSuccess ? '✅' : '❌'}`);
          console.log(`   Supabase: ${createData.supabaseSuccess ? '✅' : '❌'}`);
          productsCreated++;
        } else {
          console.log(`❌ Erro ao criar ${product.name}: ${createResponse.status}`);
          const errorText = await createResponse.text();
          console.log(`   Erro: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao criar ${product.name}: ${error.message}`);
      }
    }

    // 5. Verificar resultado final
    console.log('\n📋 Verificando produtos após migração...');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('id, name, category, purchase_price, selling_price')
      .eq('user_id', supabaseUser.id)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ Erro ao verificar produtos finais:', finalError.message);
    } else {
      console.log(`✅ ${finalProducts?.length || 0} produtos no Supabase:`);
      finalProducts?.forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
        console.log(`     Compra: R$ ${product.purchase_price} | Venda: R$ ${product.selling_price}`);
      });
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   - Produtos criados: ${productsCreated}`);
    console.log(`   - Produtos no Supabase: ${finalProducts?.length || 0}`);
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

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch('http://localhost:9002/api/test/env');
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

// Executar migração
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await migrateMyProductsViaAPI();
  }
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 