import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

function safeParseJson<T>(value: any, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return fallback
    try {
      return JSON.parse(s)
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object') return value as T
  return fallback
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limitRaw = searchParams.get('limit')
    const limit = Math.max(1, Math.min(500, parseInt(limitRaw || '50') || 50))
    

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user_id)
      .eq('event_type', 'reminder')
      .order('start_time', { ascending: true })
      .limit(limit)

    if (start_date) {
      query = query.gte('start_time', start_date)
    }
    if (end_date) {
      query = query.lte('start_time', end_date)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar lembretes' }, { status: 500 })
    }

    const reminders = (data || []).map(r => {
      const attendees = safeParseJson<any[]>(r?.attendees, [])
      const recurrence = safeParseJson<any>(r?.recurrence, null)
      const priority = (r as any)?.priority ?? 'medium'
      return {
        ...r,
        attendees,
        recurrence,
        priority,
        event_type: 'reminder'
      }
    })

    return NextResponse.json({ success: true, reminders })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      title,
      description,
      date,
      time,
      is_all_day,
      priority,
      message
    } = body

    if (!user_id || !title || !date) {
      if (!user_id || !message) {
        return NextResponse.json({ error: 'user_id, title e date são obrigatórios' }, { status: 400 })
      }
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const parseDayFromMessage = (m: string) => {
      const patterns = [/dia\s+(\d{1,2})/i, /no\s+dia\s+(\d{1,2})/i, /(\d{1,2})\s+de\s+cada\s+m[eê]s/i]
      for (const p of patterns) {
        const match = m.match(p)
        if (match && match[1]) {
          const d = parseInt(match[1], 10)
          if (d >= 1 && d <= 31) return d
        }
      }
      return null
    }
    const buildTitleFromMessage = (m: string) => {
      let t = m.trim()
      t = t.replace(/^me\s+lembra(r|)\s+de\s+/i, '')
      t = t.replace(/^lembra(r|)\s+de\s+/i, '')
      t = t.replace(/\s+todo\s+m[eê]s.*$/i, '')
      t = t.replace(/\s+mensal.*$/i, '')
      const d = parseDayFromMessage(m)
      if (d) t = t.replace(new RegExp(`\\s*(dia\\s+${d}|no\\s+dia\\s+${d}|${d}\\s+de\\s+cada\\s+m[eê]s)`, 'i'), '')
      t = t.trim()
      if (!t) return 'Lembrete'
      return t.charAt(0).toUpperCase() + t.slice(1)
    }
    const nextMonthly = (day: number) => {
      const tzDate = new Date()
      const y = tzDate.getFullYear()
      const m = tzDate.getMonth()
      const candidate = new Date(Date.UTC(y, m, Math.min(day, 28), 0, 0, 0))
      const nowUTC = new Date()
      if (candidate <= nowUTC) {
        const next = new Date(Date.UTC(y, m + 1, Math.min(day, 28), 0, 0, 0))
        return next
      }
      return candidate
    }

    let start: Date
    let end: Date
    let finalTitle = title
    let finalDescription = description || ''
    let finalIsRecurring = false
    let finalRecurrenceRule: string | null = null
    let finalIsAllDay: boolean
    

    if (message && (!date || !time)) {
      const day = parseDayFromMessage(message) || 7
      finalTitle = buildTitleFromMessage(message)
      finalDescription = description || message
      const next = nextMonthly(day)
      start = next
      end = new Date(start.getTime() + 60_000)
      finalIsRecurring = true
      finalRecurrenceRule = `FREQ=MONTHLY;BYMONTHDAY=${day}`
      finalIsAllDay = true
    } else {
      const timePart = time ? `${time}:00` : '00:00:00'
      start = new Date(`${date}T${timePart}`)
      end = new Date(start.getTime() + 60_000)
      finalIsRecurring = false
      finalRecurrenceRule = null
      finalIsAllDay = !!(is_all_day || !time)
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id,
        title: finalTitle,
        description: finalDescription || '',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'confirmed',
        is_all_day: finalIsAllDay,
        event_type: 'reminder',
        is_recurring: finalIsRecurring,
        recurrence_rule: finalRecurrenceRule,
        timezone: 'America/Sao_Paulo'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar lembrete' }, { status: 500 })
    }

    const reminder = {
      ...data,
      attendees: safeParseJson<any[]>(data?.attendees, []),
      recurrence: safeParseJson<any>(data?.recurrence, null),
      priority: priority ?? (message ? 'medium' : 'medium'),
      event_type: 'reminder'
    }

    return NextResponse.json({ success: true, reminder })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      user_id,
      title,
      description,
      date,
      time,
      status,
      is_all_day,
      priority
    } = body

    if (!id || !user_id) {
      return NextResponse.json({ error: 'id e user_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const update: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) update.title = title
    if (description !== undefined) update.description = description
    if (status !== undefined) update.status = status
    if (date !== undefined) {
      const timePart = time ? `${time}:00` : '00:00:00'
      const start = new Date(`${date}T${timePart}`)
      const end = new Date(start.getTime() + 60_000)
      update.start_time = start.toISOString()
      update.end_time = end.toISOString()
    }
    if (is_all_day !== undefined || time !== undefined) {
      update.is_all_day = !!(is_all_day || !time)
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update(update)
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('event_type', 'reminder')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar lembrete' }, { status: 500 })
    }

    const reminder = {
      ...data,
      attendees: safeParseJson<any[]>(data?.attendees, []),
      recurrence: safeParseJson<any>(data?.recurrence, null),
      priority: priority ?? 'medium',
      event_type: 'reminder'
    }

    return NextResponse.json({ success: true, reminder })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'id e user_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('event_type', 'reminder')

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir lembrete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
