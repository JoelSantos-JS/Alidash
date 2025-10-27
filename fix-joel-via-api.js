const axios = require('axios');

async function fixJoelViaAPI() {
  console.log('🔧 Corrigindo produto do Joel via API...\n');
  
  try {
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    const baseUrl = 'http://localhost:3001/api/products';
    
    // 1. Buscar produtos do Joel
    console.log('1. Buscando produtos do Joel...');
    const getResponse = await axios.get(`${baseUrl}/get?user_id=${joelUserId}`, {
      timeout: 10000
    });
    
    if (getResponse.status !== 200) {
      console.log('❌ Erro ao buscar produtos:', getResponse.status);
      return;
    }
    
    const products = getResponse.data.products || [];
    console.log(`✅ ${products.length} produto(s) encontrado(s)`);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado para Joel');
      return;
    }
    
    // 2. Analisar e corrigir cada produto
    for (const product of products) {
      console.log(`\n📦 Produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status atual: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${product.quantity_sold}`);
      
      // Preparar dados de atualização
      const updates = { ...product };
      let needsUpdate = false;
      
      // Corrigir quantity_sold se for null/undefined
      if (product.quantity_sold === null || product.quantity_sold === undefined) {
        updates.quantity_sold = 0;
        updates.quantitySold = 0; // Para compatibilidade com o frontend
        needsUpdate = true;
        console.log('   🔧 Corrigindo quantity_sold: null/undefined → 0');
      }
      
      // Se o produto está como "sold" mas tem estoque disponível, mudar para "selling"
      const availableStock = product.quantity - (product.quantity_sold || 0);
      if (product.status === 'sold' && availableStock > 0) {
        updates.status = 'selling';
        needsUpdate = true;
        console.log(`   🔧 Corrigindo status: sold → selling (estoque disponível: ${availableStock})`);
      }
      
      // Se o produto não está público, torná-lo público
      if (!product.is_public) {
        updates.is_public = true;
        updates.isPublic = true; // Para compatibilidade com o frontend
        needsUpdate = true;
        console.log('   🔧 Tornando produto público: false → true');
      }
      
      // Aplicar atualizações se necessário
      if (needsUpdate) {
        console.log('   📝 Aplicando correções via API...');
        
        try {
          const updateResponse = await axios.put(
            `${baseUrl}/update?user_id=${joelUserId}&product_id=${product.id}`,
            updates,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          
          if (updateResponse.status === 200) {
            console.log('   ✅ Produto atualizado com sucesso via API!');
            const result = updateResponse.data;
            console.log(`   📊 Resultado: ${result.success ? 'Sucesso' : 'Falha'}`);
            
            if (result.success) {
              console.log(`   📊 Novo status: ${updates.status}`);
              console.log(`   📊 Quantity_sold: ${updates.quantity_sold}`);
              console.log(`   📊 Público: ${updates.is_public}`);
              console.log(`   📊 Estoque disponível: ${updates.quantity - updates.quantity_sold}`);
            } else if (result.errors) {
              console.log(`   ⚠️ Erros: ${result.errors.join(', ')}`);
            }
          } else {
            console.log(`   ❌ API retornou status ${updateResponse.status}`);
          }
          
        } catch (updateError) {
          console.log('   ❌ Erro ao atualizar via API:', updateError.response?.status || updateError.message);
          if (updateError.response?.data) {
            console.log('   📋 Detalhes do erro:', updateError.response.data);
          }
        }
      } else {
        console.log('   ✅ Produto já está correto, nenhuma atualização necessária');
      }
    }
    
    // 3. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    const finalResponse = await axios.get(`${baseUrl}/get?user_id=${joelUserId}`, {
      timeout: 10000
    });
    
    if (finalResponse.status === 200) {
      const finalProducts = finalResponse.data.products || [];
      
      console.log('\n📊 Estado final dos produtos:');
      finalProducts.forEach((product, index) => {
        const availableStock = product.quantity - (product.quantity_sold || 0);
        const shouldAppear = availableStock > 0 && (product.status === 'selling' || product.status === 'received');
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Quantidade: ${product.quantity}`);
        console.log(`   Vendidos: ${product.quantity_sold || 0}`);
        console.log(`   Disponível: ${availableStock}`);
        console.log(`   Público: ${product.is_public}`);
        console.log(`   Deveria aparecer na interface: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
        console.log('');
      });
    }
    
    console.log('🎉 Correção via API concluída!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Faça login na aplicação com: joeltere8@gmail.com');
    console.log('2. Vá para a página "Gerenciar Produtos"');
    console.log('3. Os produtos agora devem aparecer!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

fixJoelViaAPI();