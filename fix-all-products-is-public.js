const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com SERVICE ROLE KEY
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

async function fixAllProductsIsPublic() {
  console.log('🔧 Corrigindo campo is_public de todos os produtos...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase com SERVICE ROLE...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Buscar todos os produtos
    console.log('\n1. Buscando todos os produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
      return;
    }
    
    console.log(`✅ ${products.length} produto(s) encontrado(s)`);
    
    if (products.length === 0) {
      console.log('ℹ️ Nenhum produto para corrigir.');
      return;
    }
    
    // 2. Identificar produtos com is_public undefined/null
    const productsToFix = products.filter(p => p.is_public === null || p.is_public === undefined);
    
    console.log(`\n2. Produtos com is_public undefined/null: ${productsToFix.length}`);
    
    if (productsToFix.length === 0) {
      console.log('✅ Todos os produtos já têm is_public definido!');
      
      // Mostrar status atual
      console.log('\n📊 STATUS ATUAL DOS PRODUTOS:');
      products.forEach((product, index) => {
        const quantitySold = product.quantity_sold || 0;
        const availableStock = product.quantity - quantitySold;
        const shouldAppear = availableStock > 0 && 
                           (product.status === 'selling' || product.status === 'received') &&
                           product.is_public === true;
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Disponível: ${availableStock}`);
        console.log(`   Público: ${product.is_public}`);
        console.log(`   Deveria aparecer: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
        console.log('');
      });
      
      return;
    }
    
    // 3. Corrigir produtos
    console.log('\n3. Corrigindo produtos...');
    
    for (const product of productsToFix) {
      console.log(`\n🔧 Corrigindo produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status atual: ${product.status}`);
      console.log(`   is_public atual: ${product.is_public}`);
      
      // Determinar se deve ser público baseado no status
      let shouldBePublic = false;
      
      if (product.status === 'selling' || product.status === 'received') {
        const quantitySold = product.quantity_sold || 0;
        const availableStock = product.quantity - quantitySold;
        
        if (availableStock > 0) {
          shouldBePublic = true;
          console.log(`   ✅ Produto tem estoque (${availableStock}) e status vendável - será público`);
        } else {
          console.log(`   ❌ Produto sem estoque - será privado`);
        }
      } else {
        console.log(`   ❌ Status "${product.status}" não é vendável - será privado`);
      }
      
      // Atualizar produto
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({ is_public: shouldBePublic })
        .eq('id', product.id)
        .select();
      
      if (updateError) {
        console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
      } else {
        console.log(`   ✅ Atualizado: is_public = ${shouldBePublic}`);
      }
    }
    
    // 4. Verificar resultado final
    console.log('\n4. Verificando resultado final...');
    const { data: updatedProducts, error: finalError } = await supabase
      .from('products')
      .select('*');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
      return;
    }
    
    console.log('\n📊 RESULTADO FINAL:');
    const publicProducts = updatedProducts.filter(p => p.is_public === true);
    const privateProducts = updatedProducts.filter(p => p.is_public === false);
    const undefinedProducts = updatedProducts.filter(p => p.is_public === null || p.is_public === undefined);
    
    console.log(`- Produtos públicos: ${publicProducts.length}`);
    console.log(`- Produtos privados: ${privateProducts.length}`);
    console.log(`- Produtos com is_public undefined: ${undefinedProducts.length}`);
    
    if (publicProducts.length > 0) {
      console.log('\n🎉 PRODUTOS PÚBLICOS (deveriam aparecer na interface):');
      publicProducts.forEach((product, index) => {
        const quantitySold = product.quantity_sold || 0;
        const availableStock = product.quantity - quantitySold;
        const shouldAppear = availableStock > 0 && 
                           (product.status === 'selling' || product.status === 'received');
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   User: ${product.user_id}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Disponível: ${availableStock}`);
        console.log(`   Deveria aparecer: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
        console.log('');
      });
    }
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Abrir a aplicação no navegador');
    console.log('2. Fazer login com joeltere8@gmail.com');
    console.log('3. Verificar se os produtos aparecem na página inicial');
    console.log('4. Verificar a página "Gerenciar Produtos"');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

fixAllProductsIsPublic();