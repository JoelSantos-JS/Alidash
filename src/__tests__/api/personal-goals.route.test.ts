import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'u1' }

const makeBuilder = (table: string) => {
  const state: any = { table, op: null as null | 'select' | 'insert' | 'update' | 'delete', filters: {} as Record<string, any>, insertPayload: null as any, updatePayload: null as any }
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn((payload?: any) => { state.op = 'insert'; state.insertPayload = Array.isArray(payload) ? payload[0] : payload; return builder }),
    update: jest.fn((payload?: any) => { state.op = 'update'; state.updatePayload = payload; return builder }),
    delete: jest.fn(() => { state.op = 'delete'; return builder }),
    eq: jest.fn((col: string, val: any) => { state.filters[col] = val; return builder }),
    order: jest.fn(() => builder),
    single: jest.fn(async () => {
      if (state.table === 'personal_goals') {
        if (state.op === 'insert') {
          return { data: { id: 'goal_1', ...state.insertPayload }, error: null }
        }
        if (state.op === 'update') {
          return { data: { id: state.filters['id'] || 'goal_1', ...state.updatePayload }, error: null }
        }
      }
      return { data: null, error: null }
    })
  }
  return builder
}

jest.mock('@/utils/supabase/server', () => {
  return {
    createClient: async () => ({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: mockAuthUser }, error: null }))
      },
      from: jest.fn((table: string) => makeBuilder(table))
    })
  }
})

describe('API de Metas Pessoais - Normalização de tipos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'u1' }
  })

  it('POST normaliza type="travel" para "vacation"', async () => {
    const { POST } = await import('@/app/api/personal/goals/route')
    const req: any = {
      url: 'http://test/api/personal/goals',
      json: async () => ({
        user_id: 'u1',
        name: 'Viagem',
        description: 'Férias',
        type: 'travel',
        target_amount: 15000,
        current_amount: 2000,
        deadline: '2026-12-31',
        priority: 'high'
      })
    }
    const res: any = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.goal).toBeDefined()
    expect(body.goal.type).toBe('vacation')
  })

  it('PUT normaliza category="house" para type="home_purchase"', async () => {
    const { PUT } = await import('@/app/api/personal/goals/route')
    const req: any = {
      url: 'http://test/api/personal/goals',
      json: async () => ({
        id: 'goal_1',
        user_id: 'u1',
        category: 'house'
      })
    }
    const res: any = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.type).toBe('home_purchase')
  })

  it('PUT normaliza type="saving" para "savings"', async () => {
    const { PUT } = await import('@/app/api/personal/goals/route')
    const req: any = {
      url: 'http://test/api/personal/goals',
      json: async () => ({
        id: 'goal_2',
        user_id: 'u1',
        type: 'saving'
      })
    }
    const res: any = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.type).toBe('savings')
  })
  
  it('POST normaliza todos os tipos suportados', async () => {
    const { POST } = await import('@/app/api/personal/goals/route')
    const cases = [
      { input: 'emergency_fund', expected: 'emergency_fund' },
      { input: 'savings', expected: 'savings' },
      { input: 'saving', expected: 'savings' },
      { input: 'debt_payoff', expected: 'debt_payoff' },
      { input: 'investment', expected: 'investment' },
      { input: 'purchase', expected: 'purchase' },
      { input: 'car', expected: 'purchase' },
      { input: 'vacation', expected: 'vacation' },
      { input: 'travel', expected: 'vacation' },
      { input: 'retirement', expected: 'retirement' },
      { input: 'education', expected: 'education' },
      { input: 'home_purchase', expected: 'home_purchase' },
      { input: 'house', expected: 'home_purchase' },
      { input: 'wedding', expected: 'wedding' },
      { input: 'gift', expected: 'other' },
      { input: 'health', expected: 'other' },
      { input: 'other', expected: 'other' },
      { input: 'unknown_value', expected: 'other' },
    ]
    for (const c of cases) {
      const req: any = {
        url: 'http://test/api/personal/goals',
        json: async () => ({
          user_id: 'u1',
          name: 'Teste',
          type: c.input,
          target_amount: 100,
          deadline: '2026-12-31'
        })
      }
      const res: any = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.goal.type).toBe(c.expected)
    }
  })
  
  it('PUT normaliza múltiplos types', async () => {
    const { PUT } = await import('@/app/api/personal/goals/route')
    const cases = [
      { input: 'saving', expected: 'savings' },
      { input: 'car', expected: 'purchase' },
      { input: 'travel', expected: 'vacation' },
      { input: 'gift', expected: 'other' },
      { input: 'unknown_value', expected: 'other' },
    ]
    for (const c of cases) {
      const req: any = {
        url: 'http://test/api/personal/goals',
        json: async () => ({
          id: `goal_${c.input}`,
          user_id: 'u1',
          type: c.input
        })
      }
      const res: any = await PUT(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.type).toBe(c.expected)
    }
  })
  
  it('PUT normaliza múltiplos categories', async () => {
    const { PUT } = await import('@/app/api/personal/goals/route')
    const cases = [
      { input: 'house', expected: 'home_purchase' },
      { input: 'car', expected: 'purchase' },
      { input: 'travel', expected: 'vacation' },
      { input: 'gift', expected: 'other' },
      { input: 'unknown_value', expected: 'other' },
    ]
    for (const c of cases) {
      const req: any = {
        url: 'http://test/api/personal/goals',
        json: async () => ({
          id: `goal_cat_${c.input}`,
          user_id: 'u1',
          category: c.input
        })
      }
      const res: any = await PUT(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.type).toBe(c.expected)
    }
  })
})
