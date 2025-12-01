import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { Product } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    const productData: Omit<Product, 'id'> = await request.json()
    const userRow = await supabaseAdminService.getUserById(userId)
    const accountType = userRow?.account_type
    const isPaid = accountType === 'pro' || accountType === 'basic'
    if (!isPaid) {
      const startAt = userRow?.plan_started_at ? new Date(userRow.plan_started_at) : (userRow?.created_at ? new Date(userRow.created_at) : new Date())
      const diffDays = Math.floor((Date.now() - startAt.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 3) {
        return NextResponse.json({ error: 'Período gratuito de 3 dias expirado' }, { status: 403 })
      }
    }

    console.log('🔍 Criando produto (Supabase) para usuário:', userId)

    // Criar produto diretamente no Supabase
    await supabaseAdminService.createProduct(userId, productData)

    return NextResponse.json({ 
      success: true,
      message: 'Produto criado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao criar produto:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
