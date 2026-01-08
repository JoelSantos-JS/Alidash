import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { Product } from '@/types'

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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id é obrigatório' },
        { status: 400 }
      )
    }

    const updates: Partial<Product> = await request.json()

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    await supabaseAdminService.updateProduct(userId, productId, updates)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao atualizar produto:', message)
    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar produto',
      details: message
    }, { status: 500 })
  }
}
