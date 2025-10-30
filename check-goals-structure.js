const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkGoalsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela goals...\n')

    // Tentar inserir uma meta simples para ver quais campos são obrigatórios
    const testGoal = {
      user_id: 'test-user-id',
      name: 'Meta Teste',
      description: 'Teste de estrutura',
      category: 'financial',
      type: 'savings',
      target_value: 1000,
      unit: 'BRL',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'active'
    }

    console.log('🧪 Testando inserção com campos básicos...')
    const { data, error } = await supabase
      .from('goals')
      .insert(testGoal)
      .select()

    if (error) {
      console.log('❌ Erro na inserção:', error)
      console.log('\n📋 Detalhes do erro:')
      console.log('- Code:', error.code)
      console.log('- Message:', error.message)
      console.log('- Details:', error.details)
      console.log('- Hint:', error.hint)
    } else {
      console.log('✅ Inserção bem-sucedida!')
      console.log('📄 Dados inseridos:', data)
      
      // Limpar o teste
      if (data && data[0]) {
        await supabase
          .from('goals')
          .delete()
          .eq('id', data[0].id)
        console.log('🧹 Dados de teste removidos')
      }
    }

    // Tentar buscar uma meta existente para ver a estrutura
    console.log('\n🔍 Buscando metas existentes para ver estrutura...')
    const { data: existingGoals, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .limit(1)

    if (fetchError) {
      console.log('❌ Erro ao buscar metas:', fetchError)
    } else if (existingGoals && existingGoals.length > 0) {
      console.log('✅ Meta encontrada! Estrutura:')
      console.log(JSON.stringify(existingGoals[0], null, 2))
    } else {
      console.log('ℹ️ Nenhuma meta encontrada na tabela')
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkGoalsStructure()