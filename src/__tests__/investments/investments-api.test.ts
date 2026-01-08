import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

type Asset = { id: string, ticker: string, name?: string, class: string }
type Position = { id: string, user_id: string, asset_id: string, account_id?: string | null, quantity: number, avg_price: number }
type Transaction = { id: string, user_id: string, asset_id: string, type: string, quantity: number, unit_price: number, fees: number, taxes: number, cash_flow: number, date: string }
type Account = { id: string, user_id: string, name: string, broker?: string | null }

let mockAssets: Asset[] = []
let mockPositions: Position[] = []
let mockTransactions: Transaction[] = []
let mockAccounts: Account[] = []
let idSeq = 1
const nextSeq = () => { idSeq += 1; return idSeq }

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: (table: string) => {
        const state: any = { table, filters: {} }
        const applyFilters = (rows: any[]) => {
          return rows.filter(row => {
            return Object.keys(state.filters).every((k) => {
              return row[k] === state.filters[k]
            })
           })
         }
        const builder: any = {
          select: () => builder,
          eq: (col: string, val: any) => { state.filters[col] = val; return builder },
          in: (_: string, __: any[]) => builder,
          order: () => builder,
          gte: () => builder,
          limit: (n: number) => {
            const rows = state.table === 'investment_assets' ? mockAssets
              : state.table === 'investment_positions' ? mockPositions
              : state.table === 'investment_prices' ? [] 
              : state.table === 'investment_transactions' ? mockTransactions
              : state.table === 'investment_accounts' ? mockAccounts
              : []
            return Promise.resolve({ data: applyFilters(rows).slice(0, n), error: null })
          },
          single: async () => {
            const rows = state.table === 'investment_assets' ? mockAssets
              : state.table === 'investment_positions' ? mockPositions
              : state.table === 'investment_transactions' ? mockTransactions
              : state.table === 'investment_accounts' ? mockAccounts
              : []
            const data = applyFilters(rows)[0] || null
            return { data }
          },
          insert: (payload: any) => {
            const row = Array.isArray(payload) ? payload[0] : payload
            if (state.table === 'investment_assets') {
              const id = `asset_${nextSeq()}`
              const newRow = { id, ticker: row.ticker, name: row.name, class: row.class }
              mockAssets.push(newRow as any)
              const chain = {
                select: () => ({
                  single: async () => ({ data: { id } })
                })
              }
              return chain as any
            }
            if (state.table === 'investment_positions') {
              const id = `pos_${nextSeq()}`
              const newRow = { id, ...row }
              mockPositions.push(newRow as any)
              const chain = {
                select: () => ({
                  single: async () => ({ data: newRow })
                })
              }
              return chain as any
            }
            if (state.table === 'investment_transactions') {
              const id = `tx_${nextSeq()}`
              const newRow = { id, ...row }
              mockTransactions.push(newRow as any)
              const chain = {
                select: () => ({
                  single: async () => ({ data: newRow })
                })
              }
              return chain as any
            }
            if (state.table === 'investment_accounts') {
              const id = `acc_${nextSeq()}`
              const newRow = { id, user_id: row.user_id, name: row.name, broker: row.broker ?? null }
              mockAccounts.push(newRow as any)
              const chain = {
                select: () => ({
                  single: async () => ({ data: newRow })
                })
              }
              return chain as any
            }
            return {} as any
          },
          update: (payload: any) => {
            (state as any).updatePayload = payload
            const chain: any = {
              eq: (col: string, val: any) => { state.filters[col] = val; return chain },
              select: () => chain,
              single: async () => {
                let rows = state.table === 'investment_positions' ? mockPositions : []
                const filtered = applyFilters(rows)
                const target = filtered[0]
                if (state.table === 'investment_positions' && target) {
                  Object.assign(target, (state as any).updatePayload)
                }
                return { data: target || null }
              }
            }
            return chain
          },
          delete: () => {
            const chain: any = {
              eq: (col: string, val: any) => { state.filters[col] = val; return chain },
              select: () => chain,
              single: async () => {
                let rows = state.table === 'investment_positions' ? mockPositions : []
                const filtered = applyFilters(rows)
                const target = filtered[0]
                if (state.table === 'investment_positions' && target) {
                  const idx = rows.findIndex(r => r.id === target.id)
                  if (idx >= 0) rows.splice(idx, 1)
                }
                return { data: target || null }
              }
            }
            return chain
          }
        }
        return builder as any
      }
    })
  }
})
 
