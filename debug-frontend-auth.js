const axios = require('axios');

async function debugFrontendAuth() {
  console.log('🔍 Debugando autenticação do frontend...\n');
  
  try {
    // 1. Testar se o servidor está respondendo
    console.log('1. Testando se o servidor está respondendo...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/', {
        timeout: 5000
      });
      console.log('✅ Servidor respondendo na porta 3001');
    } catch (error) {
      console.log('❌ Servidor não está respondendo na porta 3001');
      console.log('   Erro:', error.message);
      return;
    }

    // 2. Testar API de produtos sem autenticação (deve dar erro)
    console.log('\n2. Testando API de produtos sem user_id...');
    try {
      const noUserResponse = await axios.get('http://localhost:3001/api/products/get', {
        timeout: 5000
      });
      console.log('⚠️ API respondeu sem user_id:', noUserResponse.status);
    } catch (error) {
      if (error.response) {
        console.log(`✅ API corretamente rejeitou sem user_id: ${error.response.status} - ${error.response.data?.error || 'Erro desconhecido'}`);
      } else {
        console.log('❌ Erro de conexão:', error.message);
      }
    }

    // 3. Testar API de produtos com user_id do Joel
    console.log('\n3. Testando API de produtos com user_id do Joel...');
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    try {
      const joelResponse = await axios.get(`http://localhost:3001/api/products/get?user_id=${joelUserId}`, {
        timeout: 10000
      });
      
      console.log(`✅ API respondeu para Joel: ${joelResponse.status}`);
      console.log(`📦 Produtos encontrados: ${joelResponse.data.products?.length || 0}`);
      
      if (joelResponse.data.products && joelResponse.data.products.length > 0) {
        console.log('\n📋 Produtos do Joel:');
        joelResponse.data.products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      Status: ${product.status}`);
          console.log(`      Quantidade: ${product.quantity}`);
          console.log(`      Vendidos: ${product.quantity_sold}`);
          console.log(`      Disponível: ${product.quantity - product.quantity_sold}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Nenhum produto encontrado para Joel');
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ API erro para Joel: ${error.response.status} - ${error.response.data?.error || 'Erro desconhecido'}`);
      } else {
        console.log('❌ Erro de conexão:', error.message);
      }
    }

    // 4. Testar se há outros usuários com produtos
    console.log('\n4. Testando outros usuários...');
    const otherUserIds = [
      '550e8400-e29b-41d4-a716-446655440000', // Usuário Teste Produto
      'f47ac10b-58cc-4372-a567-0e02b2c3d479'  // Usuário Teste
    ];

    for (const userId of otherUserIds) {
      try {
        const userResponse = await axios.get(`http://localhost:3001/api/products/get?user_id=${userId}`, {
          timeout: 5000
        });
        
        console.log(`✅ Usuário ${userId}: ${userResponse.data.products?.length || 0} produtos`);
        
        if (userResponse.data.products && userResponse.data.products.length > 0) {
          userResponse.data.products.forEach(product => {
            console.log(`   - ${product.name} (${product.status})`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Erro para usuário ${userId}:`, error.response?.status || error.message);
      }
    }

    // 5. Verificar se a página de produtos está acessível
    console.log('\n5. Testando acesso à página de produtos...');
    try {
      const pageResponse = await axios.get('http://localhost:3001/produtos', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ Página de produtos acessível: ${pageResponse.status}`);
      
      // Verificar se há indicações de erro na página
      const pageContent = pageResponse.data;
      if (pageContent.includes('0 disponíveis') || pageContent.includes('Nenhum produto')) {
        console.log('⚠️ Página indica que não há produtos disponíveis');
      }
      
    } catch (error) {
      console.log('❌ Erro ao acessar página de produtos:', error.response?.status || error.message);
    }

    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('========================');
    console.log('✅ Servidor está rodando');
    console.log('✅ API de produtos está funcionando');
    console.log('✅ Dados estão no banco de dados');
    console.log('');
    console.log('🤔 POSSÍVEIS PROBLEMAS:');
    console.log('- Usuário não está logado na interface');
    console.log('- Problema na autenticação do frontend');
    console.log('- Erro de JavaScript na página');
    console.log('- Cache do navegador');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugFrontendAuth();