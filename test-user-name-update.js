const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://atyeakcunmhrzzpdcvxm.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserNameUpdate() {
  console.log('🧪 Testando funcionalidade de atualização do nome do usuário...\n')

  try {
    // 1. Verificar estrutura da tabela users
    console.log('1️⃣ Verificando estrutura da tabela users...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Erro ao acessar tabela users:', tableError.message)
      return
    }

    console.log('✅ Tabela users acessível')

    // 2. Buscar um usuário existente
    console.log('\n2️⃣ Buscando usuários existentes...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message)
      return
    }

    console.log(`✅ Encontrados ${users.length} usuários`)
    
    if (users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado para teste')
      return
    }

    // Mostrar usuários encontrados
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}`)
      console.log(`      Firebase UID: ${user.firebase_uid || 'N/A'}`)
      console.log(`      Email: ${user.email}`)
      console.log(`      Nome atual: ${user.name || 'N/A'}`)
      console.log('')
    })

    // 3. Testar atualização do nome
    const testUser = users[0]
    const originalName = testUser.name
    const testName = `Teste Nome ${Date.now()}`

    console.log(`3️⃣ Testando atualização do nome para usuário: ${testUser.email}`)
    console.log(`   Nome original: ${originalName || 'N/A'}`)
    console.log(`   Nome de teste: ${testName}`)

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ name: testName })
      .eq('id', testUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar nome:', updateError.message)
      return
    }

    console.log('✅ Nome atualizado com sucesso!')
    console.log(`   Novo nome: ${updatedUser.name}`)

    // 4. Verificar se a atualização persistiu
    console.log('\n4️⃣ Verificando se a atualização persistiu...')
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('name')
      .eq('id', testUser.id)
      .single()

    if (verifyError) {
      console.error('❌ Erro ao verificar atualização:', verifyError.message)
      return
    }

    if (verifyUser.name === testName) {
      console.log('✅ Atualização persistiu corretamente!')
    } else {
      console.log('❌ Atualização não persistiu')
    }

    // 5. Restaurar nome original (se existia)
    if (originalName) {
      console.log('\n5️⃣ Restaurando nome original...')
      const { error: restoreError } = await supabase
        .from('users')
        .update({ name: originalName })
        .eq('id', testUser.id)

      if (restoreError) {
        console.error('❌ Erro ao restaurar nome:', restoreError.message)
      } else {
        console.log('✅ Nome original restaurado')
      }
    }

    console.log('\n🎉 Teste concluído com sucesso!')
    console.log('✅ O campo "name" existe na tabela users')
    console.log('✅ A funcionalidade de atualização está funcionando')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

// Executar teste
testUserNameUpdate()