require('dotenv').config();

async function testGetUserByFirebaseUid() {
  console.log('🧪 Testando getUserByFirebaseUid...');
  
  try {
    // Simular a chamada que o DualDatabaseSync faz
    const response = await fetch('http://localhost:3000/api/debug/get-user-by-firebase-uid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_uid: 'cvaJfMdt5tX3vUydc9xLdRYbY483'
      })
    });

    const result = await response.json();
    console.log('📊 Status da resposta:', response.status);
    console.log('📄 Resultado:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testGetUserByFirebaseUid();