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
      if (diffDays >= 3) {
        return NextResponse.json({ error: 'Período gratuito de 3 dias expirado' }, { status: 403 })
      }
    }
    const quantity = Number(body?.quantity || 0)
    const buyerName = body?.buyerName ? String(body.buyerName) : undefined
    const dateInput = body?.date ? new Date(body.date) : new Date()

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'quantity inválido' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, selling_price')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const unitPrice = Number(product.selling_price) || 0
    const totalAmount = unitPrice * quantity

    const sale = await supabaseAdminService.createSale(userId, productId, {
      quantity,
      unitPrice,
      totalAmount,
      date: dateInput,
      buyerName,
      productId
    })

    return NextResponse.json({ success: true, sale })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
