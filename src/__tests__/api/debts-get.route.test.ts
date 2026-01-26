import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class {
  static json(body: any, init?: any) {
    return { status: init?.status ?? 200, json: async () => body }
  }
}

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any
let mockDebtsRows: any[]
let mockPaymentsRows: any[]

const makeBuilder = (table: string) => {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(async () => {
      if (table === 'debts') return { data: mockDebtsRows, error: null }
      if (table === 'debt_payments') return { data: mockPaymentsRows, error: null }
      return { data: [], error: null }
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

describe('API dívidas GET', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockDebtsRows = [
      {
        id: 'd1',
        user_id: 'user_1',
        creditor_name: 'Banco A',
        description: 'Cartão',
        original_amount: 1000,
        current_amount: 800,
        interest_rate: 1.5,
        due_date: '2026-01-10T00:00:00.000Z',
        created_at: '2025-12-01T00:00:00.000Z',
        category: 'credit_card',
        priority: 'medium',
        status: 'active',
        payment_method: 'pix',
        notes: null,
        tags: [],
        installments: { total: 10, paid: 2, amount: 100 }
      }
    ]
    mockPaymentsRows = [
      {
        id: 'p1',
        debt_id: 'd1',
        date: '2025-12-15T00:00:00.000Z',
        amount: 100,
        payment_method: 'pix',
        notes: ''
      }
    ]
  })

  it('retorna 403 quando user_id query não bate com o usuário autenticado', async () => {
    const { GET } = await import('@/app/api/debts/get/route')
    const res: any = await GET({ url: 'http://x/api/debts/get?user_id=other' } as any)
    const body = await res.json()
    expect(res.status).toBe(403)
    expect(body.error).toBeTruthy()
  })

  it('retorna dívidas convertidas do Supabase com pagamentos', async () => {
    const { GET } = await import('@/app/api/debts/get/route')
    const res: any = await GET({ url: 'http://x/api/debts/get?user_id=user_1' } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.debts.length).toBe(1)
    expect(body.debts[0].creditorName).toBe('Banco A')
    expect(body.debts[0].originalAmount).toBe(1000)
    expect(body.debts[0].currentAmount).toBe(800)
    expect(body.debts[0].installments.amount).toBe(100)
    expect(body.debts[0].payments.length).toBe(1)
    expect(body.debts[0].payments[0].amount).toBe(100)
    expect(body.debts[0].dueDate instanceof Date).toBe(true)
    expect(body.debts[0].createdDate instanceof Date).toBe(true)
  })
})

