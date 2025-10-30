const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAuthUsers() {
  try {
    console.log('Verificando usuários autenticados...\n')
    
    // Listar usuários usando Admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return
    }
    
    console.log(`Encontrados ${users.length} usuários autenticados:`)
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Criado em: ${user.created_at}`)
      console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}`)
      console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`)
    })
    
    if (users.length > 0) {
      console.log(`\nVou usar o primeiro usuário (${users[0].id}) para criar metas de exemplo.`)
      return users[0].id
    }
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

checkAuthUsers()