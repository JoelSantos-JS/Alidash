require('dotenv').config({ path: '.env.local' });

// Simular o ambiente do frontend
global.fetch = require('node-fetch');

// Importar apenas o SupabaseService
const { SupabaseService } = require('./src/lib/supabase-service.js');

async function testExpenseErrorFix() {
  console.log('🧪 Testando correção do erro vazio na criação de despesas...');
  
  try {
    // Inicializar o serviço
    console.log('🔧 Inicializando SupabaseService...');
    const supabaseService = new SupabaseService();
    console.log('✅ SupabaseService inicializado');
    
    // Usar um usuário de teste conhecido
    const testUserId = 'teste@voxcash.com'; // Firebase UID do usuário de teste
    
    // Teste 1: Dados válidos
    console.log('\n📝 Teste 1: Criando despesa com dados válidos...');
    const validExpenseData = {
      date: new Date().toISOString().split('T')[0],
      description: 'Teste de correção de erro',
      amount: 99.99,
      category: 'Teste',
      type: 'other',
      supplier: 'Teste Supplier',
      notes: 'Testando correção do erro vazio'
    };
    
    try {
      const result = await supabaseService.createExpense(testUserId, validExpenseData);
      console.log('✅ Despesa válida criada com sucesso:', result.id);
      
      // Limpar
      await supabaseService.deleteExpense(result.id);
      console.log('🧹 Despesa removida');
      
    } catch (validError) {
      console.error('❌ Erro inesperado com dados válidos:', validError.message);
      console.log('🔍 Detalhes do erro:', {
        code: validError.code,
        details: validError.details,
        hint: validError.hint
      });
    }
    
    // Teste 2: Dados inválidos para verificar se o erro agora é informativo
    console.log('\n📝 Teste 2: Criando despesa com dados inválidos...');
    const invalidExpenseData = {
      date: 'data-inválida',
      description: null, // Campo obrigatório nulo
      amount: 'não-é-número',
      category: null,
      type: 'tipo-muito-longo-que-pode-exceder-limite-do-banco-de-dados'
    };
    
    try {
      const result = await supabaseService.createExpense(testUserId, invalidExpenseData);
      console.log('⚠️ Dados inválidos foram aceitos (não deveria):', result.id);
    } catch (invalidError) {
      console.log('✅ Erro esperado com dados inválidos capturado:');
      console.log('📋 Mensagem:', invalidError.message);
      console.log('🔍 Código:', invalidError.code);
      console.log('💡 Hint:', invalidError.hint);
      console.log('📊 Detalhes:', invalidError.details);
      
      // Verificar se o erro não está mais vazio
      if (invalidError.message && invalidError.message !== 'NO_MESSAGE') {
        console.log('🎉 SUCESSO! O erro agora tem uma mensagem informativa!');
      } else {
        console.log('⚠️ O erro ainda está vazio ou sem mensagem útil');
      }
    }
    
    // Teste 3: Usuário inexistente
    console.log('\n📝 Teste 3: Criando despesa com usuário inexistente...');
    try {
      const result = await supabaseService.createExpense('usuario-inexistente', validExpenseData);
      console.log('⚠️ Usuário inexistente foi aceito (pode ser normal):', result.id);
    } catch (userError) {
      console.log('✅ Erro com usuário inexistente capturado:');
      console.log('📋 Mensagem:', userError.message);
      console.log('🔍 Código:', userError.code);
      console.log('💡 Hint:', userError.hint);
    }
    
  } catch (generalError) {
    console.error('❌ Erro geral:', generalError.message);
    console.log('🔍 Stack trace:', generalError.stack);
  }
}

testExpenseErrorFix().catch(console.error);