import { describe, it, expect, beforeEach, jest } from '@jest/globals'

let mockSettingsByUser: Record<string, any> = {}
let mockIncomes: any[] = []

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: (table: string) => {
        if (table === 'personal_salary_settings') {
          return {
            select: () => {
              const s: any = { filter: {}, data: undefined }
              s.eq = (col: string, val: any) => {
                s.filter[col] = val
                if (col === 'is_active' && val === true && !s.filter.user_id) {
                  s.data = Object.values(mockSettingsByUser)
                }
                return s
              }
              s.single = async () => {
                if (s.filter.user_id && s.filter.is_active === true) {
                  return { data: mockSettingsByUser[s.filter.user_id] }
                }
                return { data: null }
              }
              return s
            }
          } as any
        }
        if (table === 'personal_incomes') {
          return {
            insert: async (payload: any) => {
              const row = Array.isArray(payload) ? payload[0] : payload
              mockIncomes.push(row)
              return { error: null }
            }
          } as any
        }
        return {} as any
      }
    })
  }
})

beforeEach(() => {
  jest.resetModules()
  mockSettingsByUser = {
    u1: { user_id:'u1', payment_day: 10, amount: 5000, description:'Salário', source:'emprego', is_taxable:false, tax_withheld:0, notes:null, is_active:true },
    u2: { user_id:'u2', payment_day: 15, amount: 3000, description:'Salário', source:'empresa', is_taxable:true, tax_withheld:100, notes:null, is_active:true }
  }
  mockIncomes = []
})

describe('salary automation lib', () => {
  it('applyUserFixedSalary inserts income', async () => {
    const lib = require('@/lib/salary-automation')
    const res = await lib.applyUserFixedSalary('u1', 1, 2025)
    expect(res.success).toBe(true)
    expect(res.appliedCount).toBe(1)
    expect(mockIncomes.length).toBe(1)
    expect(mockIncomes[0].date).toBe('2025-01-10')
    expect(mockIncomes[0].category).toBe('salary')
  })

  it('applyFixedSalaries applies for all active users', async () => {
    const lib = require('@/lib/salary-automation')
    const res = await lib.applyFixedSalaries(1, 2025)
    expect(res.success).toBe(true)
    expect(res.appliedCount).toBeGreaterThanOrEqual(2)
  })
})
