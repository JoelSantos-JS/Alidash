// Teste para verificar autenticação de usuários
const fetch = require('node-fetch');

async function testUserAuth() {
  console.log('🔐 Testando autenticação de usuários...\n');
  
  try {
    // 1. Testar busca de usuário com Firebase UID conhecido
    console.log('1️⃣ Testando busca com Firebase UID conhecido...');
    
    const knownFirebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // Do arquivo fix-user-firebase-uid.js
    
    const userResponse = await fetch(`http://localhost:3000/api/auth/get-user?firebase_uid=${knownFirebaseUid}`);
    
    if (userResponse.ok) {
      const userResult = await userResponse.json();
      console.log('✅ Usuário encontrado pelo Firebase UID:');
      console.log(`   - ID: ${userResult.user.id}`);
      console.log(`   - Email: ${userResult.user.email}`);
      console.log(`   - Firebase UID: ${userResult.user.firebase_uid}`);
      
      const supabaseUserId = userResult.user.id;
      
      // 2. Testar busca de dados com o usuário encontrado
      console.log('\n2️⃣ Testando busca de dados com usuário autenticado...');
      
      // Testar transações
      const transactionsResponse = await fetch(`http://localhost:3000/api/transactions/get?user_id=${supabaseUserId}`);
      
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        console.log(`✅ Transações: ${transactionsResult.count || 0} encontradas`);
        
        if (transactionsResult.transactions && transactionsResult.transactions.length > 0) {
          console.log('📋 Últimas 3 transações:');
          transactionsResult.transactions.slice(0, 3).forEach((t, index) => {
            console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} (${t.type}) - ${t.date}`);
          });
        }
      } else {
        console.log('❌ Erro ao buscar transações:', transactionsResponse.status);
      }
      
      // Testar receitas
      const revenuesResponse = await fetch(`http://localhost:3000/api/revenues/get?user_id=${supabaseUserId}`);
      
      if (revenuesResponse.ok) {
        const revenuesResult = await revenuesResponse.json();
        console.log(`✅ Receitas: ${revenuesResult.revenues?.length || 0} encontradas`);
        
        if (revenuesResult.revenues && revenuesResult.revenues.length > 0) {
          console.log('💰 Últimas 3 receitas:');
          revenuesResult.revenues.slice(0, 3).forEach((r, index) => {
            console.log(`   ${index + 1}. ${r.description} - R$ ${r.amount} (${r.category}) - ${r.date}`);
          });
        }
      } else {
        console.log('❌ Erro ao buscar receitas:', revenuesResponse.status);
      }
      
    } else {
      const errorText = await userResponse.text();
      console.log('❌ Usuário não encontrado:', userResponse.status, errorText);
    }
    
    // 3. Testar busca por email
    console.log('\n3️⃣ Testando busca por email...');
    
    const emailResponse = await fetch(`http://localhost:3000/api/auth/get-user?email=joeltere9@gmail.com`);
    
    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log('✅ Usuário encontrado por email:');
      console.log(`   - ID: ${emailResult.user.id}`);
      console.log(`   - Email: ${emailResult.user.email}`);
      console.log(`   - Firebase UID: ${emailResult.user.firebase_uid}`);
    } else {
      const errorText = await emailResponse.text();
      console.log('❌ Usuário não encontrado por email:', emailResponse.status, errorText);
    }
    
    console.log('\n🎉 Teste de autenticação concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar o teste
testUserAuth();