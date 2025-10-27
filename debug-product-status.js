const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqhqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI0NzQsImV4cCI6MjA1MDU0ODQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductStatus() {
  console.log('🔍 Debugando status dos produtos...\n');
  
  try {
    // 1. Buscar todos os produtos
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar produtos:', allError);
      return;
    }

    console.log(`📦 Total de produtos no banco: ${allProducts.length}\n`);

    // 2. Analisar cada produto
    allProducts.forEach((product, index) => {
      const availableStock = product.quantity - product.quantity_sold;
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantidade: ${product.quantity}`);
      console.log(`   Vendidos: ${product.quantity_sold}`);
      console.log(`   Disponível: ${availableStock}`);
      console.log(`   Público: ${product.is_public ? 'Sim' : 'Não'}`);
      console.log(`   Usuário: ${product.user_id}`);
      console.log(`   Criado em: ${new Date(product.created_at).toLocaleString('pt-BR')}`);
      
      // Verificar se seria exibido no catálogo
      const wouldShowInCatalog = (product.status === 'received' || product.status === 'selling') && 
                                product.quantity > 0 && 
                                product.is_public;
      console.log(`   Apareceria no catálogo: ${wouldShowInCatalog ? 'SIM' : 'NÃO'}`);
      
      // Verificar se seria exibido na lista de produtos do usuário
      const wouldShowInUserList = availableStock > 0 && 
                                 (product.status === 'selling' || product.status === 'received');
      console.log(`   Apareceria na lista do usuário: ${wouldShowInUserList ? 'SIM' : 'NÃO'}`);
      console.log('');
    });

    // 3. Estatísticas por status
    console.log('\n📊 Estatísticas por status:');
    const statusStats = {};
    allProducts.forEach(product => {
      statusStats[product.status] = (statusStats[product.status] || 0) + 1;
    });

    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} produtos`);
    });

    // 4. Produtos que deveriam aparecer para Joel
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    const joelProducts = allProducts.filter(p => p.user_id === joelUserId);
    
    console.log(`\n👤 Produtos do Joel (${joelUserId}): ${joelProducts.length}`);
    joelProducts.forEach(product => {
      const availableStock = product.quantity - product.quantity_sold;
      const shouldShow = availableStock > 0;
      console.log(`   - ${product.name} (${product.status}) - Estoque: ${availableStock} - Deveria aparecer: ${shouldShow ? 'SIM' : 'NÃO'}`);
    });

    // 5. Verificar produtos que deveriam aparecer na interface
    console.log('\n🖥️ Produtos que deveriam aparecer na interface do usuário:');
    const visibleProducts = allProducts.filter(product => {
      const availableStock = product.quantity - product.quantity_sold;
      return availableStock > 0;
    });

    console.log(`Total de produtos visíveis: ${visibleProducts.length}`);
    visibleProducts.forEach(product => {
      console.log(`   - ${product.name} (${product.status}) - Usuário: ${product.user_id}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugProductStatus();