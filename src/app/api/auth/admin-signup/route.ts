import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-service'

const ipLimits = new Map<string, { last: number; count: number }>()
const emailLimits = new Map<string, { last: number; count: number }>()
function isAdminAuthorized(request: NextRequest) {
  const expected = process.env.ADMIN_SIGNUP_API_KEY
  if (!expected) return process.env.NODE_ENV !== 'production'
  const provided = request.headers.get('x-api-key')
  return !!provided && provided === expected
}
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
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await request.json()
    const email = String(body?.email || '').trim()
    const password = String(body?.password || '')
    const name = (body?.name ? String(body.name).trim() : null) as string | null

    if (!email || !password) {
      return NextResponse.json({ error: 'email e password são obrigatórios' }, { status: 400 })
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

    // Criar usuário diretamente via Admin API (sem enviar email de confirmação)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || null,
        full_name: name || null,
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const authUser = created?.user
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Falha ao criar usuário de autenticação' }, { status: 500 })
    }

    // Upsert na tabela users
    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUser.id,
        email,
        name: name || email.split('@')[0],
        account_type: 'personal',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (upsertError) {
      // Não bloquear cadastro por erro não crítico na tabela de usuários
      console.warn('Aviso: erro ao upsert usuário na tabela users:', upsertError.message)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email,
        name: name || email.split('@')[0]
      },
      tableUser: upserted || null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
