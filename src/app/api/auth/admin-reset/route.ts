import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-service'

const ipLimits = new Map<string, { last: number; count: number }>()
const emailLimits = new Map<string, { last: number; count: number }>()
function withinLimit(map: Map<string, { last: number; count: number }>, key: string, max: number, windowMs: number) {
  const now = Date.now()
  const cur = map.get(key)
  if (!cur || now - cur.last > windowMs) {
    map.set(key, { last: now, count: 1 })
    return true
  }
  const next = { last: cur.last, count: cur.count + 1 }
  map.set(key, next)
  return next.count <= max
}

export async function POST(request: NextRequest) {
  try {
    const configuredKey = process.env.ADMIN_SIGNUP_API_KEY
    if (configuredKey) {
      const provided = request.headers.get('x-api-key') || ''
      if (provided !== configuredKey) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
      }
    }
    const body = await request.json()
    const email = String(body?.email || '').trim()
    const redirectTo = String(body?.redirectTo || '')

    if (!email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 })
    }
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const minuteWindow = 60_000
    if (!withinLimit(ipLimits, ip, 3, minuteWindow)) {
      return NextResponse.json({ error: 'rate_limit_ip' }, { status: 429 })
    }
    if (!withinLimit(emailLimits, email, 1, minuteWindow)) {
      return NextResponse.json({ error: 'rate_limit_email' }, { status: 429 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo || undefined
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      recoveryUrl: data?.action_link || null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
