// Carregar variáveis de ambiente
require('dotenv').config();

async function testSimpleProduct() {
  console.log('🧪 Testando criação simples de produto...\n');

  try {
    const userId = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc'; // ID do joeltere9
    const baseUrl = 'http://localhost:9002/api/products';

    // 1. Testar GET
    console.log('📋 Testando GET produtos...');
    const getResponse = await fetch(`${baseUrl}/get?user_id=${userId}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log(`✅ GET funcionando: ${getData.products?.length || 0} produtos`);
    } else {
      console.log(`❌ GET falhou: ${getResponse.status}`);
      const errorText = await getResponse.text();
      console.log(`   Erro: ${errorText}`);
    }

    // 2. Testar POST
    console.log('\n➕ Testando POST produto...');
    const testProduct = {
      name: 'Produto Teste Simples',
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpressLink: '',
      imageUrl: '',
      description: 'Produto de teste simples',
      notes: '',
      trackingCode: '',
      purchaseEmail: '',
      purchasePrice: 100,
      shippingCost: 10,
      importTaxes: 25,
      packagingCost: 5,
      marketingCost: 15,
      otherCosts: 5,
      totalCost: 160,
      sellingPrice: 200,
      expectedProfit: 40,
      profitMargin: 20,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date(),
      roi: 25,
      actualProfit: 0,
      sales: []
    };

    const createResponse = await fetch(`${baseUrl}/create?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ POST funcionando!');
      console.log(`   Firebase: ${createData.firebaseSuccess ? '✅' : '❌'}`);
      console.log(`   Supabase: ${createData.supabaseSuccess ? '✅' : '❌'}`);
      
      if (createData.firebaseSuccess && createData.supabaseSuccess) {
        console.log('🎉 Sincronização dual funcionando perfeitamente!');
      } else {
        console.log('⚠️ Sincronização parcial - verificar logs');
      }
    } else {
      console.log(`❌ POST falhou: ${createResponse.status}`);
      const errorText = await createResponse.text();
      console.log(`   Erro: ${errorText}`);
    }

    // 3. Verificar novamente
    console.log('\n📋 Verificando produtos após criação...');
    const getResponse2 = await fetch(`${baseUrl}/get?user_id=${userId}`);
    
    if (getResponse2.ok) {
      const getData2 = await getResponse2.json();
      console.log(`✅ Produtos após criação: ${getData2.products?.length || 0}`);
      
      if (getData2.products && getData2.products.length > 0) {
        getData2.products.forEach(product => {
          console.log(`   - ${product.name} (${product.category})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testSimpleProduct().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 