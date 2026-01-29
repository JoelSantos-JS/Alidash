import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-service'

const ipLimits = new Map<string, { last: number; count: number }>()
const emailLimits = new Map<string, { last: number; count: number }>()
function isAdminAuthorized(request: NextRequest) {
  const expected = process.env.ADMIN_SIGNUP_API_KEY
  if (!expected) return false
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

async function sendPasswordRecoveryEmail(to: string, recoveryUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurado')
  }

  const fromAddress =
    process.env.NODE_ENV !== 'production'
      ? (process.env.EMAIL_FROM_DEV || 'VoxCash <onboarding@resend.dev>')
      : (process.env.EMAIL_FROM || 'VoxCash <no-reply@voxcash.app>')
  const fallbackFromAddress =
    process.env.NODE_ENV !== 'production'
      ? (process.env.EMAIL_FROM_DEV || 'VoxCash <onboarding@resend.dev>')
      : (process.env.EMAIL_FROM_FALLBACK || 'VoxCash <onboarding@resend.dev>')
  const subject = 'Redefinir sua senha - VoxCash'
  const html = `
    <div style="background: #f6f7fb; padding: 28px 16px; font-family: Arial, sans-serif; line-height: 1.5;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e9f0; border-radius: 14px; overflow: hidden;">
        <div style="padding: 20px 22px; background: linear-gradient(90deg, #2563eb, #4f46e5);">
          <div style="font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.85);">VoxCash</div>
          <div style="font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 6px;">Redefinir sua senha</div>
        </div>
        <div style="padding: 22px;">
          <p style="margin: 0 0 16px; color: #111827;">Clique no botão abaixo para redefinir sua senha.</p>
          <div style="text-align: center; margin: 18px 0 18px;">
            <a href="${recoveryUrl}" style="display: inline-block; padding: 14px 22px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 18px rgba(37,99,235,0.25);">
              Redefinir senha
            </a>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">Se você não solicitou isso, ignore este email.</p>
        </div>
      </div>
    </div>
  `

  const sendOnce = async (from: string) => {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    })

    const resendText = await resendResponse.text().catch(() => '')
    const resendData = (() => {
      try {
        return resendText ? JSON.parse(resendText) : {}
      } catch {
        return {}
      }
    })()

    if (!resendResponse.ok) {
      const msg =
        resendData?.error?.message ||
        resendData?.message ||
        resendText ||
        ''
      throw new Error(`Resend failed: ${resendResponse.status} ${msg}`.trim())
    }

    return resendData
  }

  try {
    return await sendOnce(fromAddress)
  } catch (err: any) {
    const msg = String(err?.message || '')
    const isDomainNotVerified =
      msg.includes('Resend failed: 403') &&
      msg.toLowerCase().includes('domain is not verified')
    if (isDomainNotVerified && fallbackFromAddress && fallbackFromAddress !== fromAddress) {
      return await sendOnce(fallbackFromAddress)
    }
    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim()
    const redirectTo = String(body?.redirectTo || '')

    if (!email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 })
    }

    const isAdmin = isAdminAuthorized(request)
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
      if (isAdmin) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      console.error('Erro ao gerar link de recuperação:', error)
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ success: true }, { status: 200 })
      }
      return NextResponse.json({ error: 'password_reset_unavailable' }, { status: 500 })
    }

    const recoveryUrl =
      (data as any)?.action_link ??
      (data as any)?.properties?.action_link ??
      null

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        recoveryUrl
      })
    }

    if (!recoveryUrl) {
      console.error('Link de recuperação ausente para email:', email)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (process.env.RESEND_API_KEY) {
      try {
        await sendPasswordRecoveryEmail(email, recoveryUrl)
        return NextResponse.json({ success: true }, { status: 200 })
      } catch (err: any) {
        if (isAdmin) {
          return NextResponse.json({ error: err?.message || 'Falha ao enviar email' }, { status: 500 })
        }

        const msg = String(err?.message || '')
        if (msg.includes('RESEND_API_KEY não configurado')) {
          return NextResponse.json({ error: 'email_not_configured' }, { status: 500 })
        }
        if (msg.includes('Resend failed: 403') && msg.toLowerCase().includes('domain is not verified')) {
          return NextResponse.json({ error: 'email_domain_not_verified' }, { status: 502 })
        }
        if (msg.includes('Resend failed: 401') || msg.toLowerCase().includes('api key')) {
          return NextResponse.json({ error: 'email_api_key_invalid' }, { status: 502 })
        }
        return NextResponse.json({ error: 'email_send_failed' }, { status: 502 })
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Recuperação de senha (dev):', { email, recoveryUrl })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Serviço de email não configurado' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}

type DeleteOutcome = { table: string; deleted: number; error?: string }

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase()
}

function isMissingTableError(err: any) {
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('could not find the') && msg.includes('in the schema cache')
}

async function deleteByUserId(admin: any, table: string, userId: string): Promise<DeleteOutcome> {
  try {
    const res = await admin.from(table).delete({ count: 'exact' }).eq('user_id', userId)
    if (res.error) {
      if (isMissingTableError(res.error)) return { table, deleted: 0 }
      return { table, deleted: 0, error: res.error.message }
    }
    return { table, deleted: Number(res.count || 0) }
  } catch (err: any) {
    if (isMissingTableError(err)) return { table, deleted: 0 }
    return { table, deleted: 0, error: String(err?.message || err || '') || 'Erro ao deletar' }
  }
}

async function deleteIn(admin: any, table: string, column: string, ids: Array<string | number>): Promise<DeleteOutcome> {
  const safe = (ids || []).filter(v => v !== null && v !== undefined && String(v) !== '')
  if (safe.length === 0) return { table, deleted: 0 }
  const chunkSize = 250
  let deleted = 0
  for (let i = 0; i < safe.length; i += chunkSize) {
    const chunk = safe.slice(i, i + chunkSize)
    try {
      const res = await admin.from(table).delete({ count: 'exact' }).in(column, chunk)
      if (res.error) {
        if (isMissingTableError(res.error)) return { table, deleted: 0 }
        return { table, deleted, error: res.error.message }
      }
      deleted += Number(res.count || 0)
    } catch (err: any) {
      if (isMissingTableError(err)) return { table, deleted: 0 }
      return { table, deleted, error: String(err?.message || err || '') || 'Erro ao deletar' }
    }
  }
  return { table, deleted }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({} as any))
    const email = normalizeEmail(body?.email)
    if (!email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    }

    if (!supabaseAdmin || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 })
    }

    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('id,email')
      .eq('email', email)
      .single()

    if (userErr || !userRow?.id) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userId = String(userRow.id)
    const admin = supabaseAdmin

    const outcomes: DeleteOutcome[] = []

    const { data: debts } = await admin.from('debts').select('id').eq('user_id', userId)
    const debtIds = (debts || []).map((d: any) => String(d.id)).filter(Boolean)
    outcomes.push(await deleteIn(admin, 'debt_payments', 'debt_id', debtIds))

    const { data: goals } = await admin.from('goals').select('id').eq('user_id', userId)
    const goalIds = (goals || []).map((g: any) => String(g.id)).filter(Boolean)
    outcomes.push(await deleteIn(admin, 'goal_milestones', 'goal_id', goalIds))
    outcomes.push(await deleteIn(admin, 'goal_reminders', 'goal_id', goalIds))

    const { data: assets } = await admin.from('investment_assets').select('id').eq('user_id', userId)
    const assetIds = (assets || []).map((a: any) => String(a.id)).filter(Boolean)
    outcomes.push(await deleteIn(admin, 'investment_prices', 'asset_id', assetIds))

    const directByUserId = [
      'sales',
      'product_images',
      'revenues',
      'expenses',
      'transactions',
      'debts',
      'goals',
      'products',
      'categories',
      'budgets',
      'personal_incomes',
      'personal_expenses',
      'personal_goals',
      'personal_categories',
      'personal_budgets',
      'personal_salary_settings',
      'calendar_events',
      'calendar_settings',
      'calendar_sync_settings',
      'calendar_sync_logs',
      'notification_logs',
      'notification_preferences',
      'push_subscriptions',
      'catalog_tokens',
      'firebase_backup',
      'user_webhooks',
      'webhook_events',
      'bets',
      'dreams',
      'investment_transactions',
      'investment_positions',
      'investment_assets',
      'investment_accounts',
    ]

    for (const table of directByUserId) {
      outcomes.push(await deleteByUserId(admin, table, userId))
    }

    const errors = outcomes.filter(o => o.error)
    const deletedTotal = outcomes.reduce((acc, o) => acc + (Number(o.deleted) || 0), 0)

    return NextResponse.json({
      success: errors.length === 0,
      email,
      userId,
      deletedTotal,
      outcomes,
      errors,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno do servidor' }, { status: 500 })
  }
}
