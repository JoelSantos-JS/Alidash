const { supabasePersonalService } = require('./src/lib/supabase-personal-service.ts')

// Teste do método getExpensesByCategory
async function testExpensesByCategory() {
  console.log('🧪 Testando getExpensesByCategory...')
  
  try {
    // Substitua pelo seu Firebase UID real
    const testUserId = 'seu-firebase-uid-aqui'
    
    console.log('📊 Buscando gastos por categoria para usuário:', testUserId)
    
    const result = await supabasePersonalService.getExpensesByCategory(testUserId)
    
    console.log('✅ Resultado obtido:')
    console.log('📈 Número de categorias:', result.length)
    console.log('📋 Dados:', result)
    
    if (result.length > 0) {
      console.log('🎯 Primeira categoria:', result[0])
    } else {
      console.log('⚠️ Nenhuma categoria encontrada')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    console.error('📋 Detalhes do erro:', {
      message: error.message,
      stack: error.stack
    })
  }
}

// Executar o teste
testExpensesByCategory()
  .then(() => {
    console.log('🏁 Teste concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error)
    process.exit(1)
  })