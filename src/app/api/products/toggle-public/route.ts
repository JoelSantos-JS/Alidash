import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server'

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

    const { isPublic } = await request.json()

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic deve ser um boolean' },
        { status: 400 }
      )
    }

    console.log(`🔄 Alterando visibilidade do produto ${productId} para ${isPublic ? 'público' : 'privado'}`)

    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const serviceSupabase = createServiceClient()
    let internalUserId = user.id
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }

    if (userId && userId !== user.id && userId !== internalUserId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Verificar se o produto pertence ao usuário
    const { data: product, error: productError } = await serviceSupabase
      .from('products')
      .select('id, name, user_id')
      .eq('id', productId)
      .eq('user_id', internalUserId)
      .single()

    if (productError || !product) {
      console.log('❌ Produto não encontrado ou não pertence ao usuário')
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar visibilidade do produto
    const { data: updatedProduct, error: updateError } = await serviceSupabase
      .from('products')
      .update({ is_public: isPublic })
      .eq('id', productId)
      .eq('user_id', internalUserId)
      .select('id, name, is_public')
      .single()

    if (updateError) {
      console.error('❌ Erro ao atualizar produto:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar produto' 
      }, { status: 500 })
    }

    console.log(`✅ Produto "${product.name}" agora é ${isPublic ? 'público' : 'privado'}`)

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: `Produto ${isPublic ? 'tornado público' : 'removido do catálogo público'} com sucesso!`
    })

  } catch (error) {
    console.error('❌ Erro ao alterar visibilidade do produto:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
