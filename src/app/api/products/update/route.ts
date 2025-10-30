import { NextRequest, NextResponse } from 'next/server'
import { DualDatabaseSync, DualSyncPresets } from '@/lib/dual-database-sync'
import { Product } from '@/types'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id é obrigatório' },
        { status: 400 }
      )
    }

    const updates: Partial<Product> = await request.json()

    console.log('🔍 Atualizando produto:', productId, 'para usuário:', userId)

    // Usar sincronização dual para atualizar produto
    const dualSync = new DualDatabaseSync(userId, DualSyncPresets.BEST_EFFORT)
    const result = await dualSync.updateProduct(productId, updates)

    console.log(`✅ Produto atualizado - Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)

    return NextResponse.json({
      success: result.success,
      supabaseSuccess: result.supabaseSuccess,
      errors: result.errors
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      supabaseSuccess: false,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    }, { status: 500 })
  }
}