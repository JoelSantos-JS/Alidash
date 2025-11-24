import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')

    if (!userId || !productId) {
      return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })
    }

    const body = await request.json() as { url: string; type?: 'main' | 'gallery' | 'thumbnail'; alt?: string }
    if (!body?.url) {
      return NextResponse.json({ error: 'url é obrigatória' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('product_images')
      .select('id, order')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('order', { ascending: false })
      .limit(1)

    const nextOrder = ((existing && existing[0]?.order) || 0) + 1
    const type = body.type || 'gallery'

    const { data: created, error } = await supabase
      .from('product_images')
      .insert({ user_id: userId, product_id: productId, url: body.url, alt: body.alt || 'Imagem do produto', type, order: nextOrder })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (type === 'main') {
      await supabase
        .from('products')
        .update({ image_url: body.url })
        .eq('id', productId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ success: true, image: created })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}