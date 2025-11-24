import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const reqType = (formData.get('type') as string | null) || null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo de imagem é obrigatório' }, { status: 400 })
    }

    try {
      await supabase.storage.createBucket('product-images', { public: true })
    } catch {}

    const ext = file.name.split('.').pop() || 'jpg'
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const path = `users/${userId}/products/${productId || 'unlinked'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || `image/${ext}`
    })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path)
    const publicUrl = publicData.publicUrl

    let imageRecord: any = null

    if (productId) {
      try {
        const { data: last } = await supabase
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
          const { data: existingMain } = await supabase
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
        }

        const { data: created } = await supabase
          .from('product_images')
          .insert({ user_id: userId, product_id: productId, url: publicUrl, alt: 'Imagem do produto', type: typeToUse, order: nextOrder, path })
          .select('*')
          .single()
        imageRecord = created

        if (typeToUse === 'main') {
          await supabase
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