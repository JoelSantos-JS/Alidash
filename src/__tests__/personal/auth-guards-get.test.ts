import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'u1' }

const makeBuilder = (table: string) => {
  const state: any = { table, filters: {}, orderBy: null as null | { col: string, asc: boolean }, limitN: null as number | null }
  const applyFilters = (rows: any[]) => {
    return rows
      .filter(row => Object.keys(state.filters).every((k) => row[k] === state.filters[k]))
      .slice(0, state.limitN ?? rows.length)
  }
  const builder: any = {
    select: () => builder,
    eq: (col: string, val: any) => { state.filters[col] = val; return builder },
    order: (col: string, opts: any) => { state.orderBy = { col, asc: !!(opts?.ascending) }; return builder },
    limit: (n: number) => { state.limitN = n; return builder },
    gte: () => builder,
    lte: () => builder,
    single: async () => {
      const rows = state.table === 'personal_incomes' ? [{ id: 'inc_1', user_id: mockAuthUser.id, description: 'Teste', amount: 10, category: 'other', date: '2025-01-01' }]
        : state.table === 'personal_expenses' ? [{ id: 'exp_1', user_id: mockAuthUser.id, description: 'Teste', amount: 10, category: 'other', date: '2025-01-01', payment_method: 'cash' }]
        : []
      const data = applyFilters(rows)[0] || null
      return { data, error: null }
    },
    then: (resolve: any) => {
      const rows = state.table === 'personal_incomes' ? [
        { id: 'inc_1', user_id: mockAuthUser.id, description: 'Teste', amount: 10, category: 'other', date: '2025-01-01' }
      ] : state.table === 'personal_expenses' ? [
        { id: 'exp_1', user_id: mockAuthUser.id, description: 'Teste', amount: 10, category: 'other', date: '2025-01-01', payment_method: 'cash' }
      ] : state.table === 'personal_incomes' ? [] : []
      return resolve({ data: applyFilters(rows), error: null })
    }
  }
  return builder
}

jest.mock('@/utils/supabase/server', () => {
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: mockAuthUser }, error: null })
      },
      from: (table: string) => makeBuilder(table)
    })
  }
})

beforeEach(() => {
  jest.resetModules()
  mockAuthUser = { id: 'u1' }
})

