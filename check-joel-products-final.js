const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIzNDEsImV4cCI6MjA3MTQ0ODM0MX0.qFHcONpGQVAwWfMhCdh2kX5ZNBk5qtNM1M7_GS-LXZ4';

async function checkJoelProductsFinal() {
  console.log('🔍 Verificação final dos produtos do Joel...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Buscar todos os usuários
    console.log('\n1. Buscando todos os usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`✅ ${users.length} usuário(s) encontrado(s)`);
    
    // Encontrar Joel
    const joelUsers = users.filter(user => 
      user.email && user.email.toLowerCase().includes('joeltere8@gmail.com')
    );
    
    console.log('\n📧 Usuários com email do Joel:');
    joelUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name || 'N/A'}`);
      console.log(`   Firebase UID: ${user.firebase_uid || 'N/A'}`);
      console.log('');
    });
    
    // 2. Buscar todos os produtos
    console.log('2. Buscando todos os produtos...');
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
      return;
    }
    
    console.log(`✅ ${allProducts.length} produto(s) total encontrado(s)`);
    
    // 3. Verificar produtos por user_id
    const joelUserIds = [
      'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b', // ID original
      '550e8400-e29b-41d4-a716-446655440000', // ID alternativo encontrado antes
    ];
    
    // Adicionar IDs dos usuários encontrados
    joelUsers.forEach(user => {
      if (!joelUserIds.includes(user.id)) {
        joelUserIds.push(user.id);
      }
    });
    
    console.log('\n3. Verificando produtos para cada user_id do Joel:');
    for (const userId of joelUserIds) {
      console.log(`\n🔍 User ID: ${userId}`);
      
      const userProducts = allProducts.filter(p => p.user_id === userId);
      console.log(`   Produtos encontrados: ${userProducts.length}`);
      
      if (userProducts.length > 0) {
        userProducts.forEach((product, index) => {
          const quantitySold = product.quantity_sold || 0;
          const availableStock = product.quantity - quantitySold;
          const shouldAppear = availableStock > 0 && 
                             (product.status === 'selling' || product.status === 'received') &&
                             product.is_public === true;
          
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      ID: ${product.id}`);
          console.log(`      Status: ${product.status}`);
          console.log(`      Quantidade: ${product.quantity}`);
          console.log(`      Vendidos: ${quantitySold}`);
          console.log(`      Disponível: ${availableStock}`);
          console.log(`      Público: ${product.is_public}`);
          console.log(`      Deveria aparecer: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
          console.log('');
        });
      }
    }
    
    // 4. Buscar produtos que contenham "Joel" ou "Teste" no nome
    console.log('\n4. Buscando produtos com "Joel" ou "Teste" no nome...');
    const testProducts = allProducts.filter(p => 
      p.name && (
        p.name.toLowerCase().includes('joel') || 
        p.name.toLowerCase().includes('teste')
      )
    );
    
    console.log(`✅ ${testProducts.length} produto(s) de teste encontrado(s)`);
    
    if (testProducts.length > 0) {
      testProducts.forEach((product, index) => {
        const quantitySold = product.quantity_sold || 0;
        const availableStock = product.quantity - quantitySold;
        const shouldAppear = availableStock > 0 && 
                           (product.status === 'selling' || product.status === 'received') &&
                           product.is_public === true;
        
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   User ID: ${product.user_id}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Quantidade: ${product.quantity}`);
        console.log(`   Vendidos: ${quantitySold}`);
        console.log(`   Disponível: ${availableStock}`);
        console.log(`   Público: ${product.is_public}`);
        console.log(`   Deveria aparecer: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
        console.log('');
      });
    }
    
    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`- Total de usuários: ${users.length}`);
    console.log(`- Usuários do Joel encontrados: ${joelUsers.length}`);
    console.log(`- Total de produtos: ${allProducts.length}`);
    console.log(`- Produtos de teste: ${testProducts.length}`);
    
    const productsReadyToShow = allProducts.filter(p => {
      const quantitySold = p.quantity_sold || 0;
      const availableStock = p.quantity - quantitySold;
      return availableStock > 0 && 
             (p.status === 'selling' || p.status === 'received') &&
             p.is_public === true;
    });
    
    console.log(`- Produtos prontos para aparecer na interface: ${productsReadyToShow.length}`);
    
    if (productsReadyToShow.length > 0) {
      console.log('\n🎉 PRODUTOS PRONTOS PARA APARECER:');
      productsReadyToShow.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (User: ${product.user_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkJoelProductsFinal();