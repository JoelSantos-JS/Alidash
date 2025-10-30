const fetch = require('node-fetch');

async function testGoalsAPI() {
  try {
    console.log('🧪 Testando API de metas...');
    
    // ID do usuário que criamos as metas
    const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    // Testar a API de metas
    const response = await fetch(`http://localhost:3002/api/goals?user_id=${userId}`);
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Resposta da API:', JSON.stringify(data, null, 2));
    
    if (data.success && data.goals) {
      console.log(`📈 Total de metas encontradas: ${data.goals.length}`);
      data.goals.forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.name} - ${goal.current_value}/${goal.target_value} ${goal.unit}`);
      });
    } else {
      console.log('⚠️ Nenhuma meta encontrada ou erro na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testGoalsAPI();