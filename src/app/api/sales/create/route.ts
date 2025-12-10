import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdminService } from '@/lib/supabase-service'

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

    if (!productId) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const { data: userRow } = await supabase
      .from('users')
      .select('account_type, created_at, plan_started_at')
      .eq('id', userId)
      .single()
    const isPaid = userRow?.account_type === 'pro' || userRow?.account_type === 'basic'
    if (!isPaid) {
      const startAt = userRow?.plan_started_at ? new Date(userRow.plan_started_at) : (userRow?.created_at ? new Date(userRow.created_at) : new Date())
      const diffDays = Math.floor((Date.now() - startAt.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 5) {
        return NextResponse.json({ error: 'Período gratuito de 5 dias expirado' }, { status: 403 })
      }
    }
    const quantity = Math.max(1, Math.floor(Number(body?.quantity || 0)))
    const buyerName = body?.buyerName ? String(body.buyerName) : undefined
    const dateInput = body?.date ? new Date(body.date) : new Date()

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'quantity inválido' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, category, selling_price, quantity, quantity_sold, status')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    let unitPrice = Number(product.selling_price)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) unitPrice = 0
    unitPrice = Math.min(999999.99, Number(unitPrice.toFixed(2)))

    const available = Math.max(0, Number(product.quantity || 0) - Number(product.quantity_sold || 0))
    if (available <= 0) {
      console.warn('⚠️ Venda rejeitada (esgotado):', { productId, productName: product.name, quantity: Number(product.quantity || 0), quantity_sold: Number(product.quantity_sold || 0), available })
      return NextResponse.json({ error: 'Produto esgotado', debug: { productId, productName: product.name, quantity: Number(product.quantity || 0), quantity_sold: Number(product.quantity_sold || 0), available } }, { status: 422 })
    }
    const sellQty = Math.min(quantity, available)

    const totalAmount = Number((unitPrice * sellQty).toFixed(2))
    if (!Number.isFinite(totalAmount) || totalAmount > 99999999.99) {
      console.warn('⚠️ Venda rejeitada (valores inválidos):', { productId, productName: product.name, unitPrice, sellQty, totalAmount })
      return NextResponse.json({ error: 'Preço ou quantidade inválidos', debug: { productId, productName: product.name, unitPrice, sellQty, totalAmount } }, { status: 422 })
    }

    let sale
    try {
      sale = await supabaseAdminService.createSale(userId, productId, {
        quantity: sellQty,
        unitPrice,
        totalAmount,
        date: dateInput,
        buyerName,
        productId
      })
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('numeric field overflow') || msg.includes('valores excedem limites')) {
        console.warn('⚠️ Venda rejeitada (limites do banco):', { productId, productName: product.name, unitPrice, sellQty })
        return NextResponse.json({ error: 'Preço ou quantidade excede limites permitidos', debug: { productId, productName: product.name, unitPrice, sellQty } }, { status: 422 })
      }
      throw err
    }

    try {
      const currentSold = Number(product.quantity_sold || 0)
      const currentQty = Number(product.quantity || 0)
      const updatedSold = currentSold + sellQty
      const newStatus = updatedSold >= currentQty && currentQty > 0 ? 'sold' : (product.status || 'selling')

      await supabaseAdminService.updateProduct(userId, productId, {
        quantitySold: updatedSold,
        status: newStatus
      })
    } catch (_) {
      // atualização do produto é opcional; não falhar a criação da venda
    }

    
    try {
      await supabaseAdminService.createRevenue(userId, {
        description: product?.name ? `Venda: ${product.name}` : 'Venda de produto',
        amount: totalAmount,
        category: product?.category || 'Vendas de Produtos',
        source: 'sale',
        notes: '',
        product_id: productId,
        date: dateInput
      })
    } catch (_) {}

    return NextResponse.json({ success: true, sale })
  } catch (error) {
    console.error('❌ Erro ao criar venda:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
