import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }
jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'user_1' }
let mockUserRow: any = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }

jest.mock('@/utils/supabase/server', () => {
  return {
    createClient: async () => ({
      auth: {
        getUser: jest.fn(async () => ({ data: { user: mockAuthUser }, error: null }))
      },
      from: jest.fn((_table: string) => ({
        select: jest.fn(() => ({ single: jest.fn(async () => ({ data: null, error: null })) }))
      }))
    })
  }
})

jest.mock('@/lib/supabase-service', () => {
  return {
    supabaseAdminService: {
      getUserById: jest.fn(async (id: string) => (id === mockUserRow.id ? mockUserRow : null)),
      createProduct: jest.fn(async (_userId: string, _productData: any) => ({ id: 'prod_1' })),
      updateProduct: jest.fn(async () => ({ id: 'prod_1' })),
      deleteProduct: jest.fn(async () => ({}))
    }
  }
})

describe('API produtos CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
  })

  describe('create', () => {
    it('retorna 400 quando falta user_id', async () => {
      const { POST } = await import('@/app/api/products/create/route')
      const res: any = await POST({ url: 'http://x/api/products/create', json: async () => ({ name: 'P', category: 'C' }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.error).toBe('user_id é obrigatório')
    })
    it('retorna 401 quando usuário não autenticado ou mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { POST } = await import('@/app/api/products/create/route')
      const res: any = await POST({ url: 'http://x/api/products/create?user_id=user_1', json: async () => ({ name: 'P', category: 'C' }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('cria produto com sucesso', async () => {
      const { POST } = await import('@/app/api/products/create/route')
      const res: any = await POST({ url: 'http://x/api/products/create?user_id=user_1', json: async () => ({ name: 'Produto X', category: 'Eletrônicos', quantity: 5 }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('update', () => {
    it('retorna 400 quando falta user_id', async () => {
      const { PUT } = await import('@/app/api/products/update/route')
      const res: any = await PUT({ url: 'http://x/api/products/update?product_id=prod_1', json: async () => ({ name: 'Novo' }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.error).toBe('user_id é obrigatório')
    })
    it('retorna 400 quando falta product_id', async () => {
      const { PUT } = await import('@/app/api/products/update/route')
      const res: any = await PUT({ url: 'http://x/api/products/update?user_id=user_1', json: async () => ({ name: 'Novo' }) } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.error).toBe('product_id é obrigatório')
    })
    it('retorna 401 quando usuário não autenticado ou mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { PUT } = await import('@/app/api/products/update/route')
      const res: any = await PUT({ url: 'http://x/api/products/update?user_id=user_1&product_id=prod_1', json: async () => ({ name: 'Novo' }) } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('atualiza produto com sucesso', async () => {
      const { PUT } = await import('@/app/api/products/update/route')
      const res: any = await PUT({ url: 'http://x/api/products/update?user_id=user_1&product_id=prod_1', json: async () => ({ name: 'Atualizado', quantity: 10 }) } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('retorna 400 quando falta user_id', async () => {
      const { DELETE } = await import('@/app/api/products/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/products/delete?product_id=prod_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.error).toBe('user_id é obrigatório')
    })
    it('retorna 400 quando falta product_id', async () => {
      const { DELETE } = await import('@/app/api/products/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/products/delete?user_id=user_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(400)
      expect(body.error).toBe('product_id é obrigatório')
    })
    it('retorna 401 quando usuário não autenticado ou mismatch', async () => {
      mockAuthUser = { id: 'other' }
      const { DELETE } = await import('@/app/api/products/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/products/delete?user_id=user_1&product_id=prod_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(401)
      expect(body.error).toBe('Não autenticado')
    })
    it('deleta produto com sucesso', async () => {
      const { DELETE } = await import('@/app/api/products/delete/route')
      const res: any = await DELETE({ url: 'http://x/api/products/delete?user_id=user_1&product_id=prod_1' } as any)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
