import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/utils/supabase/server'
import type { Product, ProductImage, Sale } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()
    let internalUserId = userId
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('firebase_uid', userId)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }

    console.log('🔍 Buscando produtos (Supabase) para usuário ID:', internalUserId)

    const products = await supabaseAdminService.getProducts(internalUserId)
    console.log('📦 Produtos encontrados:', products.length)

    // Transformar dados do Supabase para o formato esperado
    const transformedProducts: Product[] = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      supplier: product.supplier || '',
      aliexpressLink: product.aliexpress_link || '',
      imageUrl: product.image_url || '',
      isPublic: !!product.is_public,
      description: product.description || '',
      notes: product.notes || '',
      trackingCode: product.tracking_code || '',
      purchaseEmail: product.purchase_email || '',
      purchasePrice: product.purchase_price || 0,
      shippingCost: product.shipping_cost || 0,
      importTaxes: product.import_taxes || 0,
      packagingCost: product.packaging_cost || 0,
      marketingCost: product.marketing_cost || 0,
      otherCosts: product.other_costs || 0,
      totalCost: product.total_cost || 0,
      sellingPrice: product.selling_price || 0,
      expectedProfit: product.expected_profit || 0,
      profitMargin: product.profit_margin || 0,
      quantity: product.quantity || 0,
      quantitySold: product.quantity_sold || 0,
      status: product.status || 'purchased',
      purchaseDate: new Date(product.purchase_date || product.created_at),
      roi: product.roi || 0,
      actualProfit: product.actual_profit || 0,
      daysToSell: product.days_to_sell ?? null,
      sales: [] as Sale[],
      images: [] as ProductImage[]
    }))

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: sales } = await supabase
      .from('sales')
      .select('id, product_id, quantity, buyer_name, date')
      .eq('user_id', internalUserId)

    if (sales && sales.length > 0) {
      const byProduct = new Map<string, Sale[]>()
      for (const s of sales) {
        const arr = byProduct.get(s.product_id) || []
        arr.push({
          id: String(s.id),
          date: new Date(s.date),
          quantity: Number(s.quantity || 0),
          buyerName: s.buyer_name ? String(s.buyer_name) : undefined,
          productId: s.product_id ? String(s.product_id) : undefined
        })
        byProduct.set(s.product_id, arr)
      }
      for (let i = 0; i < transformedProducts.length; i++) {
        const p = transformedProducts[i]
        p.sales = byProduct.get(p.id) || []
      }
    }

    const { data: allImages } = await supabase
      .from('product_images')
      .select('id, product_id, url, type, alt, created_at, order')
      .eq('user_id', internalUserId)

    if (allImages && allImages.length > 0) {
      const imgsByProduct = new Map<string, ProductImage[]>()
      for (const img of allImages) {
        const arr = imgsByProduct.get(img.product_id) || []
        const createdAtStr = typeof img.created_at === 'string' ? img.created_at : new Date(img.created_at).toISOString()
        arr.push({
          id: String(img.id),
          url: String(img.url),
          type: (img.type || 'gallery') as ProductImage['type'],
          alt: String(img.alt || ''),
          created_at: createdAtStr,
          order: typeof img.order === 'number' ? img.order : Number(img.order || 0),
          path: undefined
        } as ProductImage)
        imgsByProduct.set(img.product_id, arr)
      }
      for (let i = 0; i < transformedProducts.length; i++) {
        const p = transformedProducts[i]
        const imgs = imgsByProduct.get(p.id) || []
        const mainFallback: ProductImage[] = p.imageUrl ? [{
          id: `${p.id}-main`,
          url: String(p.imageUrl),
          type: 'main',
          alt: 'Imagem principal',
          created_at: new Date().toISOString(),
          order: 1
        }] : []
        transformedProducts[i] = {
          ...p,
          images: imgs.length > 0 ? imgs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : mainFallback
        }
      }
    } else {
      // Fallback: criar imagem principal a partir de imageUrl
      for (let i = 0; i < transformedProducts.length; i++) {
        const p = transformedProducts[i]
        const mainFallback: ProductImage[] = p.imageUrl ? [{
          id: `${p.id}-main`,
          url: String(p.imageUrl),
          type: 'main',
          alt: 'Imagem principal',
          created_at: new Date().toISOString(),
          order: 1
        }] : []
        transformedProducts[i] = { ...p, images: mainFallback }
      }
    }

    return NextResponse.json({ 
      success: true, 
      products: transformedProducts,
      count: transformedProducts.length 
    })

  } catch (error) {
    console.error('❌ Erro na API de produtos:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
