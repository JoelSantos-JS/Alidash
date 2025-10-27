const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com SERVICE ROLE KEY
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

async function checkProductsVisibility() {
  console.log('🔍 Verificando visibilidade dos produtos...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase com SERVICE ROLE...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Buscar todos os produtos
    console.log('\n1. Buscando todos os produtos...');
    
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
      return;
    }
    
    console.log(`📦 ${allProducts.length} produtos encontrados`);
    
    if (allProducts.length === 0) {
      console.log('⚠️  Nenhum produto encontrado no banco de dados');
      return;
    }
    
    // 2. Analisar cada produto
    console.log('\n2. Analisando critérios de visibilidade...');
    
    const visibleProducts = [];
    const hiddenProducts = [];
    
    allProducts.forEach((product, index) => {
      const quantitySold = product.quantity_sold || 0;
      const availableStock = product.quantity - quantitySold;
      
      // Critérios para aparecer na interface:
      // 1. Status deve ser "selling" ou "received"
      // 2. Deve ter estoque disponível (quantity > quantity_sold)
      const shouldBeVisible = (product.status === 'selling' || product.status === 'received') && 
                             availableStock > 0;
      
      const productInfo = {
        id: product.id,
        name: product.name,
        status: product.status,
        quantity: product.quantity,
        quantity_sold: quantitySold,
        available_stock: availableStock,
        user_id: product.user_id,
        should_be_visible: shouldBeVisible,
        reason: shouldBeVisible ? 'Deveria aparecer' : 
                availableStock <= 0 ? 'Sem estoque disponível' :
                !['selling', 'received'].includes(product.status) ? `Status inválido: ${product.status}` :
                'Critérios não atendidos'
      };
      
      if (shouldBeVisible) {
        visibleProducts.push(productInfo);
      } else {
        hiddenProducts.push(productInfo);
      }
      
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${quantitySold}`);
      console.log(`   Disponível: ${availableStock}`);
      console.log(`   User ID: ${product.user_id}`);
      console.log(`   Deveria aparecer: ${shouldBeVisible ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Motivo: ${productInfo.reason}`);
      console.log('');
    });
    
    // 3. Resumo
    console.log('\n📊 RESUMO DA ANÁLISE:');
    console.log(`- Total de produtos: ${allProducts.length}`);
    console.log(`- Produtos que deveriam aparecer: ${visibleProducts.length}`);
    console.log(`- Produtos ocultos: ${hiddenProducts.length}`);
    
    if (visibleProducts.length > 0) {
      console.log('\n🎉 PRODUTOS QUE DEVERIAM APARECER NA INTERFACE:');
      visibleProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Disponível: ${product.available_stock}`);
        console.log(`   User: ${product.user_id}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  NENHUM PRODUTO DEVERIA APARECER NA INTERFACE');
      console.log('Motivos:');
      hiddenProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}: ${product.reason}`);
      });
    }
    
    // 4. Buscar usuários para contexto
    console.log('\n4. Verificando usuários...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log(`👥 ${users.length} usuários encontrados:`);
      users.forEach((user, index) => {
        const userProducts = allProducts.filter(p => p.user_id === user.id);
        const visibleUserProducts = visibleProducts.filter(p => p.user_id === user.id);
        
        console.log(`${index + 1}. ${user.email || user.id}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Produtos: ${userProducts.length} total, ${visibleUserProducts.length} visíveis`);
        console.log('');
      });
    }
    
    // 5. Próximos passos
    console.log('\n💡 PRÓXIMOS PASSOS:');
    
    if (visibleProducts.length > 0) {
      console.log('1. ✅ Existem produtos que deveriam aparecer');
      console.log('2. 🔧 Adicionar coluna is_public na tabela products');
      console.log('3. 🔄 Atualizar produtos com is_public = true para os visíveis');
      console.log('4. 🧪 Testar login e verificar interface');
    } else {
      console.log('1. ❌ Nenhum produto atende aos critérios de visibilidade');
      console.log('2. 📝 Verificar se os produtos têm status correto');
      console.log('3. 📦 Verificar se os produtos têm estoque disponível');
      console.log('4. 🔄 Atualizar dados dos produtos se necessário');
    }
    
    console.log('\n🔧 PARA ADICIONAR A COLUNA is_public:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/atyeakcunmhrzzpdcvxm/sql');
    console.log('2. Execute: ALTER TABLE public.products ADD COLUMN is_public BOOLEAN DEFAULT false;');
    console.log('3. Execute novamente este script para atualizar os valores');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkProductsVisibility();