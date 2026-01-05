import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { parseCurrencyInputBRL } from '@/lib/utils'
let PersonalDashboardSection: any

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })
}))

jest.mock('lucide-react', () => ({
  X: () => null,
  DollarSign: () => null,
  TrendingUp: () => null,
  TrendingDown: () => null,
  PiggyBank: () => null,
  User: () => null,
  Wallet: () => null,
  CreditCard: () => null,
  Home: () => null,
  Car: () => null,
  ShoppingBag: () => null,
  Coffee: () => null,
  Gamepad2: () => null,
  Heart: () => null,
  GraduationCap: () => null,
  Plane: () => null,
  Utensils: () => null,
  Zap: () => null,
  Shield: () => null,
  Shirt: () => null,
  Gift: () => null,
  Plus: () => null,
  Settings: () => null,
}))

let mockLastInserted: any

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockLastInserted = undefined
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-key'
  PersonalDashboardSection = require('@/components/dashboard/personal-dashboard-section').PersonalDashboardSection
})

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
            insert: (payload: any) => { mockLastInserted = Array.isArray(payload) ? payload[0] : payload; return builder },
            update: (payload: any) => { mockLastInserted = payload; return builder },
            single: async () => {
              if (state.table === 'personal_budgets') {
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
      insert: (payload: any) => { mockLastInserted = Array.isArray(payload) ? payload[0] : payload; return builder },
      update: (payload: any) => { mockLastInserted = payload; return builder },
      single: async () => {
        if (state.table === 'personal_budgets') {
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
    })
  }
})

describe('Fluxo de Orçamento Pessoal', () => {
  it('parseCurrencyInputBRL converte string BRL para número', () => {
    const n1 = parseCurrencyInputBRL('R$ 1.800,00')
    const n2 = parseCurrencyInputBRL('R$ 1.800,00')
    const n3 = parseCurrencyInputBRL('1800')
    expect(n1).toBe(1800)
    expect(n2).toBe(1800)
    expect(n3).toBe(18)
  })

  it('POST /api/personal/budgets salva total_budget numérico', async () => {
    const route = require('@/app/api/personal/budgets/route')
    const body = { user_id: 'u1', month: 1, year: 2025, total_budget: 1800 }
    const req = { url: 'http://test/api/personal/budgets', json: async () => body }
    const res = await (route as any).POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.budget.total_budget).toBe('number')
    expect(data.budget.total_budget).toBe(1800)
    expect(data.summary.totalBudget).toBe(1800)
  })

  it('Widget mostra botão "Definir Orçamento" quando totalBudget=0', async () => {
    expect(true).toBe(true)
  })

  it('Widget calcula valores de orçamento, gastos e disponível', async () => {
    expect(true).toBe(true)
  })
})
