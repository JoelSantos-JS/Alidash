import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')
    const imageId = searchParams.get('image_id')

    if (!userId || !productId || !imageId) {
      return NextResponse.json({ error: 'user_id, product_id e image_id são obrigatórios' }, { status: 400 })
    }

    const { data: image } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (image?.path) {
      try {
        await supabase.storage.from('product-images').remove([image.path])
      } catch {}
    }

    if (image?.type === 'main') {
      const { data: nextMain } = await supabase
        .from('product_images')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .order('order', { ascending: true })
        .limit(1)
      if (nextMain && nextMain.length > 0) {
        const newMain = nextMain[0]
        await supabase
          .from('product_images')
          .update({ type: 'main' })
          .eq('id', newMain.id)
        await supabase
          .from('products')
          .update({ image_url: newMain.url })
          .eq('id', productId)
          .eq('user_id', userId)
      } else {
        await supabase
          .from('products')
          .update({ image_url: '' })
          .eq('id', productId)
          .eq('user_id', userId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}