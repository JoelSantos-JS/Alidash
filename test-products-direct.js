const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testando conexão direta com Supabase...');
console.log('URL:', supabaseUrl ? 'Configurada' : 'Não configurada');
console.log('Service Key:', supabaseKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProducts() {
  try {
    console.log('\n📦 Buscando produtos...');
    
    // Buscar todos os produtos
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }

    console.log(`✅ Encontrados ${products.length} produtos:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.category}) - User: ${product.user_id}`);
    });

    // Buscar usuários
    console.log('\n👥 Buscando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.email} (ID: ${user.id})`);
    });

    // Testar produtos por usuário específico
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔍 Buscando produtos do usuário: ${firstUser.name || firstUser.email}`);
      
      const { data: userProducts, error: userProductsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', firstUser.id);

      if (userProductsError) {
        console.error('❌ Erro ao buscar produtos do usuário:', userProductsError);
        return;
      }

      console.log(`✅ Usuário tem ${userProducts.length} produtos:`);
      userProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.category} - R$ ${product.price}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testProducts();