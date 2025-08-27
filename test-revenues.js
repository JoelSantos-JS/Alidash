const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRevenues() {
  try {
    console.log('🔧 Configuração Supabase:', {
      url: supabaseUrl ? 'Definida' : 'Não definida',
      serviceKey: supabaseServiceKey ? 'Definida' : 'Não definida'
    });

    // 1. Listar usuários
    console.log('\n👥 Listando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ ${users.length} usuários encontrados:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Firebase: ${user.firebase_uid})`);
    });

    // 2. Buscar receitas para o primeiro usuário
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`\n💰 Buscando receitas para usuário: ${userId}`);
      
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('*')
        .eq('user_id', userId);

      if (revenuesError) {
        console.error('❌ Erro ao buscar receitas:', revenuesError);
        return;
      }

      console.log(`✅ ${revenues.length} receitas encontradas:`);
      revenues.forEach(revenue => {
        console.log(`  - ${revenue.description} (R$ ${revenue.amount}) - ${revenue.date}`);
        console.log(`    ID: ${revenue.id}, Category: ${revenue.category}, Source: ${revenue.source}`);
      });

      // 3. Testar a conversão de dados
      console.log('\n🔄 Testando conversão de dados...');
      const convertedRevenues = revenues.map(revenue => ({
        id: revenue.id,
        date: new Date(revenue.date),
        description: revenue.description,
        amount: revenue.amount,
        category: revenue.category,
        source: revenue.source,
        notes: revenue.notes,
        productId: revenue.product_id
      }));

      console.log('✅ Dados convertidos:', convertedRevenues.length);
      convertedRevenues.forEach(revenue => {
        console.log(`  - ${revenue.description} (R$ ${revenue.amount}) - ${revenue.date.toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRevenues(); 