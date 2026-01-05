const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixJoelProduct() {
  console.log('🔧 Corrigindo produto do Joel...\n');
  
  try {
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    // 1. Buscar o produto do Joel
    console.log('1. Buscando produto do Joel...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', joelUserId);

    if (fetchError) {
      console.error('❌ Erro ao buscar produtos:', fetchError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('❌ Nenhum produto encontrado para Joel');
      return;
    }

    console.log(`✅ ${products.length} produto(s) encontrado(s)`);

    // 2. Analisar e corrigir cada produto
    for (const product of products) {
      console.log(`\n📦 Produto: ${product.name}`);
      console.log(`   Status atual: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${product.quantity_sold}`);
      
      // Preparar atualizações
      const updates = {};
      let needsUpdate = false;

      // Corrigir quantity_sold se for null/undefined
      if (product.quantity_sold === null || product.quantity_sold === undefined) {
        updates.quantity_sold = 0;
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
        needsUpdate = true;
        console.log('   🔧 Tornando produto público: false → true');
      }

      // Aplicar atualizações se necessário
      if (needsUpdate) {
        console.log('   📝 Aplicando correções...');
        
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id)
          .select()
          .single();

        if (updateError) {
          console.error('   ❌ Erro ao atualizar produto:', updateError);
        } else {
          console.log('   ✅ Produto atualizado com sucesso!');
          console.log(`   📊 Novo status: ${updatedProduct.status}`);
          console.log(`   📊 Quantity_sold: ${updatedProduct.quantity_sold}`);
          console.log(`   📊 Público: ${updatedProduct.is_public}`);
          console.log(`   📊 Estoque disponível: ${updatedProduct.quantity - updatedProduct.quantity_sold}`);
        }
      } else {
        console.log('   ✅ Produto já está correto, nenhuma atualização necessária');
      }
    }

    // 3. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', joelUserId);

    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
      return;
    }

    console.log('\n📊 Estado final dos produtos:');
    finalProducts.forEach((product, index) => {
      const availableStock = product.quantity - product.quantity_sold;
      const shouldAppear = availableStock > 0 && (product.status === 'selling' || product.status === 'received');
      
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${product.quantity_sold}`);
      console.log(`   Disponível: ${availableStock}`);
      console.log(`   Público: ${product.is_public}`);
      console.log(`   Deveria aparecer na interface: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
      console.log('');
    });

    console.log('🎉 Correção concluída!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Faça login na aplicação com: joeltere8@gmail.com');
    console.log('2. Vá para a página "Gerenciar Produtos"');
    console.log('3. Os produtos agora devem aparecer!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixJoelProduct();
