const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIzNDEsImV4cCI6MjA3MTQ0ODM0MX0.qFHcONpGQVAwWfMhCdh2kX5ZNBk5qtNM1M7_GS-LXZ4'

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