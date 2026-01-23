import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockUserRow: any = null
let mockLastUpdate: any = null

jest.mock('@/lib/supabase-service', () => {
  const client = {
    from: jest.fn((_table: string) => {
      const builder: any = {
        update: (payload: any) => {
          mockLastUpdate = payload
          return builder
        },
        eq: () => builder,
        select: () => builder,
        single: async () => ({ data: mockUserRow ? { ...mockUserRow, ...(mockLastUpdate || {}) } : null })
      }
      return builder
    })
  }
  return {
    supabaseAdminService: {
      getUserById: jest.fn(async (id: string) => (mockUserRow && id === mockUserRow.id ? mockUserRow : null)),
      getUserByEmail: jest.fn(async (email: string) => (mockUserRow && email === mockUserRow.email ? mockUserRow : null)),
      getClient: () => client
    }
  }
})

describe('POST /api/user/get - expiração do plano', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockLastUpdate = null
    mockUserRow = null
  })

  it('faz downgrade para personal quando plan_next_renewal_at expirou', async () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    mockUserRow = {
      id: 'u1',
      email: 't@test.com',
      account_type: 'pro',
      plan_next_renewal_at: past,
      plan_started_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      plan_status: 'active',
      plan_price_brl: 27
    }

    const { POST } = await import('@/app/api/user/get/route')
    const req: any = { json: async () => ({ user_id: 'u1', email: 't@test.com' }) }
    const res: any = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.account_type).toBe('personal')
    expect(body.user.plan_status).toBe('expired')
    expect(body.user.plan_price_brl).toBeNull()
  })

  it('não faz downgrade quando plan_next_renewal_at ainda é futura', async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    mockUserRow = {
      id: 'u1',
      email: 't@test.com',
      account_type: 'pro',
      plan_next_renewal_at: future,
      plan_started_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      plan_status: 'active',
      plan_price_brl: 27
    }

    const { POST } = await import('@/app/api/user/get/route')
    const req: any = { json: async () => ({ user_id: 'u1', email: 't@test.com' }) }
    const res: any = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.account_type).toBe('pro')
    expect(body.user.plan_status).toBe('active')
  })
})
