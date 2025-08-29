import { NextRequest, NextResponse } from 'next/server'
import { DualDatabaseSync, DualSyncPresets } from '@/lib/dual-database-sync'

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

    console.log('🔍 Buscando produtos para usuário:', userId)

    // Usar sincronização dual para buscar produtos
    const dualSync = new DualDatabaseSync(userId, DualSyncPresets.BEST_EFFORT)
    const products = await dualSync.getProducts()

    console.log(`✅ ${products.length} produtos encontrados`)

    return NextResponse.json({ 
      success: true, 
      products,
      count: products.length 
    })

  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 