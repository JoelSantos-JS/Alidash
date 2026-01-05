import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = function() {}
;(global as any).Response = function() {}

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockUser = {}

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => {
      return {
        from: (table: string) => {
          const state = { table, payload: null as any }
          const builder = {
            select: () => builder,
            eq: () => builder,
            gte: () => builder,
            lte: () => builder,
            order: () => builder,
            limit: () => builder,
            single: async () => {
              if ((state as any).table === 'users') return { data: mockUser }
              return { data: (state as any).payload || { id: 'x' } }
            },
            insert: (payload: any) => { (state as any).payload = Array.isArray(payload) ? payload[0] : payload; return builder },
            update: (payload: any) => { (state as any).payload = payload; return builder }
          }
          return builder as any
        }
      }
    }
  }
})

jest.mock('@/lib/salary-automation', () => ({
  applyUserFixedSalary: jest.fn(async () => ({ success: true, message: 'ok' })),
  applyFixedSalaries: jest.fn(async () => ({ success: true, message: 'ok' }))
}))

jest.mock('@/utils/supabase/server', () => {
  const mockFrom = (table: string) => {
    const state: any = { table, payload: null }
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => builder,
      single: async () => {
        if (state.table === 'users') return { data: mockUser }
        return { data: state.payload || { id: 'x' } }
      },
      insert: (payload: any) => { state.payload = Array.isArray(payload) ? payload[0] : payload; return builder },
      update: (payload: any) => { state.payload = payload; return builder }
    }
    return builder
  }
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1', email: 'u1@example.com' } }, error: null })
      },
      from: (table: string) => mockFrom(table)
    }),
    createServiceClient: () => ({
      from: (table: string) => mockFrom(table)
    })
  }
})

beforeEach(() => {
  jest.resetModules()
})

describe('Sistema totalmente pago (sem bloqueio por dias)', () => {
  it('permite criação de entrada antes de 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
    const incomesRoute = require('@/app/api/personal/incomes/route')
    const body = { user_id: 'u1', date: '2025-01-01', description: 'Teste', amount: 10, category: 'other', source: 'test' }
    const req = { url: 'http://test/api/personal/incomes', json: async () => body }
    const res = await (incomesRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.income).toBeDefined()
  })

  it('permite criação de entrada após 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 6 * 86400000).toISOString() }
    const incomesRoute = require('@/app/api/personal/incomes/route')
    const body = { user_id: 'u1', date: '2025-01-01', description: 'Teste', amount: 10, category: 'other', source: 'test' }
    const req = { url: 'http://test/api/personal/incomes', json: async () => body }
    const res = await (incomesRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.income).toBeDefined()
  })

  it('permite criação de saída antes de 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
    const expensesRoute = require('@/app/api/personal/expenses/route')
    const body = { user_id: 'u1', date: '2025-01-01', description: 'Teste', amount: 10, category: 'other', payment_method: 'cash' }
    const req = { url: 'http://test/api/personal/expenses', json: async () => body }
    const res = await (expensesRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.expense).toBeDefined()
  })

  it('permite criação de despesa após 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 6 * 86400000).toISOString() }
    const expensesRoute = require('@/app/api/personal/expenses/route')
    const body = { user_id: 'u1', date: '2025-01-01', description: 'Teste', amount: 10, category: 'other', payment_method: 'cash' }
    const req = { url: 'http://test/api/personal/expenses', json: async () => body }
    const res = await (expensesRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.expense).toBeDefined()
  })

  it('permite criação de meta após 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 5 * 86400000).toISOString() }
    const goalsRoute = require('@/app/api/personal/goals/route')
    const body = { user_id: 'u1', name: 'Meta', type: 'saving', target_amount: 100, deadline: '2025-12-31' }
    const req = { url: 'http://test/api/personal/goals', json: async () => body }
    const res = await (goalsRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.goal).toBeDefined()
  })

  it('permite atualizar configurações de salário antes de 5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
    const salarySettingsRoute = require('@/app/api/personal/salary-settings/route')
    const body = { user_id: 'u1', amount: 1000, description: 'Salário', payment_day: 5, source: 'emprego' }
    const req = { url: 'http://test/api/personal/salary-settings', json: async () => body }
    const res = await (salarySettingsRoute as any).POST(req as any)
    expect(res.status).toBe(200)
    const result = await res.json()
    expect(result.settings).toBeDefined()
  })

  it('permite configurações de salário após 3/5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 10 * 86400000).toISOString() }
    const salarySettingsRoute = require('@/app/api/personal/salary-settings/route')
    const body = { user_id: 'u1', amount: 1000, description: 'Salário', payment_day: 5, source: 'emprego' }
    const req = { url: 'http://test/api/personal/salary-settings', json: async () => body }
    const res = await (salarySettingsRoute as any).POST(req as any)
    expect(res.status).toBe(200)
  })

  it('permite automação de salário após 3/5 dias', async () => {
    mockUser = { account_type: 'personal', created_at: new Date(Date.now() - 7 * 86400000).toISOString() }
    const salaryAutomationRoute = require('@/app/api/personal/salary-automation/route')
    const body = { user_id: 'u1', month: 1, year: 2025 }
    const req = { url: 'http://test/api/personal/salary-automation', json: async () => body }
    const res = await (salaryAutomationRoute as any).POST(req as any)
    expect(res.status).toBe(200)
  })

  it('permite ações para usuários pagos mesmo após 3 dias', async () => {
    mockUser = { account_type: 'pro', created_at: new Date(Date.now() - 30 * 86400000).toISOString() }
    const incomesRoute = require('@/app/api/personal/incomes/route')
    const body = { user_id: 'u1', date: '2025-01-01', description: 'Pro', amount: 10, category: 'other', source: 'test' }
    const req = { url: 'http://test/api/personal/incomes', json: async () => body }
    const res = await (incomesRoute as any).POST(req as any)
    expect(res.status).toBe(200)
  })
})
