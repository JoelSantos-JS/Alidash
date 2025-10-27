require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBudgetDetailed() {
  console.log('🔍 Teste detalhado do orçamento...\n');

  try {
    // Buscar usuário de teste
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'teste.pessoal@example.com')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }

    const testUser = users[0];
    console.log('👤 Usuário:', testUser.email, '(ID:', testUser.id + ')');

    // 1. Buscar orçamento diretamente no Supabase
    console.log('\n1️⃣ Busca direta no Supabase:');
    const { data: directBudget, error: directError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (directError) {
      console.error('❌ Erro na busca direta:', directError);
    } else {
      console.log('✅ Orçamento direto:', JSON.stringify(directBudget, null, 2));
    }

    // 2. Testar API GET
    console.log('\n2️⃣ Teste da API GET:');
    const apiResponse = await fetch(`http://localhost:3001/api/budgets?user_id=${testUser.id}`);
    const apiResult = await apiResponse.json();
    console.log('📡 Resposta da API:', JSON.stringify(apiResult, null, 2));

    // 3. Atualizar orçamento
    console.log('\n3️⃣ Atualizando orçamento para 2000...');
    const updateResponse = await fetch('http://localhost:3001/api/budgets', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: testUser.id,
        monthly_budget: 2000.00
      })
    });

    const updateResult = await updateResponse.json();
    console.log('📝 Resultado da atualização:', JSON.stringify(updateResult, null, 2));

    // 4. Verificar novamente no Supabase
    console.log('\n4️⃣ Verificação direta no Supabase após atualização:');
    const { data: verifyBudget, error: verifyError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', testUser.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
    } else {
      console.log('✅ Orçamento verificado:', JSON.stringify(verifyBudget, null, 2));
    }

    // 5. Verificar novamente via API
    console.log('\n5️⃣ Verificação via API após atualização:');
    const finalApiResponse = await fetch(`http://localhost:3001/api/budgets?user_id=${testUser.id}`);
    const finalApiResult = await finalApiResponse.json();
    console.log('📡 Resposta final da API:', JSON.stringify(finalApiResult, null, 2));

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testBudgetDetailed();