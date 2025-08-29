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

    console.log(`✅ Produto atualizado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)

    if (result.success) {
      return NextResponse.json({ 
        success: true,
        firebaseSuccess: result.firebaseSuccess,
        supabaseSuccess: result.supabaseSuccess,
        message: 'Produto atualizado com sucesso'
      })
    } else {
      return NextResponse.json({ 
        success: false,
        errors: result.errors,
        firebaseSuccess: result.firebaseSuccess,
        supabaseSuccess: result.supabaseSuccess
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 