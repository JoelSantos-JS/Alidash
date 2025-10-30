require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkGoals() {
  try {
    console.log('🔍 Verificando tabela goals...')
    
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Erro ao consultar goals:', error.message)
      return
    }
    
    console.log('✅ Dados encontrados:', data.length, 'metas')
    
    if (data.length > 0) {
      console.log('🔍 Primeira meta:', JSON.stringify(data[0], null, 2))
    } else {
      console.log('⚠️ Nenhuma meta encontrada na tabela')
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message)
  }
}

checkGoals()