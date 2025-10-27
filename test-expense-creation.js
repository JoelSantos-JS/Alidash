require('dotenv').config();

async function testExpenseCreation() {
  console.log('🧪 Testando criação de despesa via API...');
  
  // Primeiro, vamos buscar um usuário real do Supabase
  console.log('🔍 Buscando usuário davi10@gmail.com...');
  
  try {
    const userResponse = await fetch('http://localhost:3000/api/auth/get-user?email=davi10@gmail.com');
    
    if (!userResponse.ok) {
      console.error('❌ Erro ao buscar usuário:', userResponse.status);
      return;
    }
    
    const userResult = await userResponse.json();
    const user = userResult.user;
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      firebase_uid: user.firebase_uid || 'null'
    });
    
    // Agora testar criação de despesa
    const testExpense = {
      description: 'Teste de despesa com fallback',
      amount: 100.50,
      category: 'Teste',
      type: 'other',
      date: new Date().toISOString(),
      notes: 'Despesa criada para testar fallback'
    };
    
    console.log('📝 Criando despesa para usuário:', user.id);
    console.log('📋 Dados da despesa:', testExpense);
    
    const createResponse = await fetch(`http://localhost:3000/api/expenses/create?firebase_uid=${user.firebase_uid}&email=${user.email}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testExpense)
    });
    
    console.log('📊 Status da resposta:', createResponse.status);
    
    if (createResponse.ok) {
      const result = await createResponse.json();
      console.log('✅ Despesa criada com sucesso!');
      console.log('📄 Resultado:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Erro ao criar despesa');
      console.log('📄 Erro:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testExpenseCreation().catch(console.error);