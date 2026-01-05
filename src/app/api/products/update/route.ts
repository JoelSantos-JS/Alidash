import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { Product } from '@/types'

export async function PUT(request: NextRequest) {
  try {
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
