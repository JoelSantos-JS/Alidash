const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyGoals() {
  try {
    console.log('Verificando metas no banco de dados...')
    
    // Buscar todas as metas
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar metas:', error)
      return
    }
    
    console.log(`\nEncontradas ${goals.length} metas:`)
    goals.forEach((goal, index) => {
      console.log(`\n${index + 1}. ${goal.name}`)
      console.log(`   ID: ${goal.id}`)
      console.log(`   User ID: ${goal.user_id}`)
      console.log(`   Valor atual: R$ ${goal.current_value}`)
      console.log(`   Valor meta: R$ ${goal.target_value}`)
      console.log(`   Tipo: ${goal.type}`)
      console.log(`   Unidade: ${goal.unit}`)
      console.log(`   Prazo: ${goal.deadline}`)
      console.log(`   Criado em: ${goal.created_at}`)
    })
    
    // Verificar usuários únicos
    const uniqueUsers = [...new Set(goals.map(g => g.user_id))]
    console.log(`\nUsuários com metas: ${uniqueUsers.length}`)
    uniqueUsers.forEach(userId => {
      const userGoals = goals.filter(g => g.user_id === userId)
      console.log(`- ${userId}: ${userGoals.length} metas`)
    })
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

verifyGoals()
