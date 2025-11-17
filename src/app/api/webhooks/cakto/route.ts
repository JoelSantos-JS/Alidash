import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const event = payload?.event
    if (event === 'pix_gerado') {
      const pix = {
        qrCode: payload?.pix?.qrCode ?? payload?.qrCode ?? null,
        expirationDate: payload?.pix?.expirationDate ?? payload?.expirationDate ?? null
      }
      return NextResponse.json({ success: true, event: 'pix_gerado', pix })
    }
    if (event !== 'purchase_approved') {
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
    return NextResponse.json({ success: true, user: { id: updated.id, account_type: updated.account_type } })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}