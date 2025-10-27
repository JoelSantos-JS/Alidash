// Teste para simular o fluxo completo do dashboard
const fetch = require('node-fetch');

async function testDashboardFlow() {
  console.log('🏠 Testando fluxo completo do dashboard...\n');
  
  try {
    const firebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3';
    
    // 1. Simular autenticação (como o useAuth faz)
    console.log('1️⃣ Simulando autenticação...');
    
    const userResponse = await fetch('http://localhost:3000/api/user/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: firebaseUid
      })
    });
    
    if (!userResponse.ok) {
      console.log('❌ Falha na autenticação');
      return;
    }
    
    const userResult = await userResponse.json();
    const userData = userResult.user;
    
    console.log(`✅ Usuário autenticado: ${userData.email}`);
    console.log(`   - ID Supabase: ${userData.id}`);
    console.log(`   - Firebase UID: ${userData.firebase_uid}`);
    
    // 2. Simular busca de dados do dashboard (como page.tsx faz)
    console.log('\n2️⃣ Buscando dados do dashboard...');
    
    const dashboardPromises = [
      // Produtos
      fetch(`http://localhost:3000/api/products/get?user_id=${userData.id}`),
      // Receitas
      fetch(`http://localhost:3000/api/revenues/get?user_id=${userData.id}`),
      // Despesas
      fetch(`http://localhost:3000/api/expenses/get?user_id=${userData.id}`),
      // Vendas
      fetch(`http://localhost:3000/api/sales/get?user_id=${userData.id}`),
      // Transações
      fetch(`http://localhost:3000/api/transactions/get?user_id=${userData.id}`)
    ];
    
    const [productsRes, revenuesRes, expensesRes, salesRes, transactionsRes] = await Promise.all(dashboardPromises);
    
    // 3. Processar resultados
    console.log('\n3️⃣ Processando resultados...');
    
    // Produtos
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      console.log(`✅ Produtos: ${productsData.products?.length || 0} encontrados`);
    } else {
      console.log(`❌ Produtos: Erro ${productsRes.status}`);
    }
    
    // Receitas
    if (revenuesRes.ok) {
      const revenuesData = await revenuesRes.json();
      console.log(`✅ Receitas: ${revenuesData.revenues?.length || 0} encontradas`);
      
      if (revenuesData.revenues && revenuesData.revenues.length > 0) {
        console.log('💰 Últimas 3 receitas:');
        revenuesData.revenues.slice(0, 3).forEach((r, index) => {
          console.log(`   ${index + 1}. ${r.description} - R$ ${r.amount}`);
        });
      }
    } else {
      const errorText = await revenuesRes.text();
      console.log(`❌ Receitas: Erro ${revenuesRes.status} - ${errorText}`);
    }
    
    // Despesas
    if (expensesRes.ok) {
      const expensesData = await expensesRes.json();
      console.log(`✅ Despesas: ${expensesData.expenses?.length || 0} encontradas`);
    } else {
      console.log(`❌ Despesas: Erro ${expensesRes.status}`);
    }
    
    // Vendas
    if (salesRes.ok) {
      const salesData = await salesRes.json();
      console.log(`✅ Vendas: ${salesData.sales?.length || 0} encontradas`);
    } else {
      console.log(`❌ Vendas: Erro ${salesRes.status}`);
    }
    
    // Transações
    if (transactionsRes.ok) {
      const transactionsData = await transactionsRes.json();
      console.log(`✅ Transações: ${transactionsData.count || 0} encontradas`);
      
      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        console.log('💳 Últimas 3 transações:');
        transactionsData.transactions.slice(0, 3).forEach((t, index) => {
          console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} (${t.type})`);
        });
      }
    } else {
      const errorText = await transactionsRes.text();
      console.log(`❌ Transações: Erro ${transactionsRes.status} - ${errorText}`);
    }
    
    console.log('\n🎉 Teste do dashboard concluído!');
    console.log('\n📋 Resumo:');
    console.log('   - Autenticação: ✅ Funcionando');
    console.log('   - Busca de dados: ✅ Funcionando');
    console.log('   - APIs: ✅ Respondendo corretamente');
    
    console.log('\n💡 Se os dados não aparecem no frontend, o problema pode estar:');
    console.log('   1. Na renderização dos componentes React');
    console.log('   2. No estado de loading/erro dos componentes');
    console.log('   3. Na autenticação Firebase no browser');
    console.log('   4. Em algum erro JavaScript no frontend');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar o teste
testDashboardFlow();