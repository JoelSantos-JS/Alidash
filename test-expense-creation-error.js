require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExpenseCreationError() {
  console.log('🧪 Testando criação de despesa para reproduzir erro...');
  
  try {
    // 1. Buscar um usuário de teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Usando usuário: ${testUser.email} (ID: ${testUser.id})`);
    
    // 2. Tentar criar uma despesa com dados válidos
    console.log('\n📝 Teste 1: Criando despesa com dados válidos...');
    const validExpenseData = {
      user_id: testUser.id,
      date: new Date().toISOString().split('T')[0],
      description: 'Teste de despesa válida',
      amount: 100.50,
      category: 'Alimentação',
      type: 'other',
      supplier: 'Teste Supplier',
      notes: 'Despesa de teste'
    };
    
    const { data: validExpense, error: validError } = await supabase
      .from('expenses')
      .insert(validExpenseData)
      .select()
      .single();
    
    if (validError) {
      console.error('❌ Erro ao criar despesa válida:', validError);
      console.log('Detalhes do erro:', JSON.stringify(validError, null, 2));
    } else {
      console.log('✅ Despesa válida criada:', validExpense.id);
      
      // Limpar a despesa de teste
      await supabase.from('expenses').delete().eq('id', validExpense.id);
      console.log('🧹 Despesa de teste removida');
    }
    
    // 3. Tentar criar uma despesa com dados inválidos para reproduzir erro
    console.log('\n📝 Teste 2: Criando despesa com dados inválidos...');
    const invalidExpenseData = {
      user_id: testUser.id,
      date: 'data-inválida',
      description: null, // Campo obrigatório nulo
      amount: 'não-é-número',
      category: 'Categoria Inexistente',
      type: 'tipo-inválido'
    };
    
    const { data: invalidExpense, error: invalidError } = await supabase
      .from('expenses')
      .insert(invalidExpenseData)
      .select()
      .single();
    
    if (invalidError) {
      console.error('❌ Erro esperado ao criar despesa inválida:', invalidError);
      console.log('Detalhes do erro:', JSON.stringify(invalidError, null, 2));
      console.log('Tipo do erro:', typeof invalidError);
      console.log('Erro como string:', String(invalidError));
    } else {
      console.log('⚠️ Despesa inválida foi criada (não deveria):', invalidExpense.id);
    }
    
    // 4. Testar com usuário inexistente
    console.log('\n📝 Teste 3: Criando despesa com usuário inexistente...');
    const nonExistentUserData = {
      user_id: 'usuario-inexistente-123',
      date: new Date().toISOString().split('T')[0],
      description: 'Teste com usuário inexistente',
      amount: 50.00,
      category: 'Teste',
      type: 'other'
    };
    
    const { data: nonExistentExpense, error: nonExistentError } = await supabase
      .from('expenses')
      .insert(nonExistentUserData)
      .select()
      .single();
    
    if (nonExistentError) {
      console.error('❌ Erro esperado com usuário inexistente:', nonExistentError);
      console.log('Detalhes do erro:', JSON.stringify(nonExistentError, null, 2));
    } else {
      console.log('⚠️ Despesa com usuário inexistente foi criada:', nonExistentExpense.id);
    }
    
    // 5. Verificar estrutura da tabela expenses
    console.log('\n📋 Verificando estrutura da tabela expenses...');
    const { data: sampleExpense, error: structureError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
    } else if (sampleExpense && sampleExpense.length > 0) {
      console.log('📋 Campos disponíveis na tabela expenses:');
      Object.keys(sampleExpense[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleExpense[0][key]} = ${sampleExpense[0][key]}`);
      });
    } else {
      console.log('⚠️ Nenhuma despesa encontrada na tabela');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    console.log('Tipo do erro:', typeof error);
    console.log('Erro como string:', String(error));
    console.log('Erro como JSON:', JSON.stringify(error, null, 2));
  }
}

testExpenseCreationError().catch(console.error);