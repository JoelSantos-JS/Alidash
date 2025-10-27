const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIzNDEsImV4cCI6MjA3MTQ0ODM0MX0.qFHcONpGQVAwWfMhCdh2kX5ZNBk5qtNM1M7_GS-LXZ4';

async function fixIsPublicDirect() {
  console.log('🔧 Corrigindo campo is_public diretamente no Supabase...\n');
  
  try {
    // Tentar usar as variáveis de ambiente primeiro
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;
    
    console.log('🔗 Conectando ao Supabase...');
    const supabase = createClient(url, key);
    
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    // 1. Buscar produtos do Joel
    console.log('1. Buscando produtos do Joel...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', joelUserId);
    
    if (fetchError) {
      console.log('❌ Erro ao buscar produtos:', fetchError.message);
      return;
    }
    
    console.log(`✅ ${products.length} produto(s) encontrado(s)`);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado para Joel');
      return;
    }
    
    // 2. Corrigir cada produto
    for (const product of products) {
      console.log(`\n📦 Produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${product.quantity_sold}`);
      console.log(`   Público atual: ${product.is_public}`);
      
      // Verificar se precisa corrigir is_public
      if (product.is_public === null || product.is_public === undefined) {
        console.log('   🔧 Corrigindo is_public: null/undefined → true');
        
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({ is_public: true })
          .eq('id', product.id)
          .select()
          .single();
        
        if (updateError) {
          console.log('   ❌ Erro ao atualizar is_public:', updateError.message);
        } else {
          console.log('   ✅ Campo is_public atualizado com sucesso!');
          console.log(`   📊 Novo valor: ${updatedProduct.is_public}`);
        }
      } else {
        console.log('   ✅ Campo is_public já está correto');
      }
    }
    
    // 3. Verificação final
    console.log('\n🔍 Verificação final...');
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', joelUserId);
    
    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError.message);
      return;
    }
    
    console.log('\n📊 Estado final dos produtos:');
    finalProducts.forEach((product, index) => {
      const quantitySold = product.quantity_sold || 0;
      const availableStock = product.quantity - quantitySold;
      const shouldAppear = availableStock > 0 && 
                         (product.status === 'selling' || product.status === 'received') &&
                         product.is_public === true;
      
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${quantitySold}`);
      console.log(`   Disponível: ${availableStock}`);
      console.log(`   Público: ${product.is_public}`);
      console.log(`   Deveria aparecer na interface: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
      
      if (shouldAppear) {
        console.log('   🎉 PRODUTO PRONTO PARA APARECER NA INTERFACE!');
      }
      console.log('');
    });
    
    console.log('🎉 Correção do is_public concluída!');
    console.log('\n📝 AGORA TESTE:');
    console.log('1. Faça login na aplicação com: joeltere8@gmail.com');
    console.log('2. Vá para a página "Gerenciar Produtos"');
    console.log('3. O produto deve aparecer agora!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

fixIsPublicDirect();