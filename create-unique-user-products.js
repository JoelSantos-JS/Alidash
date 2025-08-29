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

// Banco de dados de produtos únicos
const uniqueProductsDatabase = [
  // Eletrônicos
  {
    name: 'Smartphone Samsung Galaxy',
    category: 'Eletrônicos',
    supplier: 'Fornecedor Coreia',
    description: 'Smartphone Android de última geração',
    purchase_price: 1200,
    shipping_cost: 80,
    import_taxes: 300,
    packaging_cost: 30,
    marketing_cost: 150,
    other_costs: 40,
    selling_price: 2200,
    quantity: 3,
    status: 'selling'
  },
  {
    name: 'iPhone 15 Pro',
    category: 'Eletrônicos',
    supplier: 'Fornecedor China',
    description: 'Smartphone Apple de alta performance',
    purchase_price: 3500,
    shipping_cost: 120,
    import_taxes: 875,
    packaging_cost: 50,
    marketing_cost: 200,
    other_costs: 75,
    selling_price: 5500,
    quantity: 2,
    status: 'selling'
  },
  {
    name: 'Notebook Dell Inspiron',
    category: 'Eletrônicos',
    supplier: 'Fornecedor Taiwan',
    description: 'Notebook para trabalho e estudos',
    purchase_price: 2500,
    shipping_cost: 150,
    import_taxes: 625,
    packaging_cost: 60,
    marketing_cost: 180,
    other_costs: 90,
    selling_price: 4000,
    quantity: 1,
    status: 'selling'
  },
  // Acessórios
  {
    name: 'Fone de Ouvido Sony WH-1000XM4',
    category: 'Acessórios',
    supplier: 'Fornecedor Japão',
    description: 'Fone de ouvido com cancelamento de ruído',
    purchase_price: 800,
    shipping_cost: 40,
    import_taxes: 200,
    packaging_cost: 20,
    marketing_cost: 80,
    other_costs: 30,
    selling_price: 1500,
    quantity: 5,
    status: 'selling'
  },
  {
    name: 'Mouse Gamer Logitech',
    category: 'Acessórios',
    supplier: 'Fornecedor Suíça',
    description: 'Mouse para jogos com RGB',
    purchase_price: 200,
    shipping_cost: 25,
    import_taxes: 50,
    packaging_cost: 15,
    marketing_cost: 40,
    other_costs: 20,
    selling_price: 400,
    quantity: 8,
    status: 'selling'
  },
  {
    name: 'Teclado Mecânico Corsair',
    category: 'Acessórios',
    supplier: 'Fornecedor EUA',
    description: 'Teclado mecânico para gamers',
    purchase_price: 400,
    shipping_cost: 35,
    import_taxes: 100,
    packaging_cost: 25,
    marketing_cost: 60,
    other_costs: 25,
    selling_price: 750,
    quantity: 4,
    status: 'selling'
  },
  // Wearables
  {
    name: 'Apple Watch Series 9',
    category: 'Wearables',
    supplier: 'Fornecedor Apple',
    description: 'Relógio inteligente da Apple',
    purchase_price: 1800,
    shipping_cost: 60,
    import_taxes: 450,
    packaging_cost: 40,
    marketing_cost: 120,
    other_costs: 50,
    selling_price: 3000,
    quantity: 2,
    status: 'selling'
  },
  {
    name: 'Fitbit Charge 6',
    category: 'Wearables',
    supplier: 'Fornecedor Fitbit',
    description: 'Pulseira fitness com monitor cardíaco',
    purchase_price: 300,
    shipping_cost: 20,
    import_taxes: 75,
    packaging_cost: 15,
    marketing_cost: 45,
    other_costs: 20,
    selling_price: 550,
    quantity: 6,
    status: 'selling'
  },
  {
    name: 'Garmin Fenix 7',
    category: 'Wearables',
    supplier: 'Fornecedor Garmin',
    description: 'Relógio esportivo profissional',
    purchase_price: 2500,
    shipping_cost: 80,
    import_taxes: 625,
    packaging_cost: 50,
    marketing_cost: 150,
    other_costs: 70,
    selling_price: 4200,
    quantity: 1,
    status: 'selling'
  },
  // Casa
  {
    name: 'Aspirador Robô Xiaomi',
    category: 'Casa',
    supplier: 'Fornecedor Xiaomi',
    description: 'Aspirador robô inteligente',
    purchase_price: 600,
    shipping_cost: 45,
    import_taxes: 150,
    packaging_cost: 25,
    marketing_cost: 70,
    other_costs: 30,
    selling_price: 1100,
    quantity: 3,
    status: 'selling'
  },
  {
    name: 'Smart TV LG 55"',
    category: 'Casa',
    supplier: 'Fornecedor LG',
    description: 'Smart TV 4K com webOS',
    purchase_price: 2000,
    shipping_cost: 100,
    import_taxes: 500,
    packaging_cost: 60,
    marketing_cost: 120,
    other_costs: 80,
    selling_price: 3500,
    quantity: 2,
    status: 'selling'
  },
  {
    name: 'Cafeteira Nespresso',
    category: 'Casa',
    supplier: 'Fornecedor Nestlé',
    description: 'Máquina de café automática',
    purchase_price: 400,
    shipping_cost: 30,
    import_taxes: 100,
    packaging_cost: 20,
    marketing_cost: 50,
    other_costs: 25,
    selling_price: 750,
    quantity: 4,
    status: 'selling'
  }
];

