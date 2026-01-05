import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }
jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'user_1' }
let mockUserRow: any = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }

const makeBuilder = (table: string) => {
  const state: any = { op: null as null | 'select' | 'insert' | 'update' | 'delete', cols: '', lastInsert: false, lastUpdate: false }
  const builder: any = {
    select: jest.fn((cols?: any) => {
      state.op = 'select'
      state.cols = typeof cols === 'string' ? cols : ''
      return builder
    }),
    insert: jest.fn((_payload?: any) => {
      state.op = 'insert'
      state.lastInsert = true
      return builder
    }),
    update: jest.fn((_payload?: any) => {
      state.op = 'update'
      state.lastUpdate = true
      return builder
    }),
    delete: jest.fn(() => {
      state.op = 'delete'
      return builder
    }),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(async () => {
      if (table === 'users') {
        return { data: { id: mockAuthUser.id, account_type: mockUserRow.account_type, created_at: mockUserRow.created_at }, error: null }
      }
      if (table === 'debts') {
        if (state.op === 'insert' || state.lastInsert) return { data: { id: 'debt_1' }, error: null }
        if (state.op === 'update' || state.lastUpdate) return { data: { id: 'debt_1', creditor_name: 'Bank', description: 'Loan', original_amount: 1000, current_amount: 900, interest_rate: 2, due_date: new Date().toISOString(), created_at: new Date().toISOString(), category: 'loan', priority: 'medium', status: 'open', payment_method: 'pix', notes: '' }, error: null }
        if (state.op === 'select' && state.cols.includes('user_id')) {
          return { data: { id: 'debt_1', user_id: mockAuthUser.id }, error: null }
        }
      }
      return { data: null, error: null }
    }),
    then: (resolve: any) => {
      if (state.op === 'select') {
        if (table === 'debt_payments') return resolve({ data: [], error: null })
        return resolve({ data: [], error: null })
      }
      if (state.op === 'delete') {
        return resolve({ error: null })
      }
      return resolve({ data: null, error: null })
    }
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
    }),
    createServiceClient: () => ({
      from: jest.fn((table: string) => makeBuilder(table))
    })
  }
})

describe('API dívidas CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
  })

  describe('create', () => {
    it('retorna 400 quando faltam dados', async () => {
      const { POST } = await import('@/app/api/debts/create/route')
      const res: any = await POST({ url: 'http://x/api/debts/create', json: async () => ({}) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando usuário mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { POST } = await import('@/app/api/debts/create/route')
      const res: any = await POST({ url: 'http://x/api/debts/create', json: async () => ({ user_id: 'user_1', debt: { creditorName: 'Bank', description: 'Loan', originalAmount: 1000, currentAmount: 900, interestRate: 2, dueDate: new Date().toISOString(), category: 'loan', priority: 'medium', status: 'open', paymentMethod: 'pix', notes: '' } }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('cria dívida com sucesso', async () => {
      const { POST } = await import('@/app/api/debts/create/route')
      const res: any = await POST({ url: 'http://x/api/debts/create', json: async () => ({ user_id: 'user_1', debt: { creditorName: 'Bank', description: 'Loan', originalAmount: 1000, currentAmount: 900, interestRate: 2, dueDate: new Date().toISOString(), category: 'loan', priority: 'medium', status: 'open', paymentMethod: 'pix', notes: '' } }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('update', () => {
    it('retorna 400 quando faltam dados', async () => {
      const { PUT } = await import('@/app/api/debts/update/route')
      const res: any = await PUT({ url: 'http://x/api/debts/update', json: async () => ({}) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando usuário mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { PUT } = await import('@/app/api/debts/update/route')
      const res: any = await PUT({ url: 'http://x/api/debts/update', json: async () => ({ user_id: 'user_1', debt_id: 'debt_1', debt: { creditorName: 'Bank', description: 'Loan', originalAmount: 1000, currentAmount: 900, interestRate: 2, dueDate: new Date().toISOString(), category: 'loan', priority: 'medium', status: 'open', paymentMethod: 'pix', notes: '' } }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('atualiza dívida com sucesso', async () => {
      const { PUT } = await import('@/app/api/debts/update/route')
      const res: any = await PUT({ url: 'http://x/api/debts/update', json: async () => ({ user_id: 'user_1', debt_id: 'debt_1', debt: { creditorName: 'Bank', description: 'Loan', originalAmount: 1000, currentAmount: 900, interestRate: 2, dueDate: new Date().toISOString(), category: 'loan', priority: 'medium', status: 'open', paymentMethod: 'pix', notes: '' } }) } as any)
      const body = await res.json()
      ;(global as any).console?.log?.('debts-update status:', res.status, 'body:', body)
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('retorna 400 quando faltam dados', async () => {
      const { DELETE } = await import('@/app/api/debts/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/debts/delete' } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando usuário mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { DELETE } = await import('@/app/api/debts/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/debts/delete?id=debt_1&user_id=user_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('deleta dívida com sucesso', async () => {
      const { DELETE } = await import('@/app/api/debts/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/debts/delete?id=debt_1&user_id=user_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
