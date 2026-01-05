'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-supabase-auth'

export default function DevPessoalTestsPage() {
  const { user, loading } = useAuth()
  const [logs, setLogs] = useState<string[]>([])
  const addLog = (m: string) => setLogs((prev) => [m, ...prev].slice(0, 100))
  const call = async (method: string, path: string, body?: any) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
    let j: any = null
    try { j = await res.json() } catch {}
    return { status: res.status, data: j }
  }
  const runIncomes = async () => {
    if (!user?.id) return
    const recent = await call('GET', `/api/personal/incomes/recent?user_id=${user.id}&limit=4`)
    addLog(`incomes/recent ${recent.status} ${Array.isArray(recent.data?.incomes) ? recent.data.incomes.length : 0}`)
    const payload = { user_id: user.id, date: new Date().toISOString().slice(0, 10), description: 'Teste Receita', amount: 123.45, category: 'other', source: 'integration' }
    const create = await call('POST', `/api/personal/incomes`, payload)
    addLog(`incomes POST ${create.status} ${!!create.data?.income?.id}`)
    const id = create.data?.income?.id
    const list = await call('GET', `/api/personal/incomes?user_id=${user.id}&limit=10`)
    addLog(`incomes GET ${list.status} ${Array.isArray(list.data?.incomes) ? list.data.incomes.length : 0}`)
    if (id) {
      const del = await call('DELETE', `/api/personal/incomes?id=${id}&user_id=${user.id}`)
      addLog(`incomes DELETE ${del.status} ${del.data?.success ?? true}`)
    }
    const mismatch = await call('GET', `/api/personal/incomes?user_id=other&limit=4`)
    addLog(`incomes mismatch ${mismatch.status}`)
  }
  const runExpenses = async () => {
    if (!user?.id) return
    const payload = { user_id: user.id, date: new Date().toISOString().slice(0, 10), description: 'Teste Despesa', amount: 67.89, category: 'other', payment_method: 'cash' }
    const create = await call('POST', `/api/personal/expenses`, payload)
    addLog(`expenses POST ${create.status} ${!!create.data?.expense?.id}`)
    const id = create.data?.expense?.id
    const list = await call('GET', `/api/personal/expenses?user_id=${user.id}&limit=10`)
    addLog(`expenses GET ${list.status} ${Array.isArray(list.data?.expenses) ? list.data.expenses.length : 0}`)
    if (id) {
      const del = await call('DELETE', `/api/personal/expenses?id=${id}&user_id=${user.id}`)
      addLog(`expenses DELETE ${del.status} ${del.data?.error ? false : true}`)
    }
  }
  const runBudgets = async () => {
    if (!user?.id) return
    const now = new Date()
    const payload = { user_id: user.id, month: now.getMonth() + 1, year: now.getFullYear(), total_budget: 1000 }
    const res = await call('POST', `/api/personal/budgets`, payload)
    addLog(`budgets POST ${res.status} ${!!res.data?.budget?.id}`)
  }
  const runGoals = async () => {
    if (!user?.id) return
    const now = new Date()
    const payload = { user_id: user.id, name: 'Meta Dev', type: 'saving', target_amount: 500, deadline: `${now.getFullYear() + 1}-12-31` }
    const res = await call('POST', `/api/personal/goals`, payload)
    addLog(`goals POST ${res.status} ${!!res.data?.goal?.id}`)
    const id = res.data?.goal?.id
    if (id) {
      const del = await call('DELETE', `/api/personal/goals?id=${id}&user_id=${user.id}`)
      addLog(`goals DELETE ${del.status} ${del.data?.error ? false : true}`)
    }
  }
  const runSalary = async () => {
    if (!user?.id) return
    const payload = { user_id: user.id, amount: 2500.5, description: 'Salário Dev', payment_day: 5, source: 'emprego' }
    const res = await call('POST', `/api/personal/salary-settings`, payload)
    addLog(`salary-settings POST ${res.status} ${!!res.data?.settings?.id || res.data?.settings !== undefined}`)
    const del = await call('DELETE', `/api/personal/salary-settings?user_id=${user.id}`)
    addLog(`salary-settings DELETE ${del.status} ${del.data?.error ? false : true}`)
  }
  if (loading) return <div className="p-6 text-white">Carregando...</div>
  if (!user) return <div className="p-6 text-white">Faça login</div>
  return (
    <div className="min-h-screen bg-[#0e244a] text-white p-6 space-y-4">
      <h1 className="text-2xl font-bold">Testes Reais Pessoais</h1>
      <div className="flex gap-2 flex-wrap">
        <button onClick={runIncomes} className="px-3 py-2 bg-blue-600 rounded">Receitas</button>
        <button onClick={runExpenses} className="px-3 py-2 bg-indigo-600 rounded">Despesas</button>
        <button onClick={runBudgets} className="px-3 py-2 bg-teal-600 rounded">Orçamentos</button>
        <button onClick={runGoals} className="px-3 py-2 bg-violet-600 rounded">Metas</button>
        <button onClick={runSalary} className="px-3 py-2 bg-fuchsia-600 rounded">Salário</button>
      </div>
      <div className="space-y-2">
        {logs.map((l, i) => <div key={i} className="text-sm">{l}</div>)}
      </div>
    </div>
  )
}
