import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { createClient } from '@supabase/supabase-js'

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

    console.log('🔍 Buscando produtos (Supabase) para usuário ID:', userId)

    const products = await supabaseAdminService.getProducts(userId)
    console.log('📦 Produtos encontrados:', products.length)

    // Transformar dados do Supabase para o formato esperado
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      supplier: product.supplier || '',
      aliexpressLink: product.aliexpress_link || '',
      imageUrl: product.image_url || '',
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
      sales: []
    }))

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: sales } = await supabase
      .from('sales')
      .select('id, product_id, quantity, buyer_name, date')
      .eq('user_id', userId)

    if (sales && sales.length > 0) {
      const byProduct = new Map<string, any[]>()
      for (const s of sales) {
        const arr = byProduct.get(s.product_id) || []
        arr.push({ id: s.id, date: new Date(s.date), quantity: s.quantity, buyerName: s.buyer_name || undefined, productId: s.product_id })
        byProduct.set(s.product_id, arr)
      }
      for (let i = 0; i < transformedProducts.length; i++) {
        const p = transformedProducts[i]
        p.sales = byProduct.get(p.id) || []
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
