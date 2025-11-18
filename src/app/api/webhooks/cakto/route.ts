import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    let payload: any = {}
    if (ct.includes('application/json')) {
      try {
        payload = await request.json()
      } catch {}
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      try {
        const textBody = await request.text()
        const params = new URLSearchParams(textBody)
        payload = Object.fromEntries(params.entries())
        if (payload.payload) {
          try { payload = JSON.parse(payload.payload as string) } catch {}
        }
      } catch {}
    } else if (ct.includes('multipart/form-data')) {
      try {
        const fd = await request.formData()
        payload = Object.fromEntries(fd.entries())
        if (payload.payload && typeof payload.payload === 'string') {
          try { payload = JSON.parse(payload.payload) } catch {}
        }
      } catch {}
    } else {
      try {
        const textBody = await request.text()
        payload = JSON.parse(textBody)
      } catch {}
    }

    const configuredSecret = process.env.CAKTO_WEBHOOK_SECRET
    if (configuredSecret && payload?.secret !== configuredSecret) {
      return NextResponse.json({ success: false, error: 'invalid_secret' }, { status: 401 })
    }

    const event = String(payload?.event || '')
    const allowed = new Set(['purchase_approved', 'assinatura_criada', 'subscription_created', 'pix_gerado'])
    if (!allowed.has(event)) {
      return NextResponse.json({ success: true, ignored: true })
    }

    if (event === 'pix_gerado') {
      const headersObj = Object.fromEntries(request.headers)
      const data = payload?.data ?? payload
      const pixData: any = data?.pix ?? null
      const pix = {
        qrCode: pixData?.qrCode ?? pixData?.qrcode ?? pixData?.qr_code ?? pixData?.qrCodeBase64 ?? pixData?.qr_code_base64 ?? pixData?.qrImage ?? pixData?.base64 ?? null,
        copyPaste: pixData?.copyPaste ?? pixData?.copy_and_paste ?? pixData?.payload ?? pixData?.emv ?? null,
        expirationDate: pixData?.expirationDate ?? pixData?.expires_at ?? data?.due_date ?? null
      }
      const summary = {
        refId: data?.refId ?? data?.ref_id ?? null,
        status: data?.status ?? null,
        amount: data?.amount ?? data?.baseAmount ?? null,
        dueDate: data?.due_date ?? null,
        paymentMethod: data?.paymentMethod ?? data?.paymentMethodName ?? null
      }
      const logPayload = JSON.parse(JSON.stringify({ headers: headersObj, event, pixData, summaryCandidate: summary, raw: payload }))
      console.log('cakto pix_gerado', JSON.stringify(logPayload))
      return NextResponse.json({ success: true, event, pix, summary, payload })
    }

    const data = payload?.data ?? {}
    const email = payload?.email ?? payload?.customer?.email ?? payload?.buyer?.email ?? data?.customer?.email ?? data?.subscription?.customer?.email
    const planName = (data?.offer?.name || '').toLowerCase()
    const amount = Number(data?.amount ?? data?.subscription?.amount ?? 0)
    const isBasic = planName.includes('básico') || planName.includes('basico') || amount === 19 || amount === 19.0 || amount === 19.99
    const targetAccountType = isBasic ? 'basic' : 'pro'
    const rawUserId = payload?.user_id ?? payload?.userId ?? payload?.customer?.id ?? data?.customer?.id ?? data?.customer?.uuid ?? data?.subscription?.id

    let user: any = null
    if (email) {
      try {
        user = await supabaseAdminService.getUserByEmail(email)
      } catch {}
    }
    if (!user && rawUserId) {
      try {
        user = await supabaseAdminService.getUserById(String(rawUserId))
      } catch {}
    }

    if (!user) {
      if (!email) {
        return NextResponse.json({ success: true, processed: false })
      }
      let authCreated: any = null
      try {
        authCreated = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'dash123',
          email_confirm: true
        })
      } catch {}
      const created = await supabaseAdminService.createUser({
        id: authCreated?.data?.user?.id,
        email,
        name: data?.customer?.name ?? null,
        avatar_url: null,
        account_type: targetAccountType
      })
      return NextResponse.json({ success: true, user: { id: created.id, account_type: created.account_type }, event, created: true, plan: targetAccountType })
    }

    const updated = await supabaseAdminService.updateUserAccountType(user.id, targetAccountType)
    return NextResponse.json({ success: true, user: { id: updated.id, account_type: updated.account_type }, event, plan: targetAccountType })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function HEAD() {
  return new NextResponse(null)
}