// Teste da API de dívidas do Supabase
require('dotenv').config();

const testDebtsAPI = async () => {
  console.log('🧪 Testando API de dívidas do Supabase...');
  
  const baseUrl = 'http://localhost:3000';
  const testUserId = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // Firebase UID de teste
  
  try {
    // 1. Testar busca de dívidas
    console.log('\n1️⃣ Testando busca de dívidas...');
    const getResponse = await fetch(`${baseUrl}/api/debts/get?user_id=${testUserId}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Busca de dívidas:', {
        success: getData.success,
        count: getData.debts?.length || 0,
        debts: getData.debts?.slice(0, 2) // Mostrar apenas as 2 primeiras
      });
    } else {
      console.log('❌ Erro na busca:', getResponse.status, await getResponse.text());
    }
    
    // 2. Testar criação de dívida
    console.log('\n2️⃣ Testando criação de dívida...');
    const testDebt = {
      creditorName: 'Teste Credor',
      description: 'Dívida de teste via API',
      originalAmount: 1000,
      currentAmount: 1000,
      interestRate: 2.5,
      dueDate: new Date('2024-12-31').toISOString(),
      category: 'personal',
      priority: 'medium',
      status: 'pending',
      paymentMethod: 'pix',
      notes: 'Criado via teste automatizado',
      tags: ['teste', 'api']
    };
    
    const createResponse = await fetch(`${baseUrl}/api/debts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: testUserId,
        debt: testDebt
      })
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Criação de dívida:', {
        success: createData.success,
        debtId: createData.debt?.id,
        creditorName: createData.debt?.creditorName
      });
    } else {
      console.log('❌ Erro na criação:', createResponse.status, await createResponse.text());
    }
    
    // 3. Verificar novamente as dívidas
    console.log('\n3️⃣ Verificando dívidas após criação...');
    const finalResponse = await fetch(`${baseUrl}/api/debts/get?user_id=${testUserId}`);
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log('✅ Verificação final:', {
        success: finalData.success,
        totalDebts: finalData.debts?.length || 0
      });
    }
    
    console.log('\n🎉 Teste da API de dívidas concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
};

// Executar teste
testDebtsAPI();