describe('Auth guards nos GET pessoais', () => {
  it('expenses/recent retorna 401 quando user mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const route = require('@/app/api/personal/expenses/recent/route')
    const req = { url: 'http://x/api/personal/expenses/recent?user_id=u1&limit=4' }
    const res = await (route as any).GET(req as any)
    expect(res.status).toBe(401)
  })

  it('incomes/recent retorna 401 quando user mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const route = require('@/app/api/personal/incomes/recent/route')
    const req = { url: 'http://x/api/personal/incomes/recent?user_id=u1&limit=4' }
    const res = await (route as any).GET(req as any)
    expect(res.status).toBe(401)
  })

  it('summary retorna 401 quando user mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const route = require('@/app/api/personal/summary/route')
    const req = { url: 'http://x/api/personal/summary?user_id=u1&month=1&year=2025' }
    const res = await (route as any).GET(req as any)
    expect(res.status).toBe(401)
  })

  it('expenses/recent retorna 200 quando autenticado corretamente', async () => {
    mockAuthUser = { id: 'u1' }
    const route = require('@/app/api/personal/expenses/recent/route')
    const req = { url: 'http://x/api/personal/expenses/recent?user_id=u1&limit=4' }
    const res = await (route as any).GET(req as any)
    expect(res.status).toBe(200)
  })

  it('incomes/recent retorna 200 quando autenticado corretamente', async () => {
    mockAuthUser = { id: 'u1' }
    const route = require('@/app/api/personal/incomes/recent/route')
    const req = { url: 'http://x/api/personal/incomes/recent?user_id=u1&limit=4' }
    const res = await (route as any).GET(req as any)
    expect(res.status).toBe(200)
  })
 
   it('incomes GET retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/incomes/route')
     const req = { url: 'http://x/api/personal/incomes?user_id=u1&limit=10' }
     const res = await (route as any).GET(req as any)
     expect(res.status).toBe(401)
   })
 
   it('expenses GET retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/expenses/route')
     const req = { url: 'http://x/api/personal/expenses?user_id=u1&limit=10' }
     const res = await (route as any).GET(req as any)
     expect(res.status).toBe(401)
   })
 
   it('incomes POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/incomes/route')
     const body = { user_id: 'u1', date: '2025-01-01', description: 'X', amount: 10, category: 'other', source: 'test' }
     const req = { url: 'http://x/api/personal/incomes', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('expenses POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/expenses/route')
     const body = { user_id: 'u1', date: '2025-01-01', description: 'X', amount: 10, category: 'other', payment_method: 'cash' }
     const req = { url: 'http://x/api/personal/expenses', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('incomes DELETE retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/incomes/route')
     const req = { url: 'http://x/api/personal/incomes?id=inc_1&user_id=u1' }
     const res = await (route as any).DELETE(req as any)
     expect(res.status).toBe(401)
   })
 
   it('expenses DELETE retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/expenses/route')
     const req = { url: 'http://x/api/personal/expenses?id=exp_1&user_id=u1' }
     const res = await (route as any).DELETE(req as any)
     expect(res.status).toBe(401)
   })
 
   it('incomes [id] PUT retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/incomes/[id]/route')
     const body = { user_id: 'u1', date: '2025-01-01', description: 'X', amount: 10, category: 'other', source: 'test' }
     const req = { url: 'http://x/api/personal/incomes/inc_1', json: async () => body }
     const res = await (route as any).PUT(req as any, { params: { id: 'inc_1' } })
     expect(res.status).toBe(401)
   })
 
   it('expenses [id] PUT retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/expenses/[id]/route')
     const body = { user_id: 'u1', date: '2025-01-01', description: 'X', amount: 10, category: 'other', payment_method: 'cash' }
     const req = { url: 'http://x/api/personal/expenses/exp_1', json: async () => body }
     const res = await (route as any).PUT(req as any, { params: { id: 'exp_1' } })
     expect(res.status).toBe(401)
   })
 
   it('goals POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/goals/route')
     const body = { user_id: 'u1', name: 'Meta', type: 'saving', target_amount: 100, deadline: '2025-12-31' }
     const req = { url: 'http://x/api/personal/goals', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('goals DELETE retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/goals/route')
     const req = { url: 'http://x/api/personal/goals?id=g1&user_id=u1' }
     const res = await (route as any).DELETE(req as any)
     expect(res.status).toBe(401)
   })
 
   it('categories POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/categories/route')
     const body = { user_id: 'u1', name: 'Teste', type: 'expense', category: 'other', color: '#000', icon: 'x' }
     const req = { url: 'http://x/api/personal/categories', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('categories PUT retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/categories/route')
     const body = { id: 'c1', user_id: 'u1', name: 'Teste' }
     const req = { url: 'http://x/api/personal/categories', json: async () => body }
     const res = await (route as any).PUT(req as any)
     expect(res.status).toBe(401)
   })
 
   it('categories DELETE retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/categories/route')
     const req = { url: 'http://x/api/personal/categories?id=c1&user_id=u1' }
     const res = await (route as any).DELETE(req as any)
     expect(res.status).toBe(401)
   })
 
   it('budgets POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/budgets/route')
     const body = { user_id: 'u1', month: 1, year: 2025, total_budget: 1000 }
     const req = { url: 'http://x/api/personal/budgets', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('budgets PUT retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/budgets/route')
     const body = { user_id: 'u1', month: 1, year: 2025, total_budget: 1000 }
     const req = { url: 'http://x/api/personal/budgets', json: async () => body }
     const res = await (route as any).PUT(req as any)
     expect(res.status).toBe(401)
   })
 
   it('salary-settings POST retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/salary-settings/route')
     const body = { user_id: 'u1', amount: 1000, description: 'Salário', payment_day: 5, source: 'emprego' }
     const req = { url: 'http://x/api/personal/salary-settings', json: async () => body }
     const res = await (route as any).POST(req as any)
     expect(res.status).toBe(401)
   })
 
   it('salary-settings DELETE retorna 401 quando user mismatch', async () => {
     mockAuthUser = { id: 'other' }
     const route = require('@/app/api/personal/salary-settings/route')
     const req = { url: 'http://x/api/personal/salary-settings?user_id=u1' }
     const res = await (route as any).DELETE(req as any)
     expect(res.status).toBe(401)
   })
})
