import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'user_1' }

const makeBuilder = (table: string) => {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(async () => ({ data: { id: 'x' }, error: null }))
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

describe('API de Metas Pessoais - Autorização', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'user_1' }
  })

  it('GET retorna 400 sem user_id', async () => {
    const { GET } = await import('@/app/api/personal/goals/route')
    const req: any = { url: 'http://x/api/personal/goals' }
    const res: any = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toMatch(/user_id/i)
  })

  it('GET retorna 401 quando não autenticado', async () => {
    mockAuthUser = null as any
    const { GET } = await import('@/app/api/personal/goals/route')
    const req: any = { url: 'http://x/api/personal/goals?user_id=user_1' }
    const res: any = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toMatch(/Não autenticado/i)
  })

  it('GET retorna 401 quando usuário diferente', async () => {
    mockAuthUser = { id: 'other' }
    const { GET } = await import('@/app/api/personal/goals/route')
    const req: any = { url: 'http://x/api/personal/goals?user_id=user_1' }
    const res: any = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toMatch(/Não autenticado/i)
  })

  it('DELETE retorna 400 quando falta id ou user_id', async () => {
    const { DELETE } = await import('@/app/api/personal/goals/route')
    const res1: any = await DELETE({ url: 'http://x/api/personal/goals?id=goal_1' } as any)
    const res2: any = await DELETE({ url: 'http://x/api/personal/goals?user_id=user_1' } as any)
    expect(res1.status).toBe(400)
    expect(res2.status).toBe(400)
  })

  it('DELETE retorna 401 quando não autenticado', async () => {
    mockAuthUser = null as any
    const { DELETE } = await import('@/app/api/personal/goals/route')
    const req: any = { url: 'http://x/api/personal/goals?id=goal_1&user_id=user_1' }
    const res: any = await DELETE(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toMatch(/Não autenticado/i)
  })

  it('POST retorna 401 quando não autenticado', async () => {
    mockAuthUser = null as any
    const { POST } = await import('@/app/api/personal/goals/route')
    const req: any = {
      url: 'http://x/api/personal/goals',
      json: async () => ({ user_id: 'user_1', name: 'Meta', type: 'savings', target_amount: 100, deadline: '2025-12-31' })
    }
    const res: any = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toMatch(/Não autenticado/i)
  })

  it('PUT retorna 401 quando não autenticado', async () => {
    mockAuthUser = null as any
    const { PUT } = await import('@/app/api/personal/goals/route')
    const req: any = {
      url: 'http://x/api/personal/goals',
      json: async () => ({ id: 'goal_1', user_id: 'user_1', title: 'Nova' })
    }
    const res: any = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toMatch(/Não autenticado/i)
  })
})
