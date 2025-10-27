const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBusinessAccount() {
  console.log('🏢 Testando Conta Empresarial...\n');

  try {
    // 1. Criar usuário empresarial
    console.log('1️⃣ Criando usuário empresarial...');
    const businessUser = {
      email: 'teste.empresa@example.com',
      name: 'Empresa Silva LTDA',
      account_type: 'business',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([businessUser])
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      return;
    }

    console.log('✅ Usuário empresarial criado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      account_type: user.account_type
    });

    // 2. Testar criação de produtos
    console.log('\n2️⃣ Testando criação de produtos...');

    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert([{
        user_id: user.id,
        name: 'Produto Teste',
        category: 'Eletrônicos', // Campo obrigatório
        supplier: 'Fornecedor Teste', // Campo opcional mas útil
        description: 'Produto para teste da conta empresarial',
        purchase_price: 50.00,
        selling_price: 100.00,
        quantity: 10,
        status: 'purchased',
        purchase_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (productError) {
      console.log('❌ Erro ao criar produto:', productError);
    } else {
      console.log('✅ Produto criado:', newProduct.name, 'R$', newProduct.selling_price);
    }

    // 3. Testar criação de venda
    console.log('\n3️⃣ Testando criação de venda...');

    if (newProduct) {
      const { data: newSale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user.id,
          product_id: newProduct.id,
          quantity: 2,
          unit_price: newProduct.selling_price,
          buyer_name: 'Cliente Teste',
          date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (saleError) {
        console.log('❌ Erro ao criar venda:', saleError);
      } else {
        console.log('✅ Venda criada:', newSale.quantity, 'unidades por R$', newSale.total_amount);
      }
    }

    // 4. Testar criação de receita empresarial
    console.log('\n4️⃣ Testando criação de receita empresarial...');

    const { data: newRevenue, error: revenueError } = await supabase
      .from('revenues')
      .insert([{
        user_id: user.id,
        description: 'Venda de Serviços',
        amount: 1500.00,
        category: 'Vendas', // Campo obrigatório
        date: new Date().toISOString(),
        source: 'sale',
        notes: 'Receita de teste empresarial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (revenueError) {
      console.log('❌ Erro ao criar receita:', revenueError);
    } else {
      console.log('✅ Receita empresarial criada:', newRevenue.description, 'R$', newRevenue.amount);
    }

    // 5. Testar criação de despesa empresarial
    console.log('\n5️⃣ Testando criação de despesa empresarial...');

    const { data: newExpense, error: expenseError } = await supabase
      .from('expenses')
      .insert([{
        user_id: user.id,
        description: 'Material de Escritório',
        amount: 200.00,
        category: 'Operacional', // Campo obrigatório
        date: new Date().toISOString(),
        type: 'operational',
        supplier: 'Papelaria Silva',
        notes: 'Despesa de teste empresarial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (expenseError) {
      console.log('❌ Erro ao criar despesa:', expenseError);
    } else {
      console.log('✅ Despesa empresarial criada:', newExpense.description, 'R$', newExpense.amount);
    }

    // 6. Testar criação de meta empresarial
    console.log('\n6️⃣ Testando criação de meta empresarial...');

    const { data: newGoal, error: goalError } = await supabase
      .from('goals')
      .insert([{
        user_id: user.id,
        name: 'Meta de Faturamento',
        description: 'Atingir R$ 50.000 em vendas',
        target_value: 50000.00,
        current_value: 0.00,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'business',
        type: 'revenue',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (goalError) {
      console.log('❌ Erro ao criar meta:', goalError);
    } else {
      console.log('✅ Meta empresarial criada:', newGoal.name, 'R$', newGoal.target_value);
    }

    // 7. Verificar totais empresariais
    console.log('\n7️⃣ Resumo da conta empresarial:');
    
    const { data: totalProducts } = await supabase
      .from('products')
      .select('selling_price, quantity')
      .eq('user_id', user.id);

    const { data: totalSales } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('user_id', user.id);

    const { data: totalRevenues } = await supabase
      .from('revenues')
      .select('amount')
      .eq('user_id', user.id);

    const { data: totalExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id);

    const { data: totalGoals } = await supabase
      .from('goals')
      .select('target_value')
      .eq('user_id', user.id);

    const productValue = totalProducts?.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0) || 0;
    const salesSum = totalSales?.reduce((sum, item) => sum + item.total_amount, 0) || 0;
    const revenueSum = totalRevenues?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const expenseSum = totalExpenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const goalSum = totalGoals?.reduce((sum, item) => sum + item.target_value, 0) || 0;

    console.log(`📦 Valor total em produtos: R$ ${productValue.toFixed(2)}`);
    console.log(`💰 Total de vendas: R$ ${salesSum.toFixed(2)}`);
    console.log(`📈 Total de receitas: R$ ${revenueSum.toFixed(2)}`);
    console.log(`📉 Total de despesas: R$ ${expenseSum.toFixed(2)}`);
    console.log(`💼 Lucro bruto: R$ ${(salesSum + revenueSum - expenseSum).toFixed(2)}`);
    console.log(`🎯 Total em metas: R$ ${goalSum.toFixed(2)}`);

    console.log('\n✅ Teste da conta empresarial concluído com sucesso!');
    return user;

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testBusinessAccount();