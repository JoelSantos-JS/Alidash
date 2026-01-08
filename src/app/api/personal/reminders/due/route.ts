import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

function parseMonthlyDay(rule: string | null): number | null {
  if (!rule) return null
  const m = rule.match(/BYMONTHDAY=(\d{1,2})/i)
  if (m && m[1]) {
    const d = parseInt(m[1], 10)
    if (d >= 1 && d <= 31) return d
  }
  return null
}

function sameDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const send = searchParams.get('send') === 'true'
    const dateParam = searchParams.get('date')
    const target = dateParam ? new Date(dateParam) : new Date()

    const supabase = createServiceClient()
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('event_type', 'reminder')
      .neq('status', 'cancelled')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: events, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar lembretes' }, { status: 500 })
    }

    const due: any[] = []
    for (const e of events || []) {
      const isRecurring = !!e.is_recurring
      const day = parseMonthlyDay(e.recurrence_rule || null)
      if (isRecurring && day) {
        if (target.getUTCDate() === day) {
          due.push(e)
        }
        continue
      }
      const start = new Date(e.start_time)
      if (sameDay(start, target)) {
        due.push(e)
      }
    }

    let sendResults: any[] | null = null
    if (send && due.length > 0) {
      const origin = new URL(request.url).origin
      const results: any[] = []
      for (const e of due) {
        try {
          const res = await fetch(`${origin}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: e.user_id,
              notification: {
                title: e.title || 'Lembrete',
                body: e.description || 'Você tem um lembrete para hoje',
                type: 'calendar_event',
                eventId: e.id,
                data: { is_all_day: e.is_all_day, priority: e.priority || 'medium' }
              }
            })
          })
          const payload = await res.json()
          results.push({ event_id: e.id, status: res.status, response: payload })
        } catch (err: any) {
          results.push({ event_id: e.id, error: err?.message || 'Erro ao enviar' })
        }
      }
      sendResults = results
    }

    return NextResponse.json({ success: true, date: target.toISOString(), count: due.length, due, sendResults })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

