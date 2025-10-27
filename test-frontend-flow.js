// Teste para simular o fluxo do frontend
const fetch = require('node-fetch');

async function testFrontendFlow() {
  console.log('🧪 Testando fluxo do frontend...\n');
  
  try {
    // 1. Simular busca de usuário (usando um dos user_ids encontrados)
    const testUserId = '0b1c9ee2-e87a-4381-bb58-2be7da2612d7'; // Um dos usuários encontrados
    
    console.log('1️⃣ Testando busca de usuário...');
    
    // Simular busca por user_id (que seria o que o frontend faz)
    const userResponse = await fetch(`http://localhost:3000/api/auth/get-user?user_id=${testUserId}`);
    
    if (userResponse.ok) {
      const userResult = await userResponse.json();
      console.log('✅ Usuário encontrado:', {
        id: userResult.user.id,
        email: userResult.user.email
      });
      
      const supabaseUserId = userResult.user.id;
      
      // 2. Testar busca de transações
      console.log('\n2️⃣ Testando busca de transações...');
      const transactionsResponse = await fetch(`http://localhost:3000/api/transactions/get?user_id=${supabaseUserId}`);
      
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        console.log(`✅ ${transactionsResult.count || 0} transações encontradas`);
        
        if (transactionsResult.transactions && transactionsResult.transactions.length > 0) {
          console.log('📋 Primeiras 3 transações:');
          transactionsResult.transactions.slice(0, 3).forEach((t, index) => {
            console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} (${t.type})`);
          });
        }
      } else {
        const errorText = await transactionsResponse.text();
        console.log('❌ Erro ao buscar transações:', transactionsResponse.status, errorText);
      }
      
      // 3. Testar busca de receitas
      console.log('\n3️⃣ Testando busca de receitas...');
      const revenuesResponse = await fetch(`http://localhost:3000/api/revenues/get?user_id=${supabaseUserId}`);
      
      if (revenuesResponse.ok) {
        const revenuesResult = await revenuesResponse.json();
        console.log(`✅ ${revenuesResult.revenues?.length || 0} receitas encontradas`);
        
        if (revenuesResult.revenues && revenuesResult.revenues.length > 0) {
          console.log('💰 Primeiras 3 receitas:');
          revenuesResult.revenues.slice(0, 3).forEach((r, index) => {
            console.log(`   ${index + 1}. ${r.description} - R$ ${r.amount} (${r.category})`);
          });
        }
      } else {
        const errorText = await revenuesResponse.text();
        console.log('❌ Erro ao buscar receitas:', revenuesResponse.status, errorText);
      }
      
    } else {
      console.log('❌ Usuário não encontrado:', userResponse.status);
      
      // Testar com um user_id fictício para ver se o problema é na busca do usuário
      console.log('\n🔄 Testando com user_id fictício...');
      const fakeUserResponse = await fetch(`http://localhost:3000/api/auth/get-user?user_id=fake-user-id`);
      
      if (!fakeUserResponse.ok) {
        console.log('✅ Comportamento esperado: usuário fictício não encontrado');
      }
    }
    
    // 4. Testar busca direta com user_id conhecido
    console.log('\n4️⃣ Testando busca direta com user_id conhecido...');
    
    const directTransactionsResponse = await fetch(`http://localhost:3000/api/transactions/get?user_id=${testUserId}`);
    
    if (directTransactionsResponse.ok) {
      const directTransactionsResult = await directTransactionsResponse.json();
      console.log(`✅ Busca direta: ${directTransactionsResult.count || 0} transações encontradas`);
    } else {
      const errorText = await directTransactionsResponse.text();
      console.log('❌ Erro na busca direta:', directTransactionsResponse.status, errorText);
    }
    
    const directRevenuesResponse = await fetch(`http://localhost:3000/api/revenues/get?user_id=${testUserId}`);
    
    if (directRevenuesResponse.ok) {
      const directRevenuesResult = await directRevenuesResponse.json();
      console.log(`✅ Busca direta: ${directRevenuesResult.revenues?.length || 0} receitas encontradas`);
    } else {
      const errorText = await directRevenuesResponse.text();
      console.log('❌ Erro na busca direta:', directRevenuesResponse.status, errorText);
    }
    
    console.log('\n🎉 Teste do fluxo frontend concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar o teste
testFrontendFlow();