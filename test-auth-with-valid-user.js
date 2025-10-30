require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixjqhqjqjqjqjqjqjqjq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthWithValidUser() {
  console.log('🧪 Testando autenticação com usuário válido...\n');

  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // 1. Verificar se o usuário existe
    console.log('1️⃣ Verificando se o usuário existe...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError.message);
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name
    });

    // 2. Testar API de goals com esse usuário
    console.log('\n2️⃣ Testando API de goals...');
    const response = await fetch(`http://localhost:3000/api/goals?user_id=${testUserId}`);
    
    if (!response.ok) {
      console.log('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Erro detalhado:', errorText);
      return;
    }

    const goalsData = await response.json();
    console.log('✅ API funcionando:', goalsData);

    // 3. Criar uma meta de teste
    console.log('\n3️⃣ Criando meta de teste...');
    const testGoal = {
      user_id: testUserId,
      name: 'Meta de Teste',
      target_amount: 1000,
      current_amount: 0,
      target_date: '2024-12-31',
      category: 'test',
      description: 'Meta criada para teste de autenticação'
    };

    const createResponse = await fetch('http://localhost:3000/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testGoal)
    });

    if (!createResponse.ok) {
      console.log('❌ Erro ao criar meta:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('Erro detalhado:', errorText);
      return;
    }

    const createdGoal = await createResponse.json();
    console.log('✅ Meta criada com sucesso:', createdGoal);

    // 4. Verificar se a meta foi criada
    console.log('\n4️⃣ Verificando metas criadas...');
    const finalResponse = await fetch(`http://localhost:3000/api/goals?user_id=${testUserId}`);
    const finalData = await finalResponse.json();
    console.log('✅ Metas finais:', finalData);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAuthWithValidUser();