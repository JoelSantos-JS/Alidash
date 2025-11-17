import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const ct = request.headers.get('content-type') || ''
    let payload: any = {}
    if (ct.includes('application/json')) {
      try {
        payload = await request.json()
      } catch {}
    } else {
      try {
        const textBody = await request.text()
        payload = JSON.parse(textBody)
      } catch {}
    }

    const event = String(payload?.event || '')
    const allowed = new Set(['purchase_approved', 'assinatura_criada', 'subscription_created'])
    if (!allowed.has(event)) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const email = payload?.email ?? payload?.customer?.email ?? payload?.buyer?.email
    const rawUserId = payload?.user_id ?? payload?.userId ?? payload?.customer?.id

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
      return NextResponse.json({ success: true, processed: false })
    }

    const updated = await supabaseAdminService.updateUserAccountType(user.id, 'pro')
    return NextResponse.json({ success: true, user: { id: updated.id, account_type: updated.account_type }, event })
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