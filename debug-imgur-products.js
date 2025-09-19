// Script para debugar e encontrar produtos com URLs do Imgur problemáticas
const https = require('https');
const http = require('http');

// Configuração da API local
const API_GET_URL = 'http://localhost:3000/api/products/get';
const API_UPDATE_URL = 'http://localhost:3000/api/products/update';
const USER_ID = 'a8a4b3fb-a614-4690-9f5d-fd4dda9c3b53'; // ID do usuário dos logs

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

async function debugImgurProducts() {
  console.log('🔍 Debugando produtos para encontrar URLs do Imgur...');
  
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
    
    // 2. Analisar cada produto em detalhes
    console.log('\n2. Analisando produtos em detalhes...');
    
    let productsWithImgur = [];
    
    for (const product of products) {
      console.log(`\n📦 Produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      
      let hasImgurUrls = false;
      let imgurDetails = [];
      
      // Verificar imageUrl
      if (product.imageUrl) {
        console.log(`   imageUrl: ${product.imageUrl}`);
        if (product.imageUrl.includes('imgur.com')) {
          hasImgurUrls = true;
          imgurDetails.push(`imageUrl: ${product.imageUrl}`);
        }
      } else {
        console.log(`   imageUrl: (vazio)`);
      }
      
      // Verificar images array
      if (product.images && Array.isArray(product.images)) {
        console.log(`   images array: ${product.images.length} imagens`);
        product.images.forEach((image, index) => {
          console.log(`     [${index}] ${image.url} (${image.type || 'sem tipo'})`);
          if (image.url && image.url.includes('imgur.com')) {
            hasImgurUrls = true;
            imgurDetails.push(`images[${index}]: ${image.url}`);
          }
        });
      } else {
        console.log(`   images array: (vazio ou não é array)`);
      }
      
      if (hasImgurUrls) {
        productsWithImgur.push({
          product,
          imgurUrls: imgurDetails
        });
        console.log(`   🚨 CONTÉM URLs DO IMGUR!`);
        imgurDetails.forEach(detail => {
          console.log(`     - ${detail}`);
        });
      }
    }
    
    // 3. Relatório de URLs do Imgur encontradas
    console.log('\n📊 Relatório de URLs do Imgur:');
    console.log(`   🔍 Produtos verificados: ${products.length}`);
    console.log(`   🚨 Produtos com URLs do Imgur: ${productsWithImgur.length}`);
    
    if (productsWithImgur.length === 0) {
      console.log('\n✅ Nenhuma URL do Imgur encontrada nos produtos!');
      console.log('   O problema pode estar em outro lugar ou já foi resolvido.');
      return;
    }
    
    // 4. Perguntar se deve corrigir
    console.log('\n🔧 URLs do Imgur encontradas! Corrigindo automaticamente...');
    
    let totalFixed = 0;
    
    for (const { product, imgurUrls } of productsWithImgur) {
      console.log(`\n🔧 Corrigindo produto: ${product.name}`);
      
      let updatedProduct = { ...product };
      let needsUpdate = false;
      
      // Corrigir imageUrl
      if (product.imageUrl && product.imageUrl.includes('imgur.com')) {
        updatedProduct.imageUrl = PLACEHOLDER_URL;
        needsUpdate = true;
        console.log(`   ✅ imageUrl corrigida: ${PLACEHOLDER_URL}`);
      }
      
      // Corrigir images array
      if (product.images && Array.isArray(product.images)) {
        updatedProduct.images = product.images.map((image, index) => {
          if (image.url && image.url.includes('imgur.com')) {
            needsUpdate = true;
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
      
      if (!needsUpdate) {
        console.log(`   ⚠️ Nenhuma correção necessária`);
        continue;
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
            console.log(`   📝 Detalhes:`, JSON.stringify(updateResponse.data, null, 2));
          } else {
            console.log(`   📝 Resposta:`, updateResponse.data);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao atualizar produto:`, error.message);
      }
      
      // Aguardar um pouco entre atualizações
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 5. Relatório final
    console.log('\n📊 Relatório Final:');
    console.log(`   🔍 Produtos verificados: ${products.length}`);
    console.log(`   🚨 Produtos com URLs do Imgur: ${productsWithImgur.length}`);
    console.log(`   ✅ Produtos corrigidos: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n🎉 Correção concluída!');
      console.log('   Os erros de imagem do Imgur devem parar de aparecer nos logs.');
      console.log('   \n🔄 Recomendação: Recarregue a página para ver as mudanças.');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o debug:', error);
  }
}

// Executar debug
debugImgurProducts().then(() => {
  console.log('\n🏁 Debug finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});