require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function countTable(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  if (error) {
    console.log(`⚠️ Erro ao contar ${table}: ${error.message}`)
    return null
  }
  return count ?? 0
}

async function main() {
  console.log('🚨 Reset total de usuários e dados relacionados')

  const { error: delError } = await supabase
    .from('users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.error('❌ Erro ao deletar usuários:', delError.message)
    process.exit(1)
  }
  console.log('✅ Usuários apagados')

  const tables = [
    'users',
    'products',
    'sales',
    'transactions',
    'debts',
    'debt_payments',
    'goals',
    'goal_milestones',
    'goal_reminders',
    'dreams',
    'bets',
    'revenues',
    'expenses',
    'budgets'
  ]
  console.log('🔎 Verificando tabelas principais:')
  for (const t of tables) {
    const c = await countTable(t)
    if (c !== null) console.log(`   ${t}: ${c}`)
  }

  console.log('👤 Criando usuário de teste')
  const email = 'test.reset@example.com'
  const password = 'Test1234!'
  const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (authErr) {
    console.error('❌ Erro ao criar usuário de autenticação:', authErr.message)
    process.exit(1)
  }
  const authId = createdAuth.user.id
  console.log('✅ Usuário auth criado:', authId)

  const { data: localUser, error: insertErr } = await supabase
    .from('users')
    .insert({
      id: authId,
      email,
      name: 'Usuário Teste Reset',
      account_type: 'personal',
      firebase_uid: authId
    })
    .select()
    .single()
  if (insertErr) {
    console.error('❌ Erro ao inserir usuário em users:', insertErr.message)
    process.exit(1)
  }
  console.log('✅ Usuário local criado:', localUser.id)

  const { data: budget, error: budgetErr } = await supabase
    .from('budgets')
    .insert({
      user_id: authId,
      monthly_budget: 600.0
    })
    .select()
    .single()
  if (budgetErr) {
    console.log('⚠️ Falha ao criar orçamento padrão:', budgetErr.message)
  } else {
    console.log('✅ Orçamento padrão criado:', budget.id)
  }

  console.log('🏁 Concluído')
}

main()
