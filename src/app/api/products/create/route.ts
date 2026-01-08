import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { Product } from '@/types'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
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