jest.mock('@/utils/supabase/server', () => {
  const makeBuilder = (table: string) => {
    const state: any = { table, filters: {} }
    const applyFilters = (rows: any[]) => {
      return rows.filter(row => {
        return Object.keys(state.filters).every((k) => row[k] === state.filters[k])
      })
    }
    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => { state.filters[col] = val; return builder },
      in: (_: string, __: any[]) => builder,
      order: () => builder,
      gte: () => builder,
      limit: (n: number) => {
        const rows = state.table === 'investment_assets' ? mockAssets
          : state.table === 'investment_positions' ? mockPositions
          : state.table === 'investment_prices' ? [] 
          : state.table === 'investment_transactions' ? mockTransactions
          : state.table === 'investment_accounts' ? mockAccounts
          : []
        return Promise.resolve({ data: applyFilters(rows).slice(0, n), error: null })
      },
      single: async () => {
        const rows = state.table === 'investment_assets' ? mockAssets
          : state.table === 'investment_positions' ? mockPositions
          : state.table === 'investment_transactions' ? mockTransactions
          : state.table === 'investment_accounts' ? mockAccounts
          : []
        const data = applyFilters(rows)[0] || null
        return { data }
      },
      insert: (payload: any) => {
        const row = Array.isArray(payload) ? payload[0] : payload
        if (state.table === 'investment_assets') {
          const id = `asset_${nextSeq()}`
          const newRow = { id, ticker: row.ticker, name: row.name, class: row.class }
          mockAssets.push(newRow as any)
          const chain = {
            select: () => ({
              single: async () => ({ data: { id } })
            })
          }
          return chain as any
        }
        if (state.table === 'investment_positions') {
          const id = `pos_${nextSeq()}`
          const newRow = { id, ...row }
          mockPositions.push(newRow as any)
          const chain = {
            select: () => ({
              single: async () => ({ data: newRow })
            })
          }
          return chain as any
        }
        if (state.table === 'investment_transactions') {
          const id = `tx_${nextSeq()}`
          const newRow = { id, ...row }
          mockTransactions.push(newRow as any)
          const chain = {
            select: () => ({
              single: async () => ({ data: newRow })
            })
          }
          return chain as any
        }
        if (state.table === 'investment_accounts') {
          const id = `acc_${nextSeq()}`
          const newRow = { id, user_id: row.user_id, name: row.name, broker: row.broker ?? null }
          mockAccounts.push(newRow as any)
          const chain = {
            select: () => ({
              single: async () => ({ data: newRow })
            })
          }
          return chain as any
        }
        return {} as any
      },
      update: (payload: any) => {
        (state as any).updatePayload = payload
        const chain: any = {
          eq: (col: string, val: any) => { state.filters[col] = val; return chain },
          select: () => chain,
          single: async () => {
            let rows = state.table === 'investment_positions' ? mockPositions : []
            const filtered = applyFilters(rows)
            const target = filtered[0]
            if (state.table === 'investment_positions' && target) {
              Object.assign(target, (state as any).updatePayload)
            }
            return { data: target || null }
          }
        }
        return chain
      },
      delete: () => {
        const chain: any = {
          eq: (col: string, val: any) => { state.filters[col] = val; return chain },
          select: () => chain,
          single: async () => {
            let rows = state.table === 'investment_positions' ? mockPositions : []
            const filtered = applyFilters(rows)
            const target = filtered[0]
            if (state.table === 'investment_positions' && target) {
              const idx = rows.findIndex(r => r.id === target.id)
              if (idx >= 0) rows.splice(idx, 1)
            }
            return { data: target || null }
          }
        }
        return chain
      }
    }
    return builder
  }
  return {
    createClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user_1', email: 'user1@example.com' } }, error: null })
      },
      from: (table: string) => makeBuilder(table)
    }),
    createServiceClient: () => ({
      from: (table: string) => makeBuilder(table)
    })
  }
})

beforeEach(() => {
  mockAssets = []
  mockPositions = []
  mockTransactions = []
  mockAccounts = []
  idSeq = 1
  jest.resetModules()
})

