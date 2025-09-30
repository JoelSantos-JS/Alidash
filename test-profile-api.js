const fetch = require('node-fetch')

async function testProfileAPI() {
  console.log('🧪 Testando API de atualização do perfil...\n')

  const baseUrl = 'http://localhost:3002'
  const apiUrl = `${baseUrl}/api/user/profile`

  // Dados de teste - usando um usuário real do banco
  const testData = {
    firebase_uid: '1sAltLnRMgO3ZCYnh4zn9iFck0B3', // joeltere9@gmail.com
    name: `Nome Teste API ${Date.now()}`
  }

  try {
    console.log('📤 Enviando requisição PUT para:', apiUrl)
    console.log('📋 Dados:', JSON.stringify(testData, null, 2))

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    console.log(`\n📥 Status da resposta: ${response.status}`)

    const responseData = await response.json()
    console.log('📋 Resposta:', JSON.stringify(responseData, null, 2))

    if (response.ok) {
      console.log('\n✅ API funcionando corretamente!')
      console.log(`✅ Nome atualizado para: ${responseData.user?.name}`)
    } else {
      console.log('\n❌ Erro na API')
      console.log(`❌ Erro: ${responseData.error}`)
    }

  } catch (error) {
    console.error('\n❌ Erro ao testar API:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3002')
    }
  }
}

// Executar teste
testProfileAPI()