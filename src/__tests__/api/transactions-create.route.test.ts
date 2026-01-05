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
      }
    })
  }
})

jest.mock('@/lib/supabase-service', () => {
  return {
    supabaseAdminService: {
      getUserById: jest.fn(async (id: string) => (id === mockUserRow.id ? mockUserRow : null)),
      createTransaction: jest.fn(async (_userId: string, _data: any) => ({ success: true, transaction: { id: 'tx_1' } }))
    }
  }
})

describe('API transações/create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockUserRow = { id: 'user_1', account_type: 'pro', created_at: new Date().toISOString() }
  })

  it('retorna 400 quando faltam campos', async () => {
    const { POST } = await import('@/app/api/transactions/create/route')
    const res1: any = await POST({ url: 'http://x/api/transactions/create', json: async () => ({}) } as any)
    const body1 = await res1.json()
    expect(res1.status).toBe(400)
    const res2: any = await POST({ url: 'http://x/api/transactions/create', json: async () => ({ user_id: 'user_1' }) } as any)
    const body2 = await res2.json()
    expect(res2.status).toBe(400)
  })

  it('retorna 401 quando usuário mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const { POST } = await import('@/app/api/transactions/create/route')
    const res: any = await POST({ url: 'http://x/api/transactions/create', json: async () => ({ user_id: 'user_1', transaction: { date: new Date().toISOString(), description: 'Teste', amount: 10, type: 'expense', category: 'Geral' } }) } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('cria transação com sucesso', async () => {
    const { POST } = await import('@/app/api/transactions/create/route')
    const res: any = await POST({ url: 'http://x/api/transactions/create', json: async () => ({ user_id: 'user_1', transaction: { date: new Date().toISOString(), description: 'Teste', amount: 10, type: 'expense', category: 'Geral' } }) } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success ?? true).toBe(true)
  })
})

