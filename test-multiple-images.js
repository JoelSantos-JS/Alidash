// Teste simples para verificar múltiplas imagens via API
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api/products';
const TEST_USER_ID = 'test-user-123'; // ID de usuário de teste

async function testMultipleImagesAPI() {
  console.log('🧪 Testando sistema de múltiplas imagens via API...');
  
  try {
    // 1. Criar produto com múltiplas imagens
    console.log('\n1. Criando produto com múltiplas imagens...');
    
    const testProduct = {
      name: 'Produto Teste Múltiplas Imagens',
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpressLink: 'https://example.com',
      imageUrl: 'https://via.placeholder.com/300x300/0066cc/ffffff?text=Principal',
      images: [
        {
          id: 'img_test_1',
          url: 'https://via.placeholder.com/300x300/0066cc/ffffff?text=Principal',
          type: 'main',
          alt: 'Imagem principal do produto teste',
          created_at: new Date().toISOString(),
          order: 1
        },
        {
          id: 'img_test_2',
          url: 'https://via.placeholder.com/300x300/00cc66/ffffff?text=Galeria1',
          type: 'gallery',
          alt: 'Primeira imagem da galeria',
          created_at: new Date().toISOString(),
          order: 2
        },
        {
          id: 'img_test_3',
          url: 'https://via.placeholder.com/300x300/cc6600/ffffff?text=Galeria2',
          type: 'gallery',
          alt: 'Segunda imagem da galeria',
          created_at: new Date().toISOString(),
          order: 3
        }
      ],
      description: 'Produto criado para testar o sistema de múltiplas imagens',
      purchasePrice: 100,
      shippingCost: 10,
      importTaxes: 15,
      packagingCost: 5,
      marketingCost: 10,
      otherCosts: 5,
      sellingPrice: 200,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased',
      purchaseDate: new Date()
    };
    
    const createResponse = await fetch(`${API_BASE_URL}/create?user_id=${TEST_USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Erro ao criar produto:', createResponse.status, errorText);
      return;
    }
    
    const createResult = await createResponse.json();
    console.log('✅ Produto criado via API!');
    console.log(`   Firebase: ${createResult.firebaseSuccess ? '✅' : '❌'}`);
    console.log(`   Supabase: ${createResult.supabaseSuccess ? '✅' : '❌'}`);
    
    // 2. Buscar produtos para verificar se as imagens foram salvas
    console.log('\n2. Verificando produtos salvos...');
    
    const getResponse = await fetch(`${API_BASE_URL}/get?user_id=${TEST_USER_ID}`);
    
    if (!getResponse.ok) {
      console.log('❌ Erro ao buscar produtos:', getResponse.status);
      return;
    }
    
    const getResult = await getResponse.json();
    const products = getResult.products || [];
    
    console.log(`✅ ${products.length} produtos encontrados`);
    
    // Encontrar o produto de teste
    const testProductFound = products.find(p => p.name === 'Produto Teste Múltiplas Imagens');
    
    if (testProductFound) {
      console.log('\n3. Verificando imagens do produto de teste...');
      console.log(`   ID do produto: ${testProductFound.id}`);
      console.log(`   imageUrl: ${testProductFound.imageUrl}`);
      
      if (testProductFound.images && Array.isArray(testProductFound.images)) {
        console.log(`   ✅ ${testProductFound.images.length} imagens encontradas:`);
        testProductFound.images.forEach((img, index) => {
          console.log(`      ${index + 1}. ${img.type} - ${img.url}`);
          console.log(`         Alt: ${img.alt}`);
          console.log(`         ID: ${img.id}`);
        });
      } else {
        console.log('   ❌ Campo images não encontrado ou vazio');
        console.log('   Produto completo:', JSON.stringify(testProductFound, null, 2));
      }
      
      // 4. Testar atualização com novas imagens
      console.log('\n4. Testando atualização com nova imagem...');
      
      const updatedImages = [
        ...(testProductFound.images || []),
        {
          id: 'img_test_4',
          url: 'https://via.placeholder.com/300x300/6600cc/ffffff?text=Nova',
          type: 'gallery',
          alt: 'Nova imagem adicionada via atualização',
          created_at: new Date().toISOString(),
          order: 4
        }
      ];
      
      const updateData = {
        images: updatedImages,
        description: 'Produto atualizado com nova imagem'
      };
      
      const updateResponse = await fetch(`${API_BASE_URL}/update?user_id=${TEST_USER_ID}&product_id=${testProductFound.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ Produto atualizado via API!');
        console.log(`   Firebase: ${updateResult.firebaseSuccess ? '✅' : '❌'}`);
        console.log(`   Supabase: ${updateResult.supabaseSuccess ? '✅' : '❌'}`);
      } else {
        const errorText = await updateResponse.text();
        console.log('❌ Erro ao atualizar produto:', updateResponse.status, errorText);
      }
      
      // 5. Verificar produto atualizado
      console.log('\n5. Verificando produto após atualização...');
      
      const getUpdatedResponse = await fetch(`${API_BASE_URL}/get?user_id=${TEST_USER_ID}`);
      if (getUpdatedResponse.ok) {
        const getUpdatedResult = await getUpdatedResponse.json();
        const updatedProduct = getUpdatedResult.products?.find(p => p.id === testProductFound.id);
        
        if (updatedProduct && updatedProduct.images) {
          console.log(`   ✅ Produto atualizado tem ${updatedProduct.images.length} imagens`);
        } else {
          console.log('   ❌ Produto atualizado não encontrado ou sem imagens');
        }
      }
      
      // 6. Limpeza - remover produto de teste
      console.log('\n6. Removendo produto de teste...');
      
      const deleteResponse = await fetch(`${API_BASE_URL}/delete?user_id=${TEST_USER_ID}&product_id=${testProductFound.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Produto de teste removido com sucesso!');
      } else {
        console.log('❌ Erro ao remover produto de teste');
      }
      
    } else {
      console.log('❌ Produto de teste não encontrado');
    }
    
    console.log('\n🎉 Teste de múltiplas imagens via API concluído!');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

// Executar teste
testMultipleImagesAPI().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});