import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { Product } from '@/types'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const productData: Omit<Product, 'id'> = await request.json()

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
