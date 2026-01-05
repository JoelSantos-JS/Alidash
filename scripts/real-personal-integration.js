const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const { createClient } = require('@supabase/supabase-js')
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
async function run() {
  const fetchImpl = global.fetch || (await import('node-fetch')).default
  const adminSignup = async (email, password, name) => {
    const res = await fetchImpl(`${baseUrl}/api/auth/admin-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data }
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const email = `integration.${Date.now()}@example.com`
  const password = 'Test1234!'
  const signupRes = await adminSignup(email, password, 'Integration')
  if (!(signupRes.status >= 200 && signupRes.status < 300)) {
    console.log('admin-signup failed', signupRes.status, signupRes.data)
    process.exit(1)
  }
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError || !signInData?.session?.access_token || !signInData?.user?.id) {
    console.log('signIn error', signInError?.message)
    process.exit(1)
  }
  const userId = signInData.user.id
  const cookieHeader = `sb-access-token=${signInData.session.access_token}; sb-refresh-token=${signInData.session.refresh_token}`
  const req = async (method, path, body) => {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader } }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetchImpl(`${baseUrl}${path}`, opts)
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data }
  }
  const incomesRecent = await req('GET', `/api/personal/incomes/recent?user_id=${userId}&limit=4`)
  console.log('incomes/recent', incomesRecent.status, Array.isArray(incomesRecent.data?.incomes) ? incomesRecent.data.incomes.length : 0)
  const incomePayload = { user_id: userId, date: new Date().toISOString().slice(0, 10), description: 'Integração Receita', amount: 123.45, category: 'other', source: 'integration' }
  const incomeCreate = await req('POST', `/api/personal/incomes`, incomePayload)
  console.log('incomes POST', incomeCreate.status, !!incomeCreate.data?.income?.id)
  const incomeId = incomeCreate.data?.income?.id
  const incomesList = await req('GET', `/api/personal/incomes?user_id=${userId}&limit=10`)
  console.log('incomes GET', incomesList.status, Array.isArray(incomesList.data?.incomes) ? incomesList.data.incomes.length : 0)
  if (incomeId) {
    const incomeDelete = await req('DELETE', `/api/personal/incomes?id=${incomeId}&user_id=${userId}`)
    console.log('incomes DELETE', incomeDelete.status, incomeDelete.data?.success ?? true)
  }
  const expensePayload = { user_id: userId, date: new Date().toISOString().slice(0, 10), description: 'Integração Despesa', amount: 67.89, category: 'other', payment_method: 'cash' }
  const expenseCreate = await req('POST', `/api/personal/expenses`, expensePayload)
  console.log('expenses POST', expenseCreate.status, !!expenseCreate.data?.expense?.id)
  const expenseId = expenseCreate.data?.expense?.id
  const expensesList = await req('GET', `/api/personal/expenses?user_id=${userId}&limit=10`)
  console.log('expenses GET', expensesList.status, Array.isArray(expensesList.data?.expenses) ? expensesList.data.expenses.length : 0)
  if (expenseId) {
    const expenseDelete = await req('DELETE', `/api/personal/expenses?id=${expenseId}&user_id=${userId}`)
    console.log('expenses DELETE', expenseDelete.status, expenseDelete.data?.error ? false : true)
  }
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const budgetPayload = { user_id: userId, month, year, total_budget: 1000 }
  const budgetRes = await req('POST', `/api/personal/budgets`, budgetPayload)
  console.log('budgets POST', budgetRes.status, !!budgetRes.data?.budget?.id)
  const goalPayload = { user_id: userId, name: 'Meta Integração', type: 'saving', target_amount: 500, deadline: `${year + 1}-12-31` }
  const goalRes = await req('POST', `/api/personal/goals`, goalPayload)
  console.log('goals POST', goalRes.status, !!goalRes.data?.goal?.id)
  const goalId = goalRes.data?.goal?.id
  if (goalId) {
    const goalDelete = await req('DELETE', `/api/personal/goals?id=${goalId}&user_id=${userId}`)
    console.log('goals DELETE', goalDelete.status, goalDelete.data?.error ? false : true)
  }
  const salaryPayload = { user_id: userId, amount: 2500.5, description: 'Salário Integração', payment_day: 5, source: 'emprego' }
  const salaryRes = await req('POST', `/api/personal/salary-settings`, salaryPayload)
  console.log('salary-settings POST', salaryRes.status, !!salaryRes.data?.settings?.id || salaryRes.data?.settings !== undefined)
  const salaryDel = await req('DELETE', `/api/personal/salary-settings?user_id=${userId}`)
  console.log('salary-settings DELETE', salaryDel.status, salaryDel.data?.error ? false : true)
  const mismatchRes = await req('GET', `/api/personal/incomes?user_id=other&limit=4`)
  console.log('incomes GET mismatch', mismatchRes.status, mismatchRes.data?.error || '')
}
run().catch((e) => { console.error(e); process.exit(1) })
