// Carregar variáveis de ambiente
require('dotenv').config();

// ID de teste
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testProductsAPINextJS() {
  console.log('🚀 Testando APIs Next.js de produtos...\n');

  try {
    const baseUrl = 'http://localhost:3000/api/products';

    // 1. Testar GET - Buscar produtos
    console.log('📋 Testando GET /api/products/get...');
    try {
      const getResponse = await fetch(`${baseUrl}/get?user_id=${TEST_USER_ID}`);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log(`✅ GET funcionando - ${getData.products?.length || 0} produtos encontrados`);
      } else {
        console.log(`❌ GET retornou status ${getResponse.status}`);
        const errorText = await getResponse.text();
        console.log(`   Erro: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Erro no GET:', error.message);
    }

    // 2. Testar POST - Criar produto
    console.log('\n➕ Testando POST /api/products/create...');
    const testProduct = {
      name: 'Produto Teste API NextJS',
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpressLink: 'https://example.com',
      imageUrl: '',
      description: 'Produto criado via API Next.js',
      purchasePrice: 150,
      shippingCost: 25,
      importTaxes: 15,
      packagingCost: 10,
      marketingCost: 20,
      otherCosts: 0,
      totalCost: 220,
      sellingPrice: 300,
      expectedProfit: 80,
      profitMargin: 36.36,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date(),
      roi: 36.36,
      actualProfit: 0,
      sales: []
    };

    try {
      const createResponse = await fetch(`${baseUrl}/create?user_id=${TEST_USER_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProduct)
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ POST funcionando - Produto criado!');
        console.log(`   Firebase: ${createData.firebaseSuccess ? '✅' : '❌'}`);
        console.log(`   Supabase: ${createData.supabaseSuccess ? '✅' : '❌'}`);
        
        // 3. Testar PUT - Atualizar produto (se tivermos um ID)
        if (createData.firebaseSuccess || createData.supabaseSuccess) {
          console.log('\n🔄 Testando PUT /api/products/update...');
          
          // Buscar produtos para pegar o ID
          const getResponse2 = await fetch(`${baseUrl}/get?user_id=${TEST_USER_ID}`);
          if (getResponse2.ok) {
            const getData2 = await getResponse2.json();
            const product = getData2.products?.find(p => p.name === testProduct.name);
            
            if (product) {
              const updateData = {
                sellingPrice: 350,
                status: 'selling'
              };

              const updateResponse = await fetch(`${baseUrl}/update?user_id=${TEST_USER_ID}&product_id=${product.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
              });

              if (updateResponse.ok) {
                const updateResult = await updateResponse.json();
                console.log('✅ PUT funcionando - Produto atualizado!');
                console.log(`   Firebase: ${updateResult.firebaseSuccess ? '✅' : '❌'}`);
                console.log(`   Supabase: ${updateResult.supabaseSuccess ? '✅' : '❌'}`);

                // 4. Testar DELETE - Deletar produto
                console.log('\n🗑️ Testando DELETE /api/products/delete...');
                const deleteResponse = await fetch(`${baseUrl}/delete?user_id=${TEST_USER_ID}&product_id=${product.id}`, {
                  method: 'DELETE'
                });

                if (deleteResponse.ok) {
                  const deleteResult = await deleteResponse.json();
                  console.log('✅ DELETE funcionando - Produto deletado!');
                  console.log(`   Firebase: ${deleteResult.firebaseSuccess ? '✅' : '❌'}`);
                  console.log(`   Supabase: ${deleteResult.supabaseSuccess ? '✅' : '❌'}`);
                } else {
                  console.log(`❌ DELETE retornou status ${deleteResponse.status}`);
                }
              } else {
                console.log(`❌ PUT retornou status ${updateResponse.status}`);
              }
            } else {
              console.log('⚠️ Produto não encontrado para atualização');
            }
          }
        }
      } else {
        console.log(`❌ POST retornou status ${createResponse.status}`);
        const errorText = await createResponse.text();
        console.log(`   Erro: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Erro no POST:', error.message);
    }

    console.log('\n✅ Teste das APIs Next.js concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
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

// Executar teste
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testProductsAPINextJS();
  }
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 