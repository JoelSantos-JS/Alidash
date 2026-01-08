import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const reqType = (formData.get('type') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo de imagem é obrigatório' }, { status: 400 })
    }

    try {
      const serviceSupabase = createServiceClient()
      await serviceSupabase.storage.createBucket('product-images', { public: true })
    } catch {}

    const ext = file.name.split('.').pop() || 'jpg'
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const path = `users/${userId}/products/${productId || 'unlinked'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await createServiceClient().storage.from('product-images').upload(path, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || `image/${ext}`
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = createServiceClient().storage.from('product-images').getPublicUrl(path)
    const publicUrl = publicData.publicUrl

    let imageRecord: any = null

    if (productId) {
      try {
        const serviceSupabase = createServiceClient()
        const { data: last } = await serviceSupabase
          .from('product_images')
          .select('order')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .order('order', { ascending: false })
          .limit(1)
        const nextOrder = ((last && last[0]?.order) || 0) + 1

        let typeToUse: 'main' | 'gallery' | 'thumbnail' = 'gallery'
        if (reqType === 'thumbnail') typeToUse = 'thumbnail'
        if (reqType === 'main') typeToUse = 'main'

        if (typeToUse !== 'main') {
          const { data: existingMain } = await serviceSupabase
            .from('product_images')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .eq('type', 'main')
            .limit(1)
          if (!existingMain || existingMain.length === 0) {
            typeToUse = 'main'
          }
        }

        if (typeToUse === 'main') {
          const { data: currentMain } = await serviceSupabase
            .from('product_images')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .eq('type', 'main')
            .limit(1)
          if (currentMain && currentMain.length > 0) {
            await serviceSupabase
              .from('product_images')
              .update({ type: 'gallery' })
              .eq('id', currentMain[0].id)
          }
        }

        const { data: created } = await serviceSupabase
          .from('product_images')
          .insert({ user_id: userId, product_id: productId, url: publicUrl, alt: 'Imagem do produto', type: typeToUse, order: nextOrder, path })
          .select('*')
          .single()
        imageRecord = created

        if (typeToUse === 'main') {
          await serviceSupabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId)
            .eq('user_id', userId)
        }
      } catch {}
    }

    return NextResponse.json({ success: true, url: publicUrl, path, image: imageRecord })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
