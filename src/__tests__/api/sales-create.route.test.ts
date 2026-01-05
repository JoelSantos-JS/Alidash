import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }
jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'user_1' }
let mockUserRow: any = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
let mockProduct: any = {
  id: 'prod_1',
  name: 'Produto Teste',
  category: 'Vendas de Produtos',
  selling_price: 50,
  quantity: 10,
  quantity_sold: 2,
  status: 'selling'
}

jest.mock('@/utils/supabase/server', () => {
  const makeBuilder = (table: string) => {
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      single: jest.fn(async () => {
        if (table === 'users') {
          return { data: { account_type: mockUserRow.account_type, created_at: mockUserRow.created_at }, error: null }
        }
        if (table === 'products') {
          if (!mockProduct) return { data: null, error: { message: 'not found' } }
          return { data: mockProduct, error: null }
        }
        return { data: null, error: null }
      })
    }
    return builder
  }
  return {
    createClient: async () => ({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: mockAuthUser }, error: null }))
      },
      from: jest.fn((table: string) => makeBuilder(table))
    })
  }
})

jest.mock('@/lib/supabase-service', () => {
  return {
    supabaseAdminService: {
      getUserById: jest.fn(async (id: string) => (id === mockUserRow.id ? mockUserRow : null)),
      createSale: jest.fn(async (_userId: string, _productId: string, payload: any) => ({ id: 'sale_1', ...payload })),
      updateProduct: jest.fn(async () => ({})),
      createRevenue: jest.fn(async () => ({}))
    }
  }
})

describe('API vendas/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
    mockProduct = {
      id: 'prod_1',
      name: 'Produto Teste',
      category: 'Vendas de Produtos',
      selling_price: 50,
      quantity: 10,
      quantity_sold: 2,
      status: 'selling'
    }
  })
  it('retorna 400 quando faltam parâmetros', async () => {
    const { POST } = await import('@/app/api/sales/create/route')
    const res1: any = await POST({ url: 'http://x/api/sales/create?product_id=prod_1', json: async () => ({}) } as any)
    const body1 = await res1.json()
    expect(res1.status).toBe(400)
    expect(body1.error).toBe('user_id é obrigatório')
    const res2: any = await POST({ url: 'http://x/api/sales/create?user_id=user_1', json: async () => ({}) } as any)
    const body2 = await res2.json()
    expect(res2.status).toBe(400)
    expect(body2.error).toBe('product_id é obrigatório')
  })
  it('retorna 401 quando usuário não autenticado ou mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const { POST } = await import('@/app/api/sales/create/route')
    const res: any = await POST({ url: 'http://x/api/sales/create?user_id=user_1&product_id=prod_1', json: async () => ({ quantity: 1 }) } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })
  it('cria venda com sucesso', async () => {
    const { POST } = await import('@/app/api/sales/create/route')
    const res: any = await POST({ url: 'http://x/api/sales/create?user_id=user_1&product_id=prod_1', json: async () => ({ quantity: 3, date: new Date().toISOString() }) } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.sale).toBeDefined()
  })
})