describe('Investments API', () => {
  it('POST /api/investments/accounts cria conta/corretora', async () => {
    const { POST } = await import('@/app/api/investments/accounts/route')
    const payload = {
      user_id: 'user_1',
      name: 'Conta Principal',
      broker: 'XP'
    }
    const res: any = await POST({ json: async () => payload } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.account?.name).toBe('Conta Principal')
  })

  it('POST /api/investments/contributions cria transação de compra', async () => {
    const { POST } = await import('@/app/api/investments/contributions/route')
    const payload = {
      user_id: 'user_1',
      ticker: 'BOVA11',
      asset_class: 'etf',
      quantity: 1,
      unit_price: 100.50,
      fees: 1.25,
      taxes: 0.75,
      date: new Date('2025-12-20').toISOString()
    }
    const res: any = await POST({ json: async () => payload } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockAssets.length).toBe(1)
    expect(mockTransactions.length).toBe(1)
    expect(mockTransactions[0].type).toBe('buy')
  })

  it('POST /api/investments/positions cria posição e cria asset se necessário', async () => {
    const { POST } = await import('@/app/api/investments/positions/route')
    const payload = {
      user_id: 'user_1',
      ticker: 'PETR4',
      class: 'stock',
      quantity: 10,
      avg_price: 25.30
    }
    const res: any = await POST({ json: async () => payload } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockAssets.length).toBe(1)
    expect(mockPositions.length).toBe(1)
    expect(mockPositions[0].quantity).toBe(10)
  })

  it('GET /api/investments/accounts retorna contas com sessão', async () => {
    const { POST, GET } = await import('@/app/api/investments/accounts/route')
    const createRes: any = await POST({ json: async () => ({
      user_id: 'user_1',
      name: 'Conta Sessao',
      broker: 'Clear'
    }) } as any)
    const created = await createRes.json()
    expect(createRes.status).toBe(200)
    expect(created.success).toBe(true)
    const res: any = await GET({ url: 'http://localhost/api/investments/accounts' } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(body.accounts)).toBe(true)
    expect(body.accounts.length).toBeGreaterThanOrEqual(1)
    expect(body.accounts[0].name).toBeDefined()
  })

  it('GET /api/investments/accounts sem sessão usa user_id (service)', async () => {
    jest.resetModules()
    jest.doMock('@/utils/supabase/server', () => {
      const makeBuilder = (table: string) => {
        const state: any = { table, filters: {} }
        const applyFilters = (rows: any[]) => rows.filter(row => Object.keys(state.filters).every(k => row[k] === state.filters[k]))
        const builder: any = {
          select: () => builder,
          eq: (col: string, val: any) => { state.filters[col] = val; return builder },
          in: (_: string, __: any[]) => builder,
          order: () => builder,
          limit: async (n: number) => {
            const rows = table === 'investment_accounts' ? mockAccounts : []
            return { data: applyFilters(rows).slice(0, n), error: null }
          },
          single: async () => {
            const rows = table === 'investment_accounts' ? mockAccounts : []
            const data = applyFilters(rows)[0] || null
            return { data }
          }
        }
        return builder
      }
      return {
        createClient: async () => ({
          auth: { getUser: async () => ({ data: { user: null }, error: null }) },
          from: (t: string) => makeBuilder(t)
        }),
        createServiceClient: () => ({
          from: (t: string) => makeBuilder(t)
        })
      }
    })
    const { GET } = await import('@/app/api/investments/accounts/route')
    mockAccounts.push({ id: 'acc_1', user_id: 'user_1', name: 'Conta Sem Sessao', broker: 'XP' } as any)
    const res: any = await GET({ url: 'http://localhost/api/investments/accounts?user_id=user_1' } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(body.accounts)).toBe(true)
    expect(body.accounts.length).toBeGreaterThanOrEqual(1)
    expect(body.accounts[0].name).toBe('Conta Sem Sessao')
  })

  it('PATCH /api/investments/positions atualiza quantidade e preço médio', async () => {
    jest.unmock('@/utils/supabase/server')
    const { POST, PATCH } = await import('@/app/api/investments/positions/route')
    const createRes: any = await POST({ json: async () => ({
      user_id: 'user_1', ticker: 'VALE3', class: 'stock', quantity: 5, avg_price: 60
    }) } as any)
    const created = await createRes.json()
    let posId = created?.position?.id ?? mockPositions[0]?.id
    if (!posId) {
      const newPos = { id: `pos_${nextSeq()}`, user_id: 'user_1', asset_id: 'asset_1', account_id: null, quantity: 5, avg_price: 60 }
      mockPositions.push(newPos as any)
      posId = newPos.id
    }
    const patchRes: any = await PATCH({ json: async () => ({
      user_id: 'user_1', position_id: posId, quantity: 8, avg_price: 55
    }) } as any)
    const patchBody = await patchRes.json()
    expect(patchRes.status).toBe(200)
    expect(patchBody.success).toBe(true)
    expect(mockPositions[0].quantity).toBe(8)
    expect(mockPositions[0].avg_price).toBe(55)
  })

  it('DELETE /api/investments/positions remove posição', async () => {
    jest.unmock('@/utils/supabase/server')
    const { POST, DELETE } = await import('@/app/api/investments/positions/route')
    const resCreate: any = await POST({ json: async () => ({
      user_id: 'user_1', ticker: 'ITUB4', class: 'stock', quantity: 3, avg_price: 30
    }) } as any)
    const bodyCreate = await resCreate.json()
    let id = bodyCreate?.position?.id ?? mockPositions[0]?.id
    if (!id) {
      const newPos = { id: `pos_${nextSeq()}`, user_id: 'user_1', asset_id: 'asset_1', account_id: null, quantity: 3, avg_price: 30 }
      mockPositions.push(newPos as any)
      id = newPos.id
    }
    const resDelete: any = await DELETE({ json: async () => ({ user_id: 'user_1', position_id: id }) } as any)
    const bodyDelete = await resDelete.json()
    expect(resDelete.status).toBe(200)
    expect(bodyDelete.success).toBe(true)
    expect(mockPositions.length).toBe(0)
  })
})
