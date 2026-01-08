import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function DELETE(request: NextRequest) {
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
    const imageId = searchParams.get('image_id')

    if (!userId || !productId || !imageId) {
      return NextResponse.json({ error: 'user_id, product_id e image_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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
