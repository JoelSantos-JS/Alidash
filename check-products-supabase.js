const { createClient } = require('@supabase/supabase-js')

// Usar as variáveis diretamente do .env.local
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProductsData() {
  try {
    console.log('🔍 Verificando dados na tabela products...')
    
    // 1. Verificar se a tabela products existe e tem dados
    const { data: products, error: productsError, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .limit(5)

    if (productsError) {
      console.error('❌ Erro ao acessar tabela products:', productsError.message)
      return
    }

    console.log(`📊 Total de produtos na tabela: ${count}`)
    
    if (products && products.length > 0) {
      console.log('✅ Produtos encontrados:')
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Usuário: ${product.user_id}`)
      })
    } else {
      console.log('⚠️ Nenhum produto encontrado na tabela')
    }

    // 2. Verificar usuários na tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError.message)
      return
    }

    console.log(`\n👥 Usuários encontrados: ${users?.length || 0}`)
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - Firebase UID: ${user.firebase_uid}`)
      })
    }

    // 3. Verificar produtos por usuário específico (se houver)
    if (users && users.length > 0) {
      const firstUser = users[0]
      const { data: userProducts, error: userProductsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', firstUser.id)

      if (!userProductsError) {
        console.log(`\n📦 Produtos do usuário ${firstUser.email}: ${userProducts?.length || 0}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

checkProductsData()
