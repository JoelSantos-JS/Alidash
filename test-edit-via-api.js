const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: () => Promise.resolve(jsonData) });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: () => Promise.resolve(data) });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEditViaAPI() {
  try {
    console.log('🧪 Testando edição de meta via API PUT...');
    
    const userId = '21152f1a-3ffd-477a-9016-57f57d2fc0e8';
    
    // Primeiro, buscar uma meta para editar
    console.log('1. Buscando metas existentes...');
    const getResponse = await makeRequest(`http://localhost:3000/api/goals?user_id=${userId}`);
    const getData = await getResponse.json();
    
    if (!getData.success || !getData.goals || getData.goals.length === 0) {
      console.log('❌ Nenhuma meta encontrada para editar');
      return;
    }
    
    // Pegar a primeira meta empresarial
    const businessGoal = getData.goals.find(g => g.category === 'business');
    if (!businessGoal) {
      console.log('❌ Nenhuma meta empresarial encontrada para editar');
      return;
    }
    
    console.log('📋 Meta selecionada para edição:', {
      id: businessGoal.id,
      name: businessGoal.name,
      currentValue: businessGoal.currentValue,
      targetValue: businessGoal.targetValue
    });
    
    // Preparar dados para atualização
    const newCurrentValue = businessGoal.currentValue + 1000;
    const updates = {
      name: businessGoal.name,
      description: businessGoal.description,
      category: businessGoal.category,
      type: businessGoal.type,
      targetValue: businessGoal.targetValue,
      currentValue: newCurrentValue,
      unit: businessGoal.unit,
      deadline: businessGoal.deadline,
      priority: businessGoal.priority,
      status: businessGoal.status,
      notes: businessGoal.notes,
      tags: businessGoal.tags
    };
    
    console.log('2. Enviando atualização via PUT...');
    console.log('📤 Novos dados:', {
      currentValue: `${businessGoal.currentValue} → ${newCurrentValue}`,
      progress: `${((businessGoal.currentValue / businessGoal.targetValue) * 100).toFixed(1)}% → ${((newCurrentValue / businessGoal.targetValue) * 100).toFixed(1)}%`
    });
    
    // Fazer a requisição PUT
    const putResponse = await makeRequest('http://localhost:3000/api/goals', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId: businessGoal.id,
        userId: userId,
        updates: updates
      })
    });
    
    const putData = await putResponse.json();
    
    if (putResponse.ok && putData.success) {
      console.log('✅ Meta atualizada com sucesso!');
      console.log('📊 Dados retornados:', putData.goal);
      
      // Verificar se a atualização foi persistida
      console.log('3. Verificando se a atualização foi persistida...');
      const verifyResponse = await makeRequest(`http://localhost:3000/api/goals?user_id=${userId}`);
      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        const updatedGoal = verifyData.goals.find(g => g.id === businessGoal.id);
        if (updatedGoal) {
          console.log('✅ Verificação bem-sucedida!');
          console.log('📈 Valor atual após atualização:', updatedGoal.currentValue);
          console.log('📊 Progresso atual:', ((updatedGoal.currentValue / updatedGoal.targetValue) * 100).toFixed(1) + '%');
          
          if (updatedGoal.currentValue === newCurrentValue) {
            console.log('🎉 SUCESSO: A edição foi aplicada corretamente!');
          } else {
            console.log('⚠️ ATENÇÃO: O valor não foi atualizado como esperado');
            console.log('   Esperado:', newCurrentValue);
            console.log('   Atual:', updatedGoal.currentValue);
          }
        } else {
          console.log('❌ Meta não encontrada na verificação');
        }
      } else {
        console.log('❌ Erro na verificação:', verifyData.error);
      }
      
    } else {
      console.log('❌ Erro na atualização:', putData.error || 'Erro desconhecido');
      console.log('📋 Status:', putResponse.status);
      console.log('📋 Resposta completa:', putData);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testEditViaAPI();