async function createUniqueUserProducts() {
  console.log('🚀 Criando produtos únicos para cada usuário...\n');

  try {
    // 1. Limpar produtos existentes (opcional - comentar se não quiser limpar)
    console.log('🧹 Limpando produtos existentes...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteError) {
      console.log('⚠️ Erro ao limpar produtos:', deleteError.message);
    } else {
      console.log('✅ Produtos existentes removidos');
    }

    // 2. Buscar usuários
    console.log('\n📋 Buscando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${users?.length || 0} usuários encontrados`);

    if (!users || users.length === 0) {
      console.log('ℹ️ Nenhum usuário encontrado. Criando usuário de teste...');
      
      const { data: testUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          firebase_uid: 'test-unique-user',
          email: 'test-unique@example.com',
          name: 'Usuário Teste Único',
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

    // 3. Para cada usuário, criar produtos únicos
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n👤 Processando usuário ${i + 1}/${users.length}: ${user.name || user.email || user.firebase_uid}`);
      
      // Selecionar produtos únicos para este usuário
      const startIndex = i * 3; // 3 produtos por usuário
      const userProducts = uniqueProductsDatabase.slice(startIndex, startIndex + 3);
      
      if (userProducts.length === 0) {
        console.log('⚠️ Não há produtos suficientes no banco de dados');
        break;
      }

      // Preparar produtos com dados calculados
      const productsToInsert = userProducts.map(product => {
        const totalCost = product.purchase_price + product.shipping_cost + product.import_taxes + 
                         product.packaging_cost + product.marketing_cost + product.other_costs;
        const expectedProfit = product.selling_price - totalCost;
        const profitMargin = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;
        const roi = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;

        return {
          user_id: user.id,
          name: product.name,
          category: product.category,
          supplier: product.supplier,
          aliexpress_link: `https://example.com/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
          image_url: '',
          description: product.description,
          notes: `Produto único para ${user.name || user.email}`,
          tracking_code: `TRK-${user.id.slice(0, 8)}-${Date.now()}`,
          purchase_email: `${user.email || 'user@example.com'}`,
          purchase_price: product.purchase_price,
          shipping_cost: product.shipping_cost,
          import_taxes: product.import_taxes,
          packaging_cost: product.packaging_cost,
          marketing_cost: product.marketing_cost,
          other_costs: product.other_costs,
          selling_price: product.selling_price,
          expected_profit: expectedProfit,
          profit_margin: profitMargin,
          quantity: product.quantity,
          quantity_sold: Math.floor(Math.random() * product.quantity), // Vendas aleatórias
          status: product.status,
          purchase_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Data aleatória nos últimos 30 dias
          roi: roi,
          actual_profit: Math.floor(Math.random() * expectedProfit), // Lucro real aleatório
          days_to_sell: Math.floor(Math.random() * 30) + 1 // Dias para vender aleatório
        };
      });

      // Inserir produtos
      const { data: createdProducts, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (insertError) {
        console.log(`❌ Erro ao criar produtos para ${user.name}:`, insertError.message);
      } else {
        console.log(`✅ ${createdProducts?.length || 0} produtos únicos criados para ${user.name}:`);
        createdProducts?.forEach(product => {
          console.log(`   - ${product.name} (${product.category}) - R$ ${product.purchase_price} → R$ ${product.selling_price}`);
        });
        totalProductsCreated += createdProducts?.length || 0;
      }

      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da criação:');
    console.log(`   - Usuários processados: ${users.length}`);
    console.log(`   - Produtos únicos criados: ${totalProductsCreated}`);
    console.log('✅ Criação de produtos únicos concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a criação:', error);
  }
}

// Executar criação
createUniqueUserProducts().then(() => {
  console.log('\n🏁 Criação finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 