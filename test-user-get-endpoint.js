// Teste para o endpoint /api/user/get
const fetch = require('node-fetch');

async function testUserGetEndpoint() {
  console.log('🧪 Testando endpoint /api/user/get...\n');
  
  try {
    const firebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'; // Firebase UID conhecido
    
    console.log(`🔍 Testando com Firebase UID: ${firebaseUid}`);
    
    const response = await fetch('http://localhost:3000/api/user/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: firebaseUid
      })
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Usuário encontrado:');
      console.log(`   - ID: ${result.user.id}`);
      console.log(`   - Email: ${result.user.email}`);
      console.log(`   - Firebase UID: ${result.user.firebase_uid}`);
      console.log(`   - Nome: ${result.user.name}`);
      console.log(`   - Tipo de conta: ${result.user.account_type}`);
      console.log(`   - Ativo: ${result.user.is_active}`);
      
      return result.user;
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na resposta:', errorText);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Executar o teste
testUserGetEndpoint().then(user => {
  if (user) {
    console.log('\n🎉 Endpoint /api/user/get funcionando corretamente!');
  } else {
    console.log('\n❌ Problema com o endpoint /api/user/get');
  }
});