require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fetchFn() {
  const mod = await import('node-fetch')
  return mod.default
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const now = Date.now()

  const mkUser = async (email, accountType, daysAgo) => {
    const ts = new Date(now - daysAgo * 86400000).toISOString()
    const { data, error } = await supabase
      .from('users')
      .insert({ email, name: 'Teste', account_type: accountType, created_at: ts })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const freeNew = await mkUser(`free-new-${now}@example.com`, 'personal', 1)
  const freeOld = await mkUser(`free-old-${now}@example.com`, 'personal', 5)
  const paidOld = await mkUser(`paid-old-${now}@example.com`, 'pro', 10)

  console.log('DEBUG users created', {
    freeNew: { id: freeNew.id, account_type: freeNew.account_type, created_at: freeNew.created_at, plan_started_at: freeNew.plan_started_at },
    freeOld: { id: freeOld.id, account_type: freeOld.account_type, created_at: freeOld.created_at, plan_started_at: freeOld.plan_started_at },
    paidOld: { id: paidOld.id, account_type: paidOld.account_type, created_at: paidOld.created_at, plan_started_at: paidOld.plan_started_at }
  })

  const base = 'http://localhost:3001'
  const post = async (url, body) => {
    const f = await fetchFn()
    const res = await f(`${base}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    return { status: res.status, body: json }
  }

  const results = []
  results.push({ name: 'income-free-new', ...(await post('/api/personal/incomes', { user_id: freeNew.id, date: '2025-01-01', description: 't', amount: 10, category: 'other', source: 't' })) })
  results.push({ name: 'income-free-old', ...(await post('/api/personal/incomes', { user_id: freeOld.id, date: '2025-01-01', description: 't', amount: 10, category: 'other', source: 't' })) })
  results.push({ name: 'expense-free-new', ...(await post('/api/personal/expenses', { user_id: freeNew.id, date: '2025-01-01', description: 't', amount: 10, category: 'other', payment_method: 'cash' })) })
  results.push({ name: 'expense-free-old', ...(await post('/api/personal/expenses', { user_id: freeOld.id, date: '2025-01-01', description: 't', amount: 10, category: 'other', payment_method: 'cash' })) })
  results.push({ name: 'goal-free-old', ...(await post('/api/personal/goals', { user_id: freeOld.id, name: 'Meta', type: 'savings', target_amount: 100, deadline: '2025-12-31' })) })
  results.push({ name: 'salary-settings-free-old', ...(await post('/api/personal/salary-settings', { user_id: freeOld.id, amount: 1000, description: 'Salário', payment_day: 5, source: 'emprego' })) })
  results.push({ name: 'salary-automation-free-old', ...(await post('/api/personal/salary-automation', { user_id: freeOld.id, month: 1, year: 2025 })) })
  results.push({ name: 'income-paid-old', ...(await post('/api/personal/incomes', { user_id: paidOld.id, date: '2025-01-01', description: 't', amount: 10, category: 'other', source: 't' })) })

  console.log(JSON.stringify(results, null, 2))

  await supabase.from('users').delete().eq('id', freeNew.id)
  await supabase.from('users').delete().eq('id', freeOld.id)
  await supabase.from('users').delete().eq('id', paidOld.id)
}

main().catch(err => { console.error(err); process.exit(1) })
