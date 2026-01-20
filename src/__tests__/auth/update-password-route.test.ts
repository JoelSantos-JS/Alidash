import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockUser: any = { id: 'u1' }
let mockAccessToken: string | null = 'at_123'
let fetchOk = true
let fetchStatus = 200
let fetchJson: any = { ok: true }

jest.mock('@/utils/supabase/server', () => {
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: mockUser }, error: null }),
        getSession: async () => ({ data: { session: mockAccessToken ? { access_token: mockAccessToken } : null }, error: null }),
      }
    })
  }
})

beforeEach(() => {
  jest.resetModules()
  mockUser = { id: 'u1' }
  mockAccessToken = 'at_123'
  fetchOk = true
  fetchStatus = 200
  fetchJson = { ok: true }
  ;(global as any).fetch = jest.fn(async () => ({
    ok: fetchOk,
    status: fetchStatus,
    json: async () => fetchJson,
  }))
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
})

describe('POST /api/auth/update-password', () => {
  it('retorna 400 quando password é inválida', async () => {
    const route = require('@/app/api/auth/update-password/route')
    const req = { json: async () => ({ password: '123' }), cookies: { getAll: () => [] } }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('invalid_password')
    expect((global as any).fetch).not.toHaveBeenCalled()
  })

  it('retorna 401 quando não autenticado', async () => {
    mockUser = null
    const route = require('@/app/api/auth/update-password/route')
    const req = { json: async () => ({ password: '123456' }), cookies: { getAll: () => [] } }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('unauthorized')
    expect((global as any).fetch).not.toHaveBeenCalled()
  })

  it('retorna 401 quando session/access_token está ausente', async () => {
    mockAccessToken = null
    const route = require('@/app/api/auth/update-password/route')
    const req = { json: async () => ({ password: '123456' }), cookies: { getAll: () => [] } }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('session_missing')
    expect((global as any).fetch).not.toHaveBeenCalled()
  })

  it('chama Supabase Auth e retorna 200 no sucesso', async () => {
    const route = require('@/app/api/auth/update-password/route')
    const req = { json: async () => ({ password: '123456' }), cookies: { getAll: () => [] } }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect((global as any).fetch).toHaveBeenCalledTimes(1)
    const [url, init] = ((global as any).fetch as any).mock.calls[0]
    expect(url).toBe('https://abc.supabase.co/auth/v1/user')
    expect(init.method).toBe('PUT')
    expect(init.headers.apikey).toBe('anon')
    expect(init.headers.Authorization).toBe('Bearer at_123')
  })
})

