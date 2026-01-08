import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createServiceClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
    const body = await request.json()
    const { user_id, transaction } = body
    if (!transaction || !transaction.id) {
      return NextResponse.json({ error: 'transaction.id é obrigatório' }, { status: 400 })
    }
    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || (user_id && user.id !== user_id)) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const svc = createServiceClient()
    let internalUserId = user_id
    const { data: byId } = await svc
      .from('users')
      .select('id, account_type, created_at')
      .eq('id', user_id)
      .single()
    let resolved = byId || null
    if (!resolved) {
      const { data: byFirebase } = await svc
        .from('users')
        .select('id, account_type, created_at')
        .eq('firebase_uid', user_id)
        .single()
      resolved = byFirebase || null
    }
    if (!resolved) {
      internalUserId = user_id
    } else {
      internalUserId = resolved.id
    }
    const updates: any = {}
    if (transaction.description !== undefined) updates.description = transaction.description
    if (transaction.amount !== undefined) updates.amount = transaction.amount
    if (transaction.type !== undefined) updates.type = transaction.type
    if (transaction.category !== undefined) updates.category = transaction.category
    if (transaction.subcategory !== undefined) updates.subcategory = transaction.subcategory
    if (transaction.paymentMethod !== undefined) updates.paymentMethod = transaction.paymentMethod
    if (transaction.status !== undefined) updates.status = transaction.status
    if (transaction.notes !== undefined) updates.notes = transaction.notes
    if (transaction.tags !== undefined) updates.tags = transaction.tags
    if (transaction.date !== undefined) updates.date = transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
    if (transaction.isInstallment !== undefined) updates.isInstallment = transaction.isInstallment
    if (transaction.installmentInfo !== undefined) updates.installmentInfo = transaction.installmentInfo
    const updated = await supabaseAdminService.updateTransaction(internalUserId, transaction.id, updates)
    return NextResponse.json({ success: true, transaction: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
