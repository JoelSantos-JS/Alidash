import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json() as { items: { id: string; order: number }[] }
    if (!body?.items || body.items.length === 0) {
      return NextResponse.json({ error: 'items é obrigatório' }, { status: 400 })
    }

    for (const item of body.items) {
      await supabase
        .from('product_images')
        .update({ order: item.order })
        .eq('id', item.id)
        .eq('user_id', userId)
        .eq('product_id', productId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
