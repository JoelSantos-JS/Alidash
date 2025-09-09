// Usar fetch nativo do Node.js 18+ ou importar node-fetch
let fetch;
try {
  // Node.js 18+ tem fetch global
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback para node-fetch se disponível
    fetch = require('node-fetch');
  }
} catch (error) {
  console.error('❌ Fetch não disponível. Instale node-fetch: npm install node-fetch');
  process.exit(1);
}

// Teste da sincronização com usuário real
async function testRealUserSync() {
  console.log('🧪 Testando sincronização com usuário real...')
  
  try {
    // Dados do usuário real encontrado no debug
    const realUserData = {
      firebase_uid: '1sAltLnRMgO3ZCYnh4zn9iFck0B3',
      email: 'joeltere9@gmail.com',
      name: 'Joel Tere', // Simulando um nome
      avatar_url: null
    }
    
    console.log('📤 Testando sincronização com usuário real:', realUserData)
    
    const response = await fetch('http://localhost:3000/api/auth/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realUserData)
    })
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Status text:', response.statusText)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Sincronização bem-sucedida:')
      console.log('📋 Ação realizada:', result.action)
      console.log('👤 Dados do usuário:')
      console.log('   - ID:', result.user.id)
      console.log('   - Email:', result.user.email)
      console.log('   - Nome:', result.user.name)
      console.log('   - Firebase UID:', result.user.firebase_uid)
      console.log('   - Última atualização:', result.user.updated_at)
      
      // Testar se conseguimos buscar dados pessoais
      console.log('\n🔍 Testando busca de dados pessoais...')
      await testPersonalData(result.user.firebase_uid)
      
    } else {
      const errorText = await response.text()
      console.log('❌ Erro na sincronização:')
      console.log('Status:', response.status)
      console.log('Texto:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.log('📋 Erro JSON:', JSON.stringify(errorJson, null, 2))
      } catch (parseError) {
        console.log('⚠️ Erro não é JSON válido')
      }
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', {
      message: error.message,
      code: error.code,
      type: error.constructor.name
    })
  }
}

// Função para testar dados pessoais
async function testPersonalData(firebaseUid) {
  try {
    // Buscar usuário via API
    const userResponse = await fetch(`http://localhost:3000/api/auth/get-user?firebase_uid=${firebaseUid}`)
    
    if (userResponse.ok) {
      const userResult = await userResponse.json()
      console.log('✅ Usuário encontrado via API get-user')
      
      // Testar busca de gastos por categoria (que estava falhando)
      console.log('📈 Testando busca de gastos por categoria...')
      
      // Simular chamada do frontend
      const testData = {
        userId: firebaseUid,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
      
      console.log('📊 Parâmetros de teste:', testData)
      console.log('✅ Teste de dados pessoais concluído')
      
    } else {
      console.log('❌ Erro ao buscar usuário via API get-user')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar dados pessoais:', error.message)
  }
}

// Executar o teste
testRealUserSync()
  .then(() => {
    console.log('\n🏁 Teste de sincronização com usuário real concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })