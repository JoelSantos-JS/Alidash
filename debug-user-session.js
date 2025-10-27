const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando usuários e produtos...');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserSession() {
  try {
    // 1. Listar todos os usuários
    console.log('\n👥 Usuários no banco:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.email} (ID: ${user.id})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // 2. Listar todos os produtos com seus usuários
    console.log('\n📦 Produtos no banco:');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        category, 
        price, 
        user_id,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }

    console.log(`Total de produtos: ${products.length}`);
    products.forEach((product, index) => {
      const user = users.find(u => u.id === product.user_id);
      console.log(`${index + 1}. ${product.name} (${product.category})`);
      console.log(`   Preço: R$ ${product.price}`);
      console.log(`   Usuário: ${user ? user.name || user.email : 'Usuário não encontrado'} (${product.user_id})`);
      console.log(`   Criado em: ${new Date(product.created_at).toLocaleString()}`);
      console.log('');
    });

    // 3. Verificar produtos por usuário
    console.log('\n📊 Produtos por usuário:');
    for (const user of users) {
      const userProducts = products.filter(p => p.user_id === user.id);
      console.log(`${user.name || user.email}: ${userProducts.length} produtos`);
      if (userProducts.length > 0) {
        userProducts.forEach(p => {
          console.log(`  - ${p.name} (${p.category})`);
        });
      }
      console.log('');
    }

    // 4. Verificar se há produtos órfãos (sem usuário válido)
    const orphanProducts = products.filter(p => !users.find(u => u.id === p.user_id));
    if (orphanProducts.length > 0) {
      console.log('\n⚠️ Produtos órfãos (sem usuário válido):');
      orphanProducts.forEach(p => {
        console.log(`- ${p.name} (User ID: ${p.user_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugUserSession();