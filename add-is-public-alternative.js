const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com SERVICE ROLE KEY
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

async function addIsPublicColumnAlternative() {
  console.log('🔧 Adicionando coluna is_public na tabela products (método alternativo)...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase com SERVICE ROLE...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar produtos atuais
    console.log('\n1. Verificando produtos atuais...');
    
    const { data: currentProducts, error: currentError } = await supabase
      .from('products')
      .select('*');
    
    if (currentError) {
      console.log('❌ Erro ao buscar produtos:', currentError.message);
      return;
    }
    
    console.log(`📦 ${currentProducts.length} produtos encontrados`);
    
    if (currentProducts.length > 0) {
      const columns = Object.keys(currentProducts[0]);
      console.log('📋 Colunas atuais da tabela products:');
      columns.forEach(col => console.log(`   - ${col}`));
      
      if (columns.includes('is_public')) {
        console.log('\n✅ Coluna is_public já existe!');
        
        // Verificar se precisa atualizar valores
        const productsWithUndefined = currentProducts.filter(p => p.is_public === null || p.is_public === undefined);
        
        if (productsWithUndefined.length > 0) {
          console.log(`\n🔧 ${productsWithUndefined.length} produtos com is_public undefined/null`);
          
          for (const product of productsWithUndefined) {
            const quantitySold = product.quantity_sold || 0;
            const availableStock = product.quantity - quantitySold;
            
            // Determinar se deve ser público
            const shouldBePublic = (product.status === 'selling' || product.status === 'received') && 
                                  availableStock > 0;
            
            console.log(`🔧 Atualizando ${product.name}: is_public = ${shouldBePublic}`);
            
            const { error: updateError } = await supabase
              .from('products')
              .update({ is_public: shouldBePublic })
              .eq('id', product.id);
            
            if (updateError) {
              console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
            } else {
              console.log(`   ✅ Atualizado com sucesso`);
            }
          }
        } else {
          console.log('\n✅ Todos os produtos já têm valores definidos para is_public');
        }
        
      } else {
        console.log('\n❌ Coluna is_public NÃO existe');
        console.log('\n🚨 INSTRUÇÕES PARA ADICIONAR A COLUNA:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/atyeakcunmhrzzpdcvxm/sql');
        console.log('2. Cole e execute o seguinte SQL:');
        console.log('');
        console.log('ALTER TABLE public.products ADD COLUMN is_public BOOLEAN DEFAULT false;');
        console.log('');
        console.log('3. Depois execute novamente este script');
        return;
      }
    }
    
    // 2. Verificar resultado final
    console.log('\n2. Verificando resultado final...');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('products')
      .select('*');
    
    if (finalError) {
      console.log('❌ Erro ao verificar resultado final:', finalError.message);
      return;
    }
    
    const publicProducts = finalProducts.filter(p => p.is_public === true);
    const privateProducts = finalProducts.filter(p => p.is_public === false);
    const undefinedProducts = finalProducts.filter(p => p.is_public === null || p.is_public === undefined);
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log(`- Total de produtos: ${finalProducts.length}`);
    console.log(`- Produtos públicos: ${publicProducts.length}`);
    console.log(`- Produtos privados: ${privateProducts.length}`);
    console.log(`- Produtos undefined: ${undefinedProducts.length}`);
    
    if (publicProducts.length > 0) {
      console.log('\n🎉 PRODUTOS PÚBLICOS (que aparecerão na interface):');
      publicProducts.forEach((product, index) => {
        const quantitySold = product.quantity_sold || 0;
        const availableStock = product.quantity - quantitySold;
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Disponível: ${availableStock}`);
        console.log(`   User: ${product.user_id}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  Nenhum produto público encontrado');
    }
    
    if (undefinedProducts.length > 0) {
      console.log('\n⚠️  PRODUTOS COM is_public UNDEFINED:');
      undefinedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (${product.status})`);
      });
    }
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (publicProducts.length > 0) {
      console.log('1. ✅ Produtos públicos configurados');
      console.log('2. Fazer login na aplicação com joeltere8@gmail.com');
      console.log('3. Verificar se os produtos aparecem na página inicial');
      console.log('4. Verificar a página "Gerenciar Produtos"');
    } else {
      console.log('1. ❌ Nenhum produto público - verificar critérios');
      console.log('2. Produtos precisam ter status "selling" ou "received"');
      console.log('3. Produtos precisam ter estoque disponível (quantity > quantity_sold)');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

addIsPublicColumnAlternative();