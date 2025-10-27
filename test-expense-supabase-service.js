require('dotenv').config({ path: '.env.local' });

// Importar o SupabaseService
const { SupabaseService } = require('./src/lib/supabase-service.js');

async function testExpenseWithSupabaseService() {
  console.log('🧪 Testando criação de despesa com SupabaseService...');
  
  try {
    const supabaseService = new SupabaseService();
    
    // 1. Buscar um usuário de teste
    console.log('👤 Buscando usuários...');
    const users = await supabaseService.getAllUsers();
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado');
      return;
    }
    
    const testUser = users[0];
    console.log(`✅ Usando usuário: ${testUser.email} (ID: ${testUser.id})`);
    
    // 2. Tentar criar uma despesa com dados válidos
    console.log('\n📝 Teste 1: Criando despesa com dados válidos...');
    const validExpenseData = {
      date: new Date(),
      description: 'Teste de despesa válida',
      amount: 100.50,
      category: 'Alimentação',
      type: 'other',
      supplier: 'Teste Supplier',
      notes: 'Despesa de teste'
    };
    
    try {
      const validExpense = await supabaseService.createExpense(testUser.id, validExpenseData);
      console.log('✅ Despesa válida criada:', validExpense.id);
      
      // Limpar a despesa de teste
      await supabaseService.deleteExpense(validExpense.id);
      console.log('🧹 Despesa de teste removida');
    } catch (error) {
      console.error('❌ Erro ao criar despesa válida:', error);
      console.log('Tipo do erro:', typeof error);
      console.log('Erro como string:', String(error));
      console.log('Erro como JSON:', JSON.stringify(error, null, 2));
    }
    
    // 3. Tentar criar uma despesa com dados inválidos
    console.log('\n📝 Teste 2: Criando despesa com dados inválidos...');
    const invalidExpenseData = {
      date: 'data-inválida', // Data inválida
      description: null, // Campo obrigatório nulo
      amount: 'não-é-número', // Valor inválido
      category: null,
      type: 'tipo-inválido'
    };
    
    try {
      const invalidExpense = await supabaseService.createExpense(testUser.id, invalidExpenseData);
      console.log('⚠️ Despesa inválida foi criada (não deveria):', invalidExpense.id);
    } catch (error) {
      console.error('❌ Erro esperado ao criar despesa inválida:', error);
      console.log('Tipo do erro:', typeof error);
      console.log('Erro como string:', String(error));
      console.log('Erro como JSON:', JSON.stringify(error, null, 2));
      
      // Verificar se o erro está vazio
      if (error && typeof error === 'object') {
        console.log('🔍 Propriedades do erro:');
        Object.keys(error).forEach(key => {
          console.log(`  - ${key}: ${error[key]}`);
        });
      }
    }
    
    // 4. Testar com usuário inexistente
    console.log('\n📝 Teste 3: Criando despesa com usuário inexistente...');
    const nonExistentUserData = {
      date: new Date(),
      description: 'Teste com usuário inexistente',
      amount: 50.00,
      category: 'Teste',
      type: 'other'
    };
    
    try {
      const nonExistentExpense = await supabaseService.createExpense('usuario-inexistente-123', nonExistentUserData);
      console.log('⚠️ Despesa com usuário inexistente foi criada:', nonExistentExpense.id);
    } catch (error) {
      console.error('❌ Erro esperado com usuário inexistente:', error);
      console.log('Tipo do erro:', typeof error);
      console.log('Erro como string:', String(error));
      console.log('Erro como JSON:', JSON.stringify(error, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    console.log('Tipo do erro:', typeof error);
    console.log('Erro como string:', String(error));
    console.log('Stack trace:', error.stack);
  }
}

testExpenseWithSupabaseService().catch(console.error);