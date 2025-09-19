// Script para corrigir a URL específica do Imgur que está causando erros
const https = require('https');
const http = require('http');

// Configuração da API local
const API_GET_URL = 'http://localhost:3000/api/products/get';
const API_UPDATE_URL = 'http://localhost:3000/api/products/update';
const USER_ID = 'a8a4b3fb-a614-4690-9f5d-fd4dda9c3b53'; // ID do usuário dos logs

// URL problemática específica dos logs
const PROBLEMATIC_URL = 'https://imgur.com/a/UddQ0Hb';

// URL de placeholder para substituir
const PLACEHOLDER_URL = '/placeholder-product.svg';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function fixSpecificImgurUrl() {
  console.log('🔧 Corrigindo URL específica do Imgur que está causando erros...');
  console.log(`🎯 URL problemática: ${PROBLEMATIC_URL}`);
  
  try {
    // 1. Buscar todos os produtos do usuário
    console.log('\n1. Buscando produtos do usuário...');
    
    const getUrl = `${API_GET_URL}?user_id=${USER_ID}`;
    const response = await makeRequest(getUrl);
    
    if (response.status !== 200) {
      console.log('❌ Erro ao buscar produtos:', response.status, response.data);
      return;
    }
    
    const products = response.data.products || [];
    console.log(`✅ ${products.length} produtos encontrados`);
    
    let totalFixed = 0;
    let productsWithIssues = [];
    
    // 2. Verificar cada produto pela URL específica
    console.log('\n2. Verificando URL problemática específica...');
    
    for (const product of products) {
      let hasIssues = false;
      let issueDetails = [];
      
      // Verificar imageUrl
      if (product.imageUrl && product.imageUrl === PROBLEMATIC_URL) {
        hasIssues = true;
        issueDetails.push(`imageUrl: ${product.imageUrl}`);
      }
      
      // Verificar images array
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((image, index) => {
          if (image.url && image.url === PROBLEMATIC_URL) {
            hasIssues = true;
            issueDetails.push(`images[${index}]: ${image.url}`);
          }
        });
      }
      
      if (hasIssues) {
        productsWithIssues.push({
          product,
          issues: issueDetails
        });
        
        console.log(`🔍 Produto com URL problemática: ${product.name}`);
        console.log(`   ID: ${product.id}`);
        issueDetails.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    }
    
    if (productsWithIssues.length === 0) {
      console.log('✅ Nenhum produto com a URL problemática específica encontrado!');
      console.log('   Os erros podem ter sido resolvidos ou a URL pode estar em cache.');
      return;
    }
    
    console.log(`\n⚠️ ${productsWithIssues.length} produto(s) com a URL problemática encontrado(s)`);
    
    // 3. Corrigir produtos problemáticos
    console.log('\n3. Corrigindo produtos...');
    
    for (const { product, issues } of productsWithIssues) {
      console.log(`\n🔧 Corrigindo produto: ${product.name}`);
      
      let updatedProduct = { ...product };
      
      // Corrigir imageUrl
      if (product.imageUrl === PROBLEMATIC_URL) {
        updatedProduct.imageUrl = PLACEHOLDER_URL;
        console.log(`   ✅ imageUrl corrigida: ${PLACEHOLDER_URL}`);
      }
      
      // Corrigir images array
      if (product.images && Array.isArray(product.images)) {
        updatedProduct.images = product.images.map((image, index) => {
          if (image.url === PROBLEMATIC_URL) {
            console.log(`   ✅ images[${index}] corrigida: ${PLACEHOLDER_URL}`);
            return {
              ...image,
              url: PLACEHOLDER_URL,
              alt: image.alt || 'Imagem do produto'
            };
          }
          return image;
        });
      }
      
      // Atualizar produto via API
      try {
        const updateUrl = `${API_UPDATE_URL}?user_id=${USER_ID}&product_id=${product.id}`;
        const updateData = {
          imageUrl: updatedProduct.imageUrl,
          images: updatedProduct.images
        };
        
        console.log(`   🔄 Enviando atualização...`);
        
        const updateResponse = await makeRequest(updateUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.status === 200) {
          console.log(`   ✅ Produto atualizado com sucesso`);
          console.log(`   📊 Firebase: ${updateResponse.data.firebaseSuccess ? '✅' : '❌'}`);
          console.log(`   📊 Supabase: ${updateResponse.data.supabaseSuccess ? '✅' : '❌'}`);
          totalFixed++;
        } else {
          console.log(`   ❌ Erro ao atualizar produto:`, updateResponse.status);
          if (updateResponse.data && typeof updateResponse.data === 'object') {
            console.log(`   📝 Detalhes:`, updateResponse.data);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao atualizar produto:`, error.message);
      }
      
      // Aguardar um pouco entre atualizações
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. Relatório final
    console.log('\n📊 Relatório de Correção:');
    console.log(`   🔍 Produtos verificados: ${products.length}`);
    console.log(`   ⚠️ Produtos com URL problemática: ${productsWithIssues.length}`);
    console.log(`   ✅ Produtos corrigidos: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n🎉 Correção concluída! A URL problemática foi substituída.');
      console.log('   Os erros de imagem devem parar de aparecer nos logs.');
      console.log('   \n🔄 Recomendação: Recarregue a página para ver as mudanças.');
      console.log('   \n⏰ Aguarde alguns segundos para o cache ser limpo.');
    }
    
    // 5. Verificação final
    console.log('\n5. Verificação final...');
    
    const finalResponse = await makeRequest(getUrl);
    if (finalResponse.status === 200) {
      const finalProducts = finalResponse.data.products || [];
      let stillHasIssues = false;
      
      for (const product of finalProducts) {
        if (product.imageUrl === PROBLEMATIC_URL) {
          stillHasIssues = true;
          break;
        }
        if (product.images && Array.isArray(product.images)) {
          for (const image of product.images) {
            if (image.url === PROBLEMATIC_URL) {
              stillHasIssues = true;
              break;
            }
          }
        }
        if (stillHasIssues) break;
      }
      
      if (stillHasIssues) {
        console.log('⚠️ Ainda existem produtos com a URL problemática.');
        console.log('   Pode ser necessário executar o script novamente.');
      } else {
        console.log('✅ Verificação final: Nenhuma URL problemática encontrada!');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro durante a correção:', error);
  }
}

// Executar correção
fixSpecificImgurUrl().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});