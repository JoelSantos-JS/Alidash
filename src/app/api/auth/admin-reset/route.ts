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
