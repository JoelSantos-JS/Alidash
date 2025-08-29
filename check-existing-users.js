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

async function checkExistingUsers() {
  console.log('🔍 Verificando usuários existentes no Supabase...\n');

  try {
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name, created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${users?.length || 0} usuários encontrados no Supabase\n`);

    if (users && users.length > 0) {
      console.log('📋 Lista de usuários:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email || 'Sem nome'}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Firebase UID: ${user.firebase_uid || 'Não definido'}`);
        console.log(`   - Email: ${user.email || 'Não definido'}`);
        console.log(`   - Criado em: ${user.created_at}`);
        console.log('');
      });

      // Verificar produtos de cada usuário
      console.log('📦 Verificando produtos por usuário:');
      for (const user of users) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, category')
          .eq('user_id', user.id);

        if (productsError) {
          console.log(`   ❌ Erro ao buscar produtos de ${user.name}: ${productsError.message}`);
        } else {
          console.log(`   👤 ${user.name || user.email}: ${products?.length || 0} produtos`);
          if (products && products.length > 0) {
            products.forEach(product => {
              console.log(`      - ${product.name} (${product.category})`);
            });
          }
        }
      }
    } else {
      console.log('ℹ️ Nenhum usuário encontrado no Supabase');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar verificação
checkExistingUsers().then(() => {
  console.log('\n🏁 Verificação finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 