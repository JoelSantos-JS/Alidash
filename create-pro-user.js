require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function ensureAuthUser(email, password, name) {
  // Tenta criar; se já existir, atualiza a senha e retorna UID
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || null }
  })
  if (!createErr && created?.user?.id) {
    return created.user.id
  }
  // Se falhou por já existir, buscar na lista e atualizar senha
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) throw new Error(`Erro ao listar usuários: ${listErr.message}`)
  const found = list.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
  if (!found) throw new Error(`Usuário de auth não encontrado para ${email}`)
  const uid = found.id
  const { error: updErr } = await supabase.auth.admin.updateUserById(uid, { password })
  if (updErr) {
    console.warn(`⚠️ Falha ao atualizar senha: ${updErr.message}`)
  }
  return uid
}

async function upsertLocalUser(uid, email, name) {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: uid,
      email,
      name: name || email.split('@')[0],
      account_type: 'pro',
      updated_at: nowIso,
      created_at: nowIso,
      firebase_uid: uid
    })
    .select()
    .single()
  if (error) {
    console.warn(`⚠️ Upsert em users falhou: ${error.message}`)
  }
  return data
}

async function ensureBudget(uid, monthlyBudget) {
  const { data: existing, error: getErr } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', uid)
    .single()
  if (!getErr && existing?.id) {
    return existing.id
  }
  const { data: budget, error: insErr } = await supabase
    .from('budgets')
    .insert({ user_id: uid, monthly_budget: monthlyBudget })
    .select()
    .single()
  if (insErr) {
    console.warn(`⚠️ Erro ao criar orçamento: ${insErr.message}`)
    return null
  }
  return budget?.id || null
}

async function main() {
  const email = process.env.PRO_USER_EMAIL || process.argv[2]
  const password = process.env.PRO_USER_PASSWORD || process.argv[3]
  const name = process.env.PRO_USER_NAME || 'Joel'
  const monthlyBudget = Number(process.env.PRO_MONTHLY_BUDGET || 600)

  if (!email || !password) {
    console.error('❌ PRO_USER_EMAIL e PRO_USER_PASSWORD são obrigatórios')
    process.exit(1)
  }

  console.log('👤 Criando/atualizando usuário PRO:', email)
  try {
    const uid = await ensureAuthUser(email, password, name)
    console.log('✅ Auth UID:', uid)

    const localUser = await upsertLocalUser(uid, email, name)
    if (localUser?.id) {
      console.log('✅ Users upsert:', localUser.id)
    }

    const budgetId = await ensureBudget(uid, monthlyBudget)
    if (budgetId) {
      console.log('✅ Orçamento pronto:', budgetId)
    }

    console.log('🏁 Concluído')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro:', err.message || String(err))
    process.exit(1)
  }
}

main()
