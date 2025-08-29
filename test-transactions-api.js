// Script de teste para a API de transações
const fetch = require('node-fetch');

async function testTransactionsAPI() {
  console.log('🧪 Testando API de transações...');
  
  try {
    // Teste 1: Verificar se a API está respondendo
    console.log('\n1️⃣ Testando endpoint básico...');
    const response = await fetch('http://localhost:3000/api/transactions/get');
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    // Teste 2: Testar com user_id inválido
    console.log('\n2️⃣ Testando com user_id inválido...');
    const response2 = await fetch('http://localhost:3000/api/transactions/get?user_id=invalid-user-id');
    
    console.log('Status:', response2.status);
    const text2 = await response2.text();
    console.log('Response:', text2);
    
    // Teste 3: Testar com user_id válido (se disponível)
    console.log('\n3️⃣ Testando com user_id válido...');
    const validUserId = process.argv[2]; // Passar como argumento
    
    if (validUserId) {
      const response3 = await fetch(`http://localhost:3000/api/transactions/get?user_id=${validUserId}`);
      
      console.log('Status:', response3.status);
      const text3 = await response3.text();
      console.log('Response:', text3);
      
      try {
        const json3 = JSON.parse(text3);
        console.log('Transações encontradas:', json3.count || 0);
      } catch (parseError) {
        console.log('Erro ao fazer parse da resposta:', parseError.message);
      }
    } else {
      console.log('⚠️ Nenhum user_id válido fornecido. Use: node test-transactions-api.js <user_id>');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testTransactionsAPI(); 