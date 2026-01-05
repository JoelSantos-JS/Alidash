import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }
jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'user_1' }
let mockDeletedCount = 3

jest.mock('@/utils/supabase/server', () => {
  const makeBuilder = (table: string) => {
    const builder: any = {
      _op: null as null | 'select' | 'delete' | 'update',
      _countExact: false,
      select: jest.fn((_cols?: any, opts?: any) => {
        builder._op = 'select'
        if (opts?.count === 'exact') builder._countExact = true
        return builder
      }),
      eq: jest.fn(() => builder),
      gte: jest.fn(() => builder),
      delete: jest.fn(() => {
        builder._op = 'delete'
        return builder
      }),
      update: jest.fn(() => {
        builder._op = 'update'
        return builder
      }),
      single: jest.fn(async () => ({ data: null, error: null })),
      then: undefined as any
    }
    builder.then = (resolve: any, _reject?: any) => {
      if (table === 'sales' && builder._op === 'select') {
        return resolve({ count: builder._countExact ? mockDeletedCount : undefined })
      }
      return resolve({ error: null })
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

describe('API vendas/clear', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
    mockDeletedCount = 3
  })

  it('retorna 400 quando falta user_id', async () => {
    const { DELETE } = await import('@/app/api/sales/clear/route')
    const res: any = await DELETE({ url: 'http://x/api/sales/clear' } as any)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toBe('user_id é obrigatório')
  })

  it('retorna 401 quando usuário mismatch', async () => {
    mockAuthUser = { id: 'other' }
    const { DELETE } = await import('@/app/api/sales/clear/route')
    const res: any = await DELETE({ url: 'http://x/api/sales/clear?user_id=user_1' } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('limpa vendas e reseta métricas com sucesso', async () => {
    const { DELETE } = await import('@/app/api/sales/clear/route')
    const res: any = await DELETE({ url: 'http://x/api/sales/clear?user_id=user_1' } as any)
    const body = await res.json()
    ;(global as any).console?.log?.('sales-clear success res:', res)
    ;(global as any).console?.log?.('sales-clear success status:', res.status)
    ;(global as any).console?.log?.('sales-clear success body:', body)
    expect(res.status ?? 200).toBe(200)
    expect(body.success).toBe(true)
    expect(body.deleted).toBe(mockDeletedCount)
  })
})
