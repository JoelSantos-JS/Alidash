const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testGoalCreation() {
  const firebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'
  
  console.log('🎯 Testando criação de meta para usuário:', firebaseUid)
  console.log('\n--- TESTE DE CRIAÇÃO DE META ---')
  
  try {
    // 1. Buscar usuário por firebase_uid
    console.log('\n1. Buscando usuário...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single()
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError)
      return
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado')
      return
    }
    
    console.log('✅ Usuário encontrado:')
    console.log('   - ID Supabase:', user.id)
    console.log('   - Email:', user.email)
    console.log('   - Firebase UID:', user.firebase_uid)
    
    // 2. Tentar criar uma meta de teste
    console.log('\n2. Criando meta de teste...')
    
    const goalData = {
      user_id: user.id, // Usar o UUID do Supabase
      name: 'Meta de Teste - Debug',
      description: 'Meta criada para testar sincronização',
      category: 'financial',
      type: 'savings',
      target_value: 1000,
      current_value: 0,
      unit: 'BRL',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      created_date: new Date(),
      priority: 'medium',
      status: 'active',
      notes: 'Meta criada via script de debug',
      tags: ['teste', 'debug']
    }
    
    console.log('📝 Dados da meta:', JSON.stringify(goalData, null, 2))
    
    const { data: goal, error: goalError } = await supabaseAdmin
      .from('goals')
      .insert(goalData)
      .select()
      .single()
    
    if (goalError) {
      console.error('❌ Erro ao criar meta:', goalError)
      console.error('   - Código:', goalError.code)
      console.error('   - Mensagem:', goalError.message)
      console.error('   - Detalhes:', goalError.details)
      console.error('   - Hint:', goalError.hint)
      return
    }
    
    console.log('✅ Meta criada com sucesso!')
    console.log('   - ID:', goal.id)
    console.log('   - Nome:', goal.name)
    console.log('   - User ID:', goal.user_id)
    
    // 3. Verificar se a meta foi salva corretamente
    console.log('\n3. Verificando meta criada...')
    
    const { data: savedGoal, error: fetchError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('id', goal.id)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar meta criada:', fetchError)
    } else {
      console.log('✅ Meta encontrada no banco:')
      console.log('   - ID:', savedGoal.id)
      console.log('   - Nome:', savedGoal.name)
      console.log('   - Status:', savedGoal.status)
    }
    
    // 4. Limpar - deletar a meta de teste
    console.log('\n4. Limpando meta de teste...')
    
    const { error: deleteError } = await supabaseAdmin
      .from('goals')
      .delete()
      .eq('id', goal.id)
    
    if (deleteError) {
      console.error('❌ Erro ao deletar meta de teste:', deleteError)
    } else {
      console.log('✅ Meta de teste removida com sucesso')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
  
  console.log('\n--- DIAGNÓSTICO COMPLETO ---')
  console.log('Se chegou até aqui sem erros, o problema pode ser:')
  console.log('1. Contexto de execução (browser vs server)')
  console.log('2. Políticas RLS diferentes para operações do cliente')
  console.log('3. Configuração incorreta do cliente Supabase no frontend')
  console.log('4. Problema de timing ou estado da aplicação')
}

testGoalCreation().catch(console.error)