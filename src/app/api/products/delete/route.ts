import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function DELETE(request: NextRequest) {
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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    await supabaseAdminService.deleteProduct(userId, productId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      supabaseSuccess: false,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    }, { status: 500 })
  }
}
