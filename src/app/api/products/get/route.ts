import { NextRequest, NextResponse } from 'next/server'
import { DualDatabaseSync, DualSyncPresets } from '@/lib/dual-database-sync'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const firebaseUid = searchParams.get('user_id')

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'user_id (firebase_uid) é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando produtos para Firebase UID:', firebaseUid)

    // Buscar usuário pelo firebase_uid
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (userError || !user) {
      console.log('❌ Usuário não encontrado:', userError)
      return NextResponse.json({ 
        success: true, 
        products: [],
        count: 0,
        message: 'Usuário não encontrado no Supabase'
      })
    }

    console.log('✅ Usuário encontrado:', user.id)

    // Buscar produtos do usuário
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError)
      return NextResponse.json({ 
        error: 'Erro ao buscar produtos',
        details: productsError.message 
      }, { status: 500 })
    }

    console.log('📦 Produtos encontrados:', products?.length || 0)

    // Transformar dados do Supabase para o formato esperado
    const transformedProducts = products?.map(product => ({
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
      sales: [] // Por enquanto, sem vendas
    })) || []

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