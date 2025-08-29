import { NextRequest, NextResponse } from 'next/server'
import { DualDatabaseSync, DualSyncPresets } from '@/lib/dual-database-sync'
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

    console.log('🔍 Criando produto para usuário:', userId)

    // Usar sincronização dual para criar produto
    const dualSync = new DualDatabaseSync(userId, DualSyncPresets.BEST_EFFORT)
    const result = await dualSync.createProduct(productData)

    console.log(`✅ Produto criado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)

    if (result.success) {
      return NextResponse.json({ 
        success: true,
        firebaseSuccess: result.firebaseSuccess,
        supabaseSuccess: result.supabaseSuccess,
        message: 'Produto criado com sucesso'
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
    console.error('❌ Erro ao criar produto:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 