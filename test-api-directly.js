const fetch = require('node-fetch');

async function testApiDirectly() {
  try {
    console.log('🌐 Testando API /api/goals diretamente...');
    
    const userId = '21152f1a-3ffd-477a-9016-57f57d2fc0e8';
    const url = `http://localhost:3000/api/goals?user_id=${userId}`;
    
    console.log('📡 URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📦 Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.success && data.goals) {
      console.log(`\n✅ ${data.goals.length} metas encontradas pela API`);
      
      data.goals.forEach((goal, index) => {
        console.log(`\n${index + 1}. ${goal.name}`);
        console.log(`   ID: ${goal.id}`);
        console.log(`   Categoria: ${goal.category}`);
        console.log(`   Target Value: ${goal.targetValue}`);
        console.log(`   Current Value: ${goal.currentValue}`);
        console.log(`   Status: ${goal.status}`);
        console.log(`   Priority: ${goal.priority}`);
        console.log(`   Unit: ${goal.unit}`);
        console.log(`   Deadline: ${goal.deadline}`);
        console.log(`   Created Date: ${goal.createdDate}`);
      });
      
      // Verificar especificamente as metas empresariais
      const businessGoals = data.goals.filter(g => g.category === 'business');
      console.log(`\n🏢 Metas empresariais encontradas: ${businessGoals.length}`);
      
      businessGoals.forEach((goal, index) => {
        console.log(`\n🎯 Meta empresarial ${index + 1}: ${goal.name}`);
        console.log(`   Progresso: ${goal.currentValue}/${goal.targetValue}`);
        console.log(`   Percentual: ${goal.targetValue > 0 ? ((goal.currentValue / goal.targetValue) * 100).toFixed(1) : 0}%`);
      });
    } else {
      console.log('❌ API retornou erro ou dados vazios');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testApiDirectly();