import { describe, it, expect, beforeEach, jest } from '@jest/globals'

;(global as any).Request = class {}
;(global as any).Response = class { static json(body: any, init?: any) { return { status: init?.status ?? 200, json: async () => body } } }

jest.mock('next/server', () => ({
  NextResponse: { json: (body: any, init?: any) => ({ status: init?.status ?? 200, json: async () => body }) },
  NextRequest: class {}
}))

let mockAuthUser: any = { id: 'u1' }
let forceSelectError = false
let forceInsertError = false
let forceUpdateError = false
let forceDeleteError = false

const makeBuilder = (table: string) => {
  const rows = [
    {
      id: 'rem_1',
      user_id: 'u1',
      title: 'Lembrete 1',
      description: '',
      start_time: new Date('2026-01-09T12:00:00Z').toISOString(),
      end_time: new Date('2026-01-09T12:00:00Z').toISOString(),
      status: 'confirmed',
      is_all_day: false,
      event_type: 'reminder',
      created_at: new Date('2026-01-01T10:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T10:00:00Z').toISOString()
    },
    {
      id: 'rem_2',
      user_id: 'u1',
      title: 'Lembrete 2',
      description: '',
      start_time: new Date('2026-01-15T09:30:00Z').toISOString(),
      end_time: new Date('2026-01-15T10:00:00Z').toISOString(),
      status: 'confirmed',
      is_all_day: false,
      event_type: 'reminder',
      created_at: new Date('2026-01-02T10:00:00Z').toISOString(),
      updated_at: new Date('2026-01-02T10:00:00Z').toISOString(),
      attendees: JSON.stringify(['a@b.com', 'c@d.com']),
      recurrence: JSON.stringify({ freq: 'daily', interval: 1 })
    }
  ]
  const state: any = {
    op: null as null | 'select' | 'insert' | 'update' | 'delete',
    lastInsert: false,
    lastUpdate: false,
    filters: {} as Record<string, any>,
    insertPayload: null as any,
    updatePayload: null as any,
    limit: undefined as number | undefined
  }
  const builder: any = {
    select: jest.fn(() => { state.op = 'select'; return builder }),
    insert: jest.fn((payload?: any) => { state.op = 'insert'; state.lastInsert = true; state.insertPayload = Array.isArray(payload) ? payload[0] : payload; return builder }),
    update: jest.fn((payload?: any) => { state.op = 'update'; state.lastUpdate = true; state.updatePayload = payload; return builder }),
    delete: jest.fn(() => { state.op = 'delete'; return builder }),
    eq: jest.fn((col: string, val: any) => { state.filters[col] = val; return builder }),
    order: jest.fn(() => builder),
    limit: jest.fn((n: number) => { state.limit = n; return builder }),
    gte: jest.fn((col: string, val: any) => { state.filters[`${col}_gte`] = val; return builder }),
    lte: jest.fn((col: string, val: any) => { state.filters[`${col}_lte`] = val; return builder }),
    single: jest.fn(async () => {
      if (table === 'calendar_events') {
        if (state.op === 'insert' || state.lastInsert) {
          if (forceInsertError) return { data: null, error: { message: 'insert error' } }
          return { data: { id: 'rem_new', ...state.insertPayload }, error: null }
        }
        if (state.op === 'update' || state.lastUpdate) {
          if (forceUpdateError) return { data: null, error: { message: 'update error' } }
          return { data: { id: state.filters['id'] || 'rem_1', ...state.updatePayload }, error: null }
        }
      }
      return { data: null, error: null }
    }),
    then: (resolve: any) => {
      if (state.op === 'delete') {
        if (forceDeleteError) return resolve({ error: { message: 'delete error' } })
        return resolve({ error: null })
      }
      if (state.op === 'select') {
        if (forceSelectError) return resolve({ data: null, error: { message: 'select error' } })
        let result = rows.slice()
        if (state.filters['user_id']) {
          result = result.filter(r => r.user_id === state.filters['user_id'])
        }
        if (state.filters['event_type']) {
          result = result.filter(r => r.event_type === state.filters['event_type'])
        }
        if (state.filters['start_time_gte']) {
          const min = new Date(state.filters['start_time_gte']).getTime()
          result = result.filter(r => new Date(r.start_time).getTime() >= min)
        }
        if (state.filters['start_time_lte']) {
          const max = new Date(state.filters['start_time_lte']).getTime()
          result = result.filter(r => new Date(r.start_time).getTime() <= max)
        }
        result = result.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        if (typeof state.limit === 'number') {
          result = result.slice(0, state.limit)
        }
        return resolve({ data: result, error: null })
      }
      return resolve({ data: null, error: null })
    }
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

describe('API de Lembretes Pessoais', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthUser = { id: 'u1' }
    forceSelectError = false
    forceInsertError = false
    forceUpdateError = false
    forceDeleteError = false
  })

  it('GET retorna 400 quando falta user_id', async () => {
    const { GET } = await import('../../app/api/personal/reminders/route')
    const res: any = await GET({ url: 'http://x/api/personal/reminders' } as any)
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toBe('user_id é obrigatório')
  })

  it('GET retorna 401 quando não autenticado', async () => {
    mockAuthUser = null
    const { GET } = await import('../../app/api/personal/reminders/route')
    const res: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1' } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('GET lista lembretes do usuário', async () => {
    const { GET } = await import('../../app/api/personal/reminders/route')
    const res: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1&start_date=2026-01-01T00:00:00.000Z&end_date=2026-01-31T23:59:59.999Z&limit=50' } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.reminders)).toBe(true)
    expect(body.reminders.length).toBeGreaterThanOrEqual(2)
    expect(body.reminders[0].event_type).toBe('reminder')
  })

  it('POST cria lembrete com sucesso', async () => {
    const { POST } = await import('../../app/api/personal/reminders/route')
    const payload = {
      user_id: 'u1',
      title: 'Novo lembrete',
      description: 'Desc',
      date: '2026-01-20',
      time: '',
      is_all_day: true,
      priority: 'high'
    }
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => payload } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.reminder).toBeDefined()
    expect(body.reminder.event_type).toBe('reminder')
  })

  it('POST retorna 400 quando faltam campos obrigatórios', async () => {
    const { POST } = await import('../../app/api/personal/reminders/route')
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => ({ title: 'X' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(400)
  })

  it('PUT atualiza lembrete com sucesso', async () => {
    const { PUT } = await import('../../app/api/personal/reminders/route')
    const res: any = await PUT({ url: 'http://x/api/personal/reminders', json: async () => ({ id: 'rem_2', user_id: 'u1', status: 'cancelled' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.reminder).toBeDefined()
  })

  it('DELETE remove lembrete com sucesso', async () => {
    const { DELETE } = await import('../../app/api/personal/reminders/route')
    const res: any = await DELETE({ url: 'http://x/api/personal/reminders?id=rem_2&user_id=u1' } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('GET aplica filtros de data e limit', async () => {
    const { GET } = await import('../../app/api/personal/reminders/route')
    const resAll: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1&limit=1' } as any)
    const bodyAll = await resAll.json()
    expect(resAll.status).toBe(200)
    expect(bodyAll.reminders.length).toBe(1)
    const resRange: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1&start_date=2026-01-10T00:00:00.000Z&end_date=2026-01-31T23:59:59.999Z' } as any)
    const bodyRange = await resRange.json()
    expect(bodyRange.reminders.length).toBe(1)
    expect(new Date(bodyRange.reminders[0].start_time).toISOString()).toBe(new Date('2026-01-15T09:30:00Z').toISOString())
  })

  it('GET retorna prioridade padrão e parseia attendees/recurrence', async () => {
    const { GET } = await import('../../app/api/personal/reminders/route')
    const res: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1' } as any)
    const body = await res.json()
    const r2 = body.reminders.find((r: any) => r.id === 'rem_2')
    expect(r2.priority).toBe('medium')
    expect(Array.isArray(r2.attendees)).toBe(true)
    expect(r2.attendees.length).toBe(2)
    expect(typeof r2.recurrence).toBe('object')
    expect(r2.recurrence.freq).toBe('daily')
  })

  it('GET retorna lista vazia quando consulta falha', async () => {
    forceSelectError = true
    const { GET } = await import('../../app/api/personal/reminders/route')
    const res: any = await GET({ url: 'http://x/api/personal/reminders?user_id=u1' } as any)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erro ao buscar lembretes')
  })

  it('POST respeita is_all_day quando horário é fornecido', async () => {
    const { POST } = await import('../../app/api/personal/reminders/route')
    const payload = {
      user_id: 'u1',
      title: 'Com horário',
      date: '2026-01-21',
      time: '09:30',
      is_all_day: false
    }
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => payload } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.reminder.is_all_day).toBe(false)
  })

  it('POST retorna 401 quando usuário é diferente', async () => {
    mockAuthUser = { id: 'u2' }
    const { POST } = await import('../../app/api/personal/reminders/route')
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => ({ user_id: 'u1', title: 'X', date: '2026-01-20' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('POST retorna 500 em erro de inserção', async () => {
    forceInsertError = true
    const { POST } = await import('../../app/api/personal/reminders/route')
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => ({ user_id: 'u1', title: 'X', date: '2026-01-20' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erro ao criar lembrete')
  })

  it('POST retorna 500 ao receber data inválida', async () => {
    const { POST } = await import('../../app/api/personal/reminders/route')
    const res: any = await POST({ url: 'http://x/api/personal/reminders', json: async () => ({ user_id: 'u1', title: 'X', date: 'invalid-date' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erro interno do servidor')
  })

  it('PUT retorna 400 quando falta id', async () => {
    const { PUT } = await import('../../app/api/personal/reminders/route')
    const res: any = await PUT({ url: 'http://x/api/personal/reminders', json: async () => ({ user_id: 'u1' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(400)
  })

  it('PUT retorna 401 quando não autenticado', async () => {
    mockAuthUser = null
    const { PUT } = await import('../../app/api/personal/reminders/route')
    const res: any = await PUT({ url: 'http://x/api/personal/reminders', json: async () => ({ id: 'rem_1', user_id: 'u1', status: 'cancelled' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('PUT atualiza data, horário e is_all_day', async () => {
    const { PUT } = await import('../../app/api/personal/reminders/route')
    const res: any = await PUT({ url: 'http://x/api/personal/reminders', json: async () => ({ id: 'rem_1', user_id: 'u1', date: '2026-01-22', time: '14:00', is_all_day: false }) } as any)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(new Date(body.reminder.start_time).toISOString()).toBe(new Date('2026-01-22T14:00:00').toISOString())
    expect(body.reminder.is_all_day).toBe(false)
  })

  it('PUT retorna 500 em erro de atualização', async () => {
    forceUpdateError = true
    const { PUT } = await import('../../app/api/personal/reminders/route')
    const res: any = await PUT({ url: 'http://x/api/personal/reminders', json: async () => ({ id: 'rem_1', user_id: 'u1', status: 'cancelled' }) } as any)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erro ao atualizar lembrete')
  })

  it('DELETE retorna 400 quando faltam parâmetros', async () => {
    const { DELETE } = await import('../../app/api/personal/reminders/route')
    const res: any = await DELETE({ url: 'http://x/api/personal/reminders?id=rem_2' } as any)
    const body = await res.json()
    expect(res.status).toBe(400)
  })

  it('DELETE retorna 401 quando não autenticado', async () => {
    mockAuthUser = null
    const { DELETE } = await import('../../app/api/personal/reminders/route')
    const res: any = await DELETE({ url: 'http://x/api/personal/reminders?id=rem_2&user_id=u1' } as any)
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.error).toBe('Não autenticado')
  })

  it('DELETE retorna 500 em erro de exclusão', async () => {
    forceDeleteError = true
    const { DELETE } = await import('../../app/api/personal/reminders/route')
    const res: any = await DELETE({ url: 'http://x/api/personal/reminders?id=rem_2&user_id=u1' } as any)
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Erro ao excluir lembrete')
  })
})
