const axios = require('axios');

async function testProductsAPI() {
  try {
    console.log('🔍 Testando API de produtos...');
    
    // Testar com o usuário Joel que tem produtos
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    console.log(`\n📡 Fazendo requisição para: /api/products/get?user_id=${joelUserId}`);
    
    const response = await axios.get(`http://localhost:3000/api/products/get?user_id=${joelUserId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.products && response.data.products.length > 0) {
      console.log(`\n📦 Encontrados ${response.data.products.length} produtos:`);
      response.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.category} - R$ ${product.price}`);
      });
    } else {
      console.log('\n⚠️ Nenhum produto retornado pela API');
    }
    
    // Testar também sem user_id para ver o que acontece
    console.log('\n🔍 Testando API sem user_id...');
    try {
      const responseNoUser = await axios.get('http://localhost:3000/api/products/get', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status da resposta (sem user_id): ${responseNoUser.status}`);
      console.log('📝 Resposta:', JSON.stringify(responseNoUser.data, null, 2));
    } catch (error) {
      console.log(`📊 Status da resposta (sem user_id): ${error.response?.status || 'Erro'}`);
      console.log('📝 Resposta de erro (esperado):', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Dados:', error.response.data);
    }
  }
}

testProductsAPI();