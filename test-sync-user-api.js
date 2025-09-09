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

// Teste da API sync-user
async function testSyncUserAPI() {
  console.log('🧪 Testando API sync-user...')
  
  try {
    const testData = {
      firebase_uid: 'test-firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null
    }
    
    console.log('📤 Enviando dados de teste:', testData)
    
    const response = await fetch('http://localhost:3000/api/auth/sync-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Status text:', response.statusText)
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Resposta de sucesso:')
      console.log(JSON.stringify(result, null, 2))
    } else {
      const errorText = await response.text()
      console.log('❌ Resposta de erro:')
      console.log('Status:', response.status)
      console.log('Texto:', errorText)
      
      // Tentar fazer parse do JSON se possível
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
      type: error.constructor.name,
      stack: error.stack
    })
  }
}

// Executar o teste
testSyncUserAPI()
  .then(() => {
    console.log('🏁 Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })