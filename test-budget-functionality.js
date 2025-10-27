require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Configuração do Supabase:');
console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'Não configurada');
console.log('   Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');

async function testBudgetFunctionality() {
  console.log('🧪 Testando funcionalidade do orçamento...\n');

  try {
    // 1. Buscar um usuário existente
    console.log('1️⃣ Buscando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado. Criando usuário de teste...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: 'teste@budget.com',
          firebase_uid: 'test-budget-uid-' + Date.now()
        })
        .select()
        .single();

      if (createUserError) {
        console.error('❌ Erro ao criar usuário:', createUserError);
        return;
      }

      users.push(newUser);
    }

    const testUser = users[0];
    console.log('✅ Usuário de teste:', testUser.email, '(ID:', testUser.id + ')');

    // 2. Testar busca de orçamento (GET)
    console.log('\n2️⃣ Testando busca de orçamento...');
    const getResponse = await fetch(`http://localhost:3001/api/budgets?user_id=${testUser.id}`);
    const getResult = await getResponse.json();
    
    console.log('📊 Resposta GET:', getResult);

    // 3. Testar atualização de orçamento (PUT)
    console.log('\n3️⃣ Testando atualização de orçamento...');
    const newBudgetValue = 1500.00;
    
    const putResponse = await fetch('http://localhost:3001/api/budgets', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: testUser.id,
        monthly_budget: newBudgetValue
      })
    });

    const putResult = await putResponse.json();
    console.log('📝 Resposta PUT:', putResult);

    // 4. Verificar se a atualização foi persistida
    console.log('\n4️⃣ Verificando persistência da atualização...');
    const verifyResponse = await fetch(`http://localhost:3001/api/budgets?user_id=${testUser.id}`);
    const verifyResult = await verifyResponse.json();
    
    console.log('🔍 Verificação:', verifyResult);

    if (verifyResult.budget && verifyResult.budget.monthly_budget === newBudgetValue) {
      console.log('✅ Orçamento atualizado com sucesso!');
    } else {
      console.log('❌ Orçamento não foi atualizado corretamente');
      console.log('   Esperado:', newBudgetValue);
      console.log('   Recebido:', verifyResult.budget?.monthly_budget);
    }

    // 5. Testar com valor inválido
    console.log('\n5️⃣ Testando validação com valor inválido...');
    const invalidResponse = await fetch('http://localhost:3001/api/budgets', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: testUser.id,
        monthly_budget: -100
      })
    });

    const invalidResult = await invalidResponse.json();
    console.log('⚠️ Teste de validação:', invalidResult);

    if (invalidResponse.status === 400) {
      console.log('✅ Validação funcionando corretamente');
    } else {
      console.log('❌ Validação não está funcionando');
    }

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testBudgetFunctionality();