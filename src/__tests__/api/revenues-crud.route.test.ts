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
  const state: any = { op: null as null | 'select' | 'insert' | 'update' | 'delete', cols: '', countExact: false, lastInsert: false }
  const builder: any = {
    select: jest.fn((cols?: any, opts?: any) => {
      state.op = 'select'
      state.cols = typeof cols === 'string' ? cols : ''
      if (opts?.count === 'exact') state.countExact = true
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
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    in: jest.fn(() => builder),
    single: jest.fn(async () => {
      if (table === 'users') {
        return { data: { id: mockAuthUser.id, account_type: mockUserRow.account_type, created_at: mockUserRow.created_at }, error: null }
      }
      if (table === 'transactions' && (state.op === 'insert' || state.lastInsert)) {
        return { data: { id: 'tx_1' }, error: null }
      }
      if (table === 'revenues') {
        if (state.op === 'insert' || state.lastInsert) return { data: { id: 'rev_1' }, error: null }
        if (state.op === 'update') return { data: { id: 'rev_1' }, error: null }
        if (state.op === 'select' && state.cols.includes('transaction_id')) {
          return { data: { id: 'rev_1', user_id: mockAuthUser.id, transaction_id: 'tx_1' }, error: null }
        }
      }
      if (table === 'products') {
        return { data: { id: 'prod_1', name: 'Produto', category: 'Vendas de Produtos', selling_price: 100, quantity: 10, quantity_sold: 2, status: 'selling' }, error: null }
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

describe('API receitas CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
  })

  describe('create', () => {
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { POST } = await import('@/app/api/revenues/create/route')
      const res: any = await POST({ url: 'http://x/api/revenues/create', json: async () => ({ description: 'R', amount: 10, category: 'Geral', source: 'other', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('retorna 400 quando falta source', async () => {
      const { POST } = await import('@/app/api/revenues/create/route')
      const res: any = await POST({ url: 'http://x/api/revenues/create', json: async () => ({ description: 'R', amount: 10, category: 'Geral', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('cria receita com sucesso', async () => {
      const { POST } = await import('@/app/api/revenues/create/route')
      const res: any = await POST({ url: 'http://x/api/revenues/create', json: async () => ({ description: 'Venda', amount: 100, category: 'Vendas', source: 'other', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success ?? true).toBe(true)
    })
  })

  describe('update', () => {
    it('retorna 400 quando falta id', async () => {
      const { PUT } = await import('@/app/api/revenues/update/route')
      const res: any = await PUT({ url: 'http://x/api/revenues/update', json: async () => ({ description: 'X', amount: 10, category: 'Geral', source: 'other', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { PUT } = await import('@/app/api/revenues/update/route')
      const res: any = await PUT({ url: 'http://x/api/revenues/update', json: async () => ({ id: 'rev_1', description: 'X', amount: 10, category: 'Geral', source: 'other', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('atualiza receita com sucesso', async () => {
      const { PUT } = await import('@/app/api/revenues/update/route')
      const res: any = await PUT({ url: 'http://x/api/revenues/update', json: async () => ({ id: 'rev_1', description: 'X', amount: 10, category: 'Geral', source: 'other', date: new Date().toISOString() }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('retorna 400 quando falta id', async () => {
      const { DELETE } = await import('@/app/api/revenues/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/revenues/delete' } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
    })
    it('retorna 401 quando não autenticado', async () => {
      mockAuthUser = null
      const { DELETE } = await import('@/app/api/revenues/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/revenues/delete?id=rev_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('deleta receita com sucesso', async () => {
      const { DELETE } = await import('@/app/api/revenues/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/revenues/delete?id=rev_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
