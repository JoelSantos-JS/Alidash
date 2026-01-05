import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockUser: any
let mockLastInserted: any

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => {
      return {
        from: (table: string) => {
          const state: any = { table, selectCols: '*', filter: {} }
          const builder: any = {
            select: (cols?: string) => { state.selectCols = cols || '*'; return builder },
            eq: (col: string, val: any) => { state.filter[col] = val; return builder },
            order: () => builder,
            limit: () => builder,
            insert: (payload: any) => { mockLastInserted = Array.isArray(payload) ? payload[0] : payload; return builder },
            update: (payload: any) => { mockLastInserted = payload; return builder },
            single: async () => {
              if (state.table === 'users') return { data: mockUser }
              if (state.table === 'personal_salary_settings') {
                if (state.selectCols === 'id') return { data: null }
                return { data: mockLastInserted || {} }
              }
              return { data: {} }
            }
          }
          return builder
        }
      }
    }
  }
})

jest.mock('@/utils/supabase/server', () => {
  const mockFrom = (table: string) => {
    const state: any = { table, selectCols: '*', filter: {} }
    const builder: any = {
      select: (cols?: string) => { state.selectCols = cols || '*'; return builder },
      eq: (col: string, val: any) => { state.filter[col] = val; return builder },
      order: () => builder,
      limit: () => builder,
      insert: (payload: any) => { mockLastInserted = Array.isArray(payload) ? payload[0] : payload; return builder },
      update: (payload: any) => { mockLastInserted = payload; return builder },
      single: async () => {
        if (state.table === 'users') return { data: mockUser }
        if (state.table === 'personal_salary_settings') {
          if (state.selectCols === 'id') return { data: null }
          return { data: mockLastInserted || {} }
        }
        return { data: {} }
      }
    }
    return builder
  }
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: 'u1', email: 'u1@example.com' } }, error: null })
      },
      from: (table: string) => mockFrom(table)
    }),
    createServiceClient: () => ({
      from: (table: string) => mockFrom(table)
    })
  }
})

beforeEach(() => {
  jest.resetModules()
  mockUser = { account_type: 'personal', created_at: new Date().toISOString() }
  mockLastInserted = undefined
})

describe('salary-settings parsing', () => {
  it('parses boolean strings to false', async () => {
    const route = require('@/app/api/personal/salary-settings/route')
    const body = { user_id:'u1', amount:'1000', description:'Salário', payment_day:'5', is_active:'false', is_taxable:'false', tax_withheld:'0', source:'emprego' }
    const req = { url:'http://test/api/personal/salary-settings', json: async () => body }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.settings.is_active).toBe(false)
    expect(data.settings.is_taxable).toBe(false)
    expect(typeof data.settings.amount).toBe('number')
    expect(typeof data.settings.payment_day).toBe('number')
    expect(typeof data.settings.tax_withheld).toBe('number')
  })

  it('parses boolean strings to true', async () => {
    const route = require('@/app/api/personal/salary-settings/route')
    const body = { user_id:'u1', amount:1000, description:'Salário', payment_day:5, is_active:'true', is_taxable:'true', tax_withheld:'1.5', source:'emprego' }
    const req = { url:'http://test/api/personal/salary-settings', json: async () => body }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.settings.is_active).toBe(true)
    expect(data.settings.is_taxable).toBe(true)
    expect(data.settings.tax_withheld).toBeCloseTo(1.5)
  })
})
