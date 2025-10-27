require('dotenv').config({ path: '.env.local' });

// Simular o ambiente do frontend
global.fetch = require('node-fetch');

// Importar as classes como o frontend faz
const SupabaseService = require('./src/lib/supabase-service.js');
const { DualDatabaseSync } = require('./src/lib/dual-database-sync.ts');

async function testExpenseCreationLikeFrontend() {
  console.log('🧪 Testando criação de despesas como o frontend...');
  
  try {
    // 1. Inicializar os serviços como o frontend
    console.log('🔧 Inicializando serviços...');
    
    const supabaseService = new SupabaseService();
    const dualSync = new DualDatabaseSync();
    
    console.log('✅ Serviços inicializados');
    
    // 2. Usar um usuário de teste conhecido
    const testUserId = 'teste@voxcash.com'; // Firebase UID do usuário de teste
    
    // 3. Criar dados de despesa como o frontend
    console.log('\n📝 Criando despesa de teste...');
    const expenseData = {
      date: new Date().toISOString().split('T')[0],
      description: 'Teste de despesa frontend',
      amount: 150.75,
      category: 'Alimentação',
      type: 'other',
      supplier: 'Teste Supplier Frontend',
      notes: 'Despesa criada via teste frontend'
    };
    
    console.log('📋 Dados da despesa:', JSON.stringify(expenseData, null, 2));
    
    // 4. Testar criação via SupabaseService diretamente
    console.log('\n🔧 Teste 1: SupabaseService.createExpense...');
    try {
      const supabaseResult = await supabaseService.createExpense(testUserId, expenseData);
      console.log('✅ SupabaseService.createExpense sucesso:', supabaseResult.id);
      
      // Limpar
      await supabaseService.deleteExpense(supabaseResult.id);
      console.log('🧹 Despesa removida do Supabase');
      
    } catch (supabaseError) {
      console.error('❌ Erro no SupabaseService.createExpense:', supabaseError);
      console.log('🔍 Tipo do erro:', typeof supabaseError);
      console.log('🔍 Erro como string:', String(supabaseError));
      console.log('🔍 Erro JSON:', JSON.stringify(supabaseError, null, 2));
      
      // Verificar se é um erro vazio
      if (supabaseError && typeof supabaseError === 'object') {
        const errorKeys = Object.keys(supabaseError);
        console.log('🔍 Propriedades do erro:', errorKeys);
        
        if (errorKeys.length === 0) {
          console.log('⚠️ ERRO VAZIO DETECTADO! Este é o problema!');
        }
      }
    }
    
    // 5. Testar criação via DualDatabaseSync
    console.log('\n🔧 Teste 2: DualDatabaseSync.createExpense...');
    try {
      const dualResult = await dualSync.createExpense(testUserId, expenseData);
      console.log('✅ DualDatabaseSync.createExpense resultado:', dualResult);
      
      if (dualResult.success) {
        console.log('✅ Criação bem-sucedida');
        
        // Limpar se necessário
        if (dualResult.supabaseData?.id) {
          await supabaseService.deleteExpense(dualResult.supabaseData.id);
          console.log('🧹 Despesa removida do Supabase');
        }
      } else {
        console.log('❌ Criação falhou:', dualResult.errors);
      }
      
    } catch (dualError) {
      console.error('❌ Erro no DualDatabaseSync.createExpense:', dualError);
      console.log('🔍 Tipo do erro:', typeof dualError);
      console.log('🔍 Erro como string:', String(dualError));
      console.log('🔍 Erro JSON:', JSON.stringify(dualError, null, 2));
      
      // Verificar se é um erro vazio
      if (dualError && typeof dualError === 'object') {
        const errorKeys = Object.keys(dualError);
        console.log('🔍 Propriedades do erro:', errorKeys);
        
        if (errorKeys.length === 0) {
          console.log('⚠️ ERRO VAZIO DETECTADO! Este é o problema!');
        }
      }
    }
    
    // 6. Testar com dados inválidos para reproduzir o erro
    console.log('\n🔧 Teste 3: Dados inválidos para reproduzir erro...');
    const invalidData = {
      date: null,
      description: '',
      amount: 'não-é-número',
      category: null,
      type: 'tipo-inválido'
    };
    
    try {
      const invalidResult = await supabaseService.createExpense(testUserId, invalidData);
      console.log('⚠️ Dados inválidos foram aceitos (não deveria):', invalidResult);
    } catch (invalidError) {
      console.error('❌ Erro esperado com dados inválidos:', invalidError);
      console.log('🔍 Tipo do erro:', typeof invalidError);
      console.log('🔍 Erro como string:', String(invalidError));
      console.log('🔍 Erro JSON:', JSON.stringify(invalidError, null, 2));
      
      // Verificar se é um erro vazio
      if (invalidError && typeof invalidError === 'object') {
        const errorKeys = Object.keys(invalidError);
        console.log('🔍 Propriedades do erro:', errorKeys);
        
        if (errorKeys.length === 0) {
          console.log('⚠️ ERRO VAZIO DETECTADO! Este é o problema!');
        }
      }
    }
    
  } catch (generalError) {
    console.error('❌ Erro geral:', generalError);
    console.log('🔍 Stack trace:', generalError.stack);
  }
}

testExpenseCreationLikeFrontend().catch(console.error);