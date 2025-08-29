// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateUserProducts() {
  console.log('🔍 Validando produtos por usuário...\n');

  try {
    // 1. Buscar todos os usuários
    console.log('📋 Buscando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${users?.length || 0} usuários encontrados\n`);

    // 2. Para cada usuário, verificar seus produtos
    for (const user of users) {
      console.log(`👤 Usuário: ${user.name || user.email || user.firebase_uid}`);
      console.log(`   ID: ${user.id}`);
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, purchase_price, selling_price, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (productsError) {
        console.log(`   ❌ Erro ao buscar produtos: ${productsError.message}`);
        continue;
      }

      console.log(`   📦 ${products?.length || 0} produtos encontrados:`);
      
      if (products && products.length > 0) {
        products.forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.name} (${product.category})`);
          console.log(`         - Compra: R$ ${product.purchase_price} | Venda: R$ ${product.selling_price}`);
          console.log(`         - Status: ${product.status} | ID: ${product.id}`);
        });
      } else {
        console.log(`      ℹ️ Nenhum produto encontrado`);
      }
      
      console.log('');
    }

    // 3. Verificar se há produtos duplicados entre usuários
    console.log('🔍 Verificando duplicações entre usuários...');
    
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, user_id, created_at')
      .order('name', { ascending: true });

    if (allProductsError) {
      console.log('❌ Erro ao buscar todos os produtos:', allProductsError.message);
      return;
    }

    // Agrupar produtos por nome
    const productsByName = {};
    allProducts.forEach(product => {
      if (!productsByName[product.name]) {
        productsByName[product.name] = [];
      }
      productsByName[product.name].push(product);
    });

    // Verificar duplicações
    let duplicationsFound = false;
    Object.entries(productsByName).forEach(([name, products]) => {
      if (products.length > 1) {
        console.log(`⚠️ PRODUTO DUPLICADO: "${name}"`);
        console.log(`   Encontrado em ${products.length} usuários:`);
        products.forEach(product => {
          console.log(`   - Usuário ID: ${product.user_id} (Criado em: ${product.created_at})`);
        });
        duplicationsFound = true;
      }
    });

    if (!duplicationsFound) {
      console.log('✅ Nenhuma duplicação encontrada - cada usuário tem seus próprios produtos!');
    }

    // 4. Estatísticas gerais
    console.log('\n📊 Estatísticas:');
    console.log(`   - Total de usuários: ${users?.length || 0}`);
    console.log(`   - Total de produtos: ${allProducts?.length || 0}`);
    
    const usersWithProducts = users.filter(user => {
      const userProducts = allProducts.filter(p => p.user_id === user.id);
      return userProducts.length > 0;
    });
    
    console.log(`   - Usuários com produtos: ${usersWithProducts.length}`);
    console.log(`   - Usuários sem produtos: ${(users?.length || 0) - usersWithProducts.length}`);

    // 5. Verificar se há produtos órfãos (sem usuário)
    console.log('\n🔍 Verificando produtos órfãos...');
    const orphanProducts = allProducts.filter(product => {
      return !users.find(user => user.id === product.user_id);
    });

    if (orphanProducts.length > 0) {
      console.log(`⚠️ ${orphanProducts.length} produtos órfãos encontrados:`);
      orphanProducts.forEach(product => {
        console.log(`   - ${product.name} (User ID: ${product.user_id})`);
      });
    } else {
      console.log('✅ Nenhum produto órfão encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
  }
}

// Executar validação
validateUserProducts().then(() => {
  console.log('\n🏁 Validação finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 