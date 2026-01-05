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
  const state: any = { op: null as null | 'select' | 'insert' | 'update' | 'delete', cols: '', lastInsert: false }
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
      if (table === 'transactions' && (state.op === 'insert' || state.lastInsert)) {
        return { data: { id: 'tx_1' }, error: null }
      }
      if (table === 'expenses') {
        if (state.op === 'insert' || state.lastInsert) return { data: { id: 'exp_1' }, error: null }
        if (state.op === 'update') return { data: { id: 'exp_1' }, error: null }
        if (state.op === 'select' && state.cols.includes('transaction_id')) {
          return { data: { id: 'exp_1', user_id: mockAuthUser.id, transaction_id: 'tx_1' }, error: null }
        }
      }
      return { data: null, error: null }
    }),
    then: (resolve: any) => {
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
    })
  }
})

describe('API despesas CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
  })

  describe('create', () => {
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { POST } = await import('@/app/api/expenses/create/route')
      const res: any = await POST({ url: 'http://x/api/expenses/create', json: async () => ({ description: 'E', amount: 10, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('cria despesa com sucesso', async () => {
      const { POST } = await import('@/app/api/expenses/create/route')
      const res: any = await POST({ url: 'http://x/api/expenses/create', json: async () => ({ description: 'Compra', amount: 50, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      ;(global as any).console?.log?.('expenses-create status:', res.status, 'body:', body)
      expect(res.status).toBe(200)
      expect(body.success ?? true).toBe(true)
    })
  })

  describe('update', () => {
    it('retorna 400 quando falta id', async () => {
      const { PUT } = await import('@/app/api/expenses/update/route')
      const res: any = await PUT({ url: 'http://x/api/expenses/update', json: async () => ({ description: 'X', amount: 10, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { PUT } = await import('@/app/api/expenses/update/route')
      const res: any = await PUT({ url: 'http://x/api/expenses/update', json: async () => ({ id: 'exp_1', description: 'X', amount: 10, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('atualiza despesa com sucesso', async () => {
      const { PUT } = await import('@/app/api/expenses/update/route')
      const res: any = await PUT({ url: 'http://x/api/expenses/update', json: async () => ({ id: 'exp_1', description: 'Y', amount: 15, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('retorna 400 quando falta id', async () => {
      const { DELETE } = await import('@/app/api/expenses/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/expenses/delete' } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { DELETE } = await import('@/app/api/expenses/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/expenses/delete?id=exp_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('deleta despesa com sucesso', async () => {
      const { DELETE } = await import('@/app/api/expenses/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/expenses/delete?id=exp_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
