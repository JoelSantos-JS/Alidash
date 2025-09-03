const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  console.log('SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserSync() {
  const firebaseUid = '1sAltLnRMgO3ZCYnh4zn9iFck0B3'
  
  console.log('🔍 Investigando problema de sincronização do usuário')
  console.log('Firebase UID:', firebaseUid)
  console.log('\n--- DIAGNÓSTICO ---')
  
  try {
    // 1. Verificar se o usuário existe no Supabase
    console.log('\n1. Buscando usuário por firebase_uid...')
    const { data: userByFirebaseUid, error: errorByFirebaseUid } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single()
    
    if (errorByFirebaseUid && errorByFirebaseUid.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar por firebase_uid:', errorByFirebaseUid)
    } else if (userByFirebaseUid) {
      console.log('✅ Usuário encontrado por firebase_uid:')
      console.log('   - ID:', userByFirebaseUid.id)
      console.log('   - Email:', userByFirebaseUid.email)
      console.log('   - Nome:', userByFirebaseUid.name)
      console.log('   - Firebase UID:', userByFirebaseUid.firebase_uid)
      console.log('   - Criado em:', userByFirebaseUid.created_at)
    } else {
      console.log('❌ Usuário NÃO encontrado por firebase_uid')
    }
    
    // 2. Listar todos os usuários para verificar se existe com outro firebase_uid
    console.log('\n2. Listando todos os usuários...')
    const { data: allUsers, error: errorAllUsers } = await supabase
      .from('users')
      .select('id, email, name, firebase_uid, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (errorAllUsers) {
      console.error('❌ Erro ao listar usuários:', errorAllUsers)
    } else {
      console.log(`📊 Total de usuários encontrados: ${allUsers?.length || 0}`)
      allUsers?.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`)
        console.log(`      Email: ${user.email}`)
        console.log(`      Nome: ${user.name}`)
        console.log(`      Firebase UID: ${user.firebase_uid}`)
        console.log(`      Criado: ${user.created_at}`)
        console.log('')
      })
    }
    
    // 3. Verificar se existe usuário com email similar
    console.log('\n3. Verificando possíveis duplicatas ou problemas...')
    
    if (allUsers && allUsers.length > 0) {
      const usersWithSameFirebaseUid = allUsers.filter(u => u.firebase_uid === firebaseUid)
      const usersWithoutFirebaseUid = allUsers.filter(u => !u.firebase_uid)
      
      console.log(`   - Usuários com mesmo firebase_uid: ${usersWithSameFirebaseUid.length}`)
      console.log(`   - Usuários sem firebase_uid: ${usersWithoutFirebaseUid.length}`)
      
      if (usersWithoutFirebaseUid.length > 0) {
        console.log('\n   ⚠️  Usuários sem firebase_uid encontrados:')
        usersWithoutFirebaseUid.forEach(user => {
          console.log(`      - ${user.email} (ID: ${user.id})`)
        })
      }
    }
    
    // 4. Verificar estrutura da tabela users
    console.log('\n4. Verificando estrutura da tabela users...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => {
        // Se a função RPC não existir, tentar uma consulta simples
        return supabase.from('users').select('*').limit(1)
      })
    
    if (!tableError && tableInfo) {
      console.log('✅ Tabela users acessível')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
  
  console.log('\n--- RECOMENDAÇÕES ---')
  console.log('1. Verificar se o usuário foi criado corretamente no Supabase')
  console.log('2. Verificar se as políticas RLS estão permitindo acesso')
  console.log('3. Verificar se o firebase_uid está sendo salvo corretamente')
  console.log('4. Considerar migração/sincronização manual se necessário')
}

debugUserSync().catch(console.error)