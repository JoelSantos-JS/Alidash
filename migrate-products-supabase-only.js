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

async function migrateProductsSupabaseOnly() {
  console.log('🚀 Iniciando migração de produtos (apenas Supabase)...\n');

  try {
    // 1. Verificar usuários existentes no Supabase
    console.log('📋 Verificando usuários no Supabase...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name');

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${users?.length || 0} usuários encontrados no Supabase`);

    if (!users || users.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado. Criando usuário de teste...');
      
      const { data: testUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          firebase_uid: 'test-migration-user',
          email: 'test-migration@example.com',
          name: 'Usuário Teste Migração',
          account_type: 'personal'
        })
        .select()
        .single();

      if (createUserError) {
        console.log('❌ Erro ao criar usuário de teste:', createUserError.message);
        return;
      }
      
      users.push(testUser);
      console.log('✅ Usuário de teste criado');
    }

    let totalProductsCreated = 0;

    // 2. Para cada usuário, criar alguns produtos de exemplo
    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.name || user.email} (${user.id})`);
      
      // Verificar se já tem produtos
      const { data: existingProducts, error: existingError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id);

      if (existingError) {
        console.log('⚠️ Erro ao verificar produtos existentes:', existingError.message);
        continue;
      }

      if (existingProducts && existingProducts.length > 0) {
        console.log(`ℹ️ Usuário já tem ${existingProducts.length} produtos. Pulando...`);
        continue;
      }

      // Criar produtos de exemplo
      const sampleProducts = [
        {
          name: 'Smartphone Android',
          category: 'Eletrônicos',
          supplier: 'Fornecedor China',
          aliexpress_link: 'https://example.com/phone1',
          image_url: '',
          description: 'Smartphone Android de última geração',
          purchase_price: 800,
          shipping_cost: 50,
          import_taxes: 200,
          packaging_cost: 20,
          marketing_cost: 100,
          other_costs: 30,
          selling_price: 1500,
          expected_profit: 300,
          profit_margin: 20,
          quantity: 5,
          quantity_sold: 2,
          status: 'selling',
          purchase_date: new Date('2024-01-15').toISOString(),
          roi: 37.5,
          actual_profit: 600
        },
        {
          name: 'Fone de Ouvido Bluetooth',
          category: 'Acessórios',
          supplier: 'Fornecedor Coreia',
          aliexpress_link: 'https://example.com/headphone1',
          image_url: '',
          description: 'Fone de ouvido sem fio com cancelamento de ruído',
          purchase_price: 120,
          shipping_cost: 15,
          import_taxes: 30,
          packaging_cost: 10,
          marketing_cost: 25,
          other_costs: 10,
          selling_price: 250,
          expected_profit: 40,
          profit_margin: 16,
          quantity: 10,
          quantity_sold: 7,
          status: 'selling',
          purchase_date: new Date('2024-02-01').toISOString(),
          roi: 33.33,
          actual_profit: 280
        },
        {
          name: 'Relógio Smart',
          category: 'Wearables',
          supplier: 'Fornecedor Taiwan',
          aliexpress_link: 'https://example.com/watch1',
          image_url: '',
          description: 'Relógio inteligente com monitor cardíaco',
          purchase_price: 300,
          shipping_cost: 25,
          import_taxes: 75,
          packaging_cost: 15,
          marketing_cost: 50,
          other_costs: 20,
          selling_price: 600,
          expected_profit: 115,
          profit_margin: 19.17,
          quantity: 3,
          quantity_sold: 1,
          status: 'selling',
          purchase_date: new Date('2024-01-20').toISOString(),
          roi: 38.33,
          actual_profit: 115
        }
      ];

      // Adicionar user_id a cada produto
      const productsWithUserId = sampleProducts.map(product => ({
        ...product,
        user_id: user.id
      }));

      // Inserir produtos
      const { data: createdProducts, error: insertError } = await supabase
        .from('products')
        .insert(productsWithUserId)
        .select();

      if (insertError) {
        console.log(`❌ Erro ao criar produtos para ${user.name}:`, insertError.message);
      } else {
        console.log(`✅ ${createdProducts?.length || 0} produtos criados para ${user.name}`);
        totalProductsCreated += createdProducts?.length || 0;
      }

      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   - Usuários processados: ${users.length}`);
    console.log(`   - Produtos criados: ${totalProductsCreated}`);
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar migração
migrateProductsSupabaseOnly().then(() => {
  console.log('\n🏁 Migração finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 