const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  try {
    console.log('🔍 Verificando produtos no banco...');
    
    // Verificar total de produtos
    const { data: products, error, count } = await supabase
      .from('products')
      .select('id, name, category, user_id, status', { count: 'exact' })
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return;
    }
    
    console.log('📦 Total de produtos encontrados:', count || products?.length || 0);
    
    if (products && products.length > 0) {
      console.log('📋 Primeiros produtos:');
      products.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name} (${p.category}) - Status: ${p.status} - User: ${p.user_id}`);
      });
    } else {
      console.log('📭 Nenhum produto encontrado no banco de dados');
    }

    // Verificar usuários
    console.log('\n👥 Verificando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, firebase_uid')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log('👤 Usuários encontrados:', users?.length || 0);
      users?.forEach((u, index) => {
        console.log(`  ${index + 1}. ${u.name || u.email} - ID: ${u.id} - Firebase: ${u.firebase_uid}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkProducts();