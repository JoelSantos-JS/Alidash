const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDataSeparation() {
  console.log('🔒 Testando Separação de Dados entre Contas Pessoais e Empresariais...\n');

  try {
    // 1. Buscar usuários de teste
    console.log('1️⃣ Buscando usuários de teste...');
    
    const { data: personalUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teste.pessoal@example.com')
      .single();

    const { data: businessUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teste.empresa@example.com')
      .single();

    if (!personalUser || !businessUser) {
      console.log('❌ Usuários de teste não encontrados. Execute os testes anteriores primeiro.');
      return;
    }

    console.log('✅ Usuários encontrados:');
    console.log(`   👤 Pessoal: ${personalUser.name} (${personalUser.account_type})`);
    console.log(`   🏢 Empresarial: ${businessUser.name} (${businessUser.account_type})`);

    // 2. Verificar separação de receitas pessoais
    console.log('\n2️⃣ Verificando separação de receitas pessoais...');
    
    const { data: personalIncomes } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessIncomes } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Receitas pessoais do usuário pessoal: ${personalIncomes?.length || 0}`);
    console.log(`✅ Receitas pessoais do usuário empresarial: ${businessIncomes?.length || 0}`);

    // 3. Verificar separação de produtos (só empresarial)
    console.log('\n3️⃣ Verificando separação de produtos...');
    
    const { data: personalProducts } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessProducts } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Produtos do usuário pessoal: ${personalProducts?.length || 0}`);
    console.log(`✅ Produtos do usuário empresarial: ${businessProducts?.length || 0}`);

    // 4. Verificar separação de vendas
    console.log('\n4️⃣ Verificando separação de vendas...');
    
    const { data: personalSales } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessSales } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Vendas do usuário pessoal: ${personalSales?.length || 0}`);
    console.log(`✅ Vendas do usuário empresarial: ${businessSales?.length || 0}`);

    // 5. Verificar separação de receitas empresariais
    console.log('\n5️⃣ Verificando separação de receitas empresariais...');
    
    const { data: personalRevenues } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessRevenues } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Receitas empresariais do usuário pessoal: ${personalRevenues?.length || 0}`);
    console.log(`✅ Receitas empresariais do usuário empresarial: ${businessRevenues?.length || 0}`);

    // 6. Verificar separação de despesas empresariais
    console.log('\n6️⃣ Verificando separação de despesas empresariais...');
    
    const { data: personalExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Despesas empresariais do usuário pessoal: ${personalExpenses?.length || 0}`);
    console.log(`✅ Despesas empresariais do usuário empresarial: ${businessExpenses?.length || 0}`);

    // 7. Verificar separação de metas
    console.log('\n7️⃣ Verificando separação de metas...');
    
    const { data: personalGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', personalUser.id);

    const { data: businessGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', businessUser.id);

    console.log(`✅ Metas do usuário pessoal: ${personalGoals?.length || 0}`);
    console.log(`✅ Metas do usuário empresarial: ${businessGoals?.length || 0}`);

    // 8. Resumo da separação
    console.log('\n8️⃣ Resumo da Separação de Dados:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    SEPARAÇÃO DE DADOS                       │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ Tabela              │ Pessoal │ Empresarial │ Separado?     │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│ personal_incomes    │    ${(personalIncomes?.length || 0).toString().padStart(2)}   │      ${(businessIncomes?.length || 0).toString().padStart(2)}    │     ${personalIncomes?.length !== businessIncomes?.length ? '✅' : '❓'}      │`);
    console.log(`│ products            │    ${(personalProducts?.length || 0).toString().padStart(2)}   │      ${(businessProducts?.length || 0).toString().padStart(2)}    │     ${personalProducts?.length !== businessProducts?.length ? '✅' : '❓'}      │`);
    console.log(`│ sales               │    ${(personalSales?.length || 0).toString().padStart(2)}   │      ${(businessSales?.length || 0).toString().padStart(2)}    │     ${personalSales?.length !== businessSales?.length ? '✅' : '❓'}      │`);
    console.log(`│ revenues            │    ${(personalRevenues?.length || 0).toString().padStart(2)}   │      ${(businessRevenues?.length || 0).toString().padStart(2)}    │     ${personalRevenues?.length !== businessRevenues?.length ? '✅' : '❓'}      │`);
    console.log(`│ expenses            │    ${(personalExpenses?.length || 0).toString().padStart(2)}   │      ${(businessExpenses?.length || 0).toString().padStart(2)}    │     ${personalExpenses?.length !== businessExpenses?.length ? '✅' : '❓'}      │`);
    console.log(`│ goals               │    ${(personalGoals?.length || 0).toString().padStart(2)}   │      ${(businessGoals?.length || 0).toString().padStart(2)}    │     ${personalGoals?.length !== businessGoals?.length ? '✅' : '❓'}      │`);
    console.log('└─────────────────────────────────────────────────────────────┘');

    // 9. Verificar se há vazamento de dados
    console.log('\n9️⃣ Verificando vazamento de dados...');
    
    let hasDataLeakage = false;
    
    // Verificar se usuário pessoal tem dados empresariais
    if (personalProducts?.length > 0 || personalSales?.length > 0 || personalRevenues?.length > 0 || personalExpenses?.length > 0) {
      console.log('⚠️  ATENÇÃO: Usuário pessoal possui dados empresariais!');
      hasDataLeakage = true;
    }
    
    // Verificar se usuário empresarial tem dados pessoais
    if (businessIncomes?.length > 0) {
      console.log('⚠️  ATENÇÃO: Usuário empresarial possui dados pessoais!');
      hasDataLeakage = true;
    }

    if (!hasDataLeakage) {
      console.log('✅ Nenhum vazamento de dados detectado!');
      console.log('✅ A separação entre contas pessoais e empresariais está funcionando corretamente!');
    }

    console.log('\n🎯 Teste de separação de dados concluído!');
    
    return {
      personalUser,
      businessUser,
      separation: {
        personal_incomes: { personal: personalIncomes?.length || 0, business: businessIncomes?.length || 0 },
        products: { personal: personalProducts?.length || 0, business: businessProducts?.length || 0 },
        sales: { personal: personalSales?.length || 0, business: businessSales?.length || 0 },
        revenues: { personal: personalRevenues?.length || 0, business: businessRevenues?.length || 0 },
        expenses: { personal: personalExpenses?.length || 0, business: businessExpenses?.length || 0 },
        goals: { personal: personalGoals?.length || 0, business: businessGoals?.length || 0 }
      },
      hasDataLeakage
    };

  } catch (error) {
    console.error('❌ Erro durante o teste de separação:', error);
  }
}

// Executar teste
testDataSeparation();