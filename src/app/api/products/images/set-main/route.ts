import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')
    const imageId = searchParams.get('image_id')

    if (!userId || !productId || !imageId) {
      return NextResponse.json({ error: 'user_id, product_id e image_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: target } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    const { data: currentMain } = await supabase
      .from('product_images')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('type', 'main')
      .limit(1)

    if (currentMain && currentMain.length > 0) {
      await supabase
        .from('product_images')
        .update({ type: 'gallery' })
        .eq('id', currentMain[0].id)
    }

    await supabase
      .from('product_images')
      .update({ type: 'main' })
      .eq('id', imageId)

    await supabase
      .from('products')
      .update({ image_url: target?.url || '' })
      .eq('id', productId)
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
