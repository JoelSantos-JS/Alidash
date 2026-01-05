const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllTables() {
  try {
    console.log('Verificando tabelas relacionadas a metas...\n')
    
    // Verificar tabela goals
    console.log('1. Verificando tabela "goals":')
    try {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .limit(5)
      
      if (goalsError) {
        console.log(`   Erro: ${goalsError.message}`)
      } else {
        console.log(`   ✓ Tabela existe - ${goals.length} registros encontrados`)
        if (goals.length > 0) {
          console.log(`   Exemplo: ${JSON.stringify(goals[0], null, 2)}`)
        }
      }
    } catch (error) {
      console.log(`   Erro ao acessar: ${error.message}`)
    }
    
    // Verificar tabela personal_goals
    console.log('\n2. Verificando tabela "personal_goals":')
    try {
      const { data: personalGoals, error: personalGoalsError } = await supabase
        .from('personal_goals')
        .select('*')
        .limit(5)
      
      if (personalGoalsError) {
        console.log(`   Erro: ${personalGoalsError.message}`)
      } else {
        console.log(`   ✓ Tabela existe - ${personalGoals.length} registros encontrados`)
        if (personalGoals.length > 0) {
          console.log(`   Exemplo: ${JSON.stringify(personalGoals[0], null, 2)}`)
        }
      }
    } catch (error) {
      console.log(`   Erro ao acessar: ${error.message}`)
    }
    
    // Verificar usuários
    console.log('\n3. Verificando usuários:')
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .limit(3)
      
      if (usersError) {
        console.log(`   Erro: ${usersError.message}`)
      } else {
        console.log(`   ✓ ${users.length} usuários encontrados`)
        users.forEach(user => {
          console.log(`   - ${user.id} (${user.email || 'sem email'})`)
        })
      }
    } catch (error) {
      console.log(`   Erro ao acessar: ${error.message}`)
    }
    
  } catch (error) {
    console.error('Erro geral:', error)
  }
}

checkAllTables()
