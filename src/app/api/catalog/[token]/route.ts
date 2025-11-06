import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com chave de serviço para acesso público
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    
    if (!token || token.length !== 32) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando catálogo público para token:', token)

    // 1. Verificar se o token existe e está ativo
    const { data: tokenData, error: tokenError } = await supabase
      .from('catalog_tokens')
      .select(`
        id,
        user_id,
        is_active,
        access_count,
        last_accessed
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !tokenData) {
      console.log('❌ Token não encontrado ou inativo:', tokenError?.message)
      return NextResponse.json(
        { error: 'Catálogo não encontrado ou indisponível' },
        { status: 404 }
      )
    }

    console.log('✅ Token válido encontrado para usuário:', tokenData.user_id)

    // 2. Buscar produtos públicos do usuário
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        image_url,
        description,
        selling_price,
        status,
        quantity,
        quantity_sold
      `)
      .eq('user_id', tokenData.user_id)
      .eq('is_public', true)
      .in('status', ['received', 'selling']) // Apenas produtos disponíveis
      .gt('quantity', 0) // Apenas produtos em estoque
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError)
      return NextResponse.json({ 
        error: 'Erro ao carregar produtos' 
      }, { status: 500 })
    }

    console.log('📦 Produtos públicos encontrados:', products?.length || 0)

    // 3. Transformar dados para formato público compatível com a página /catalogo/[token]
    const publicProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.image_url || '/placeholder-product.svg',
      description: product.description || '',
      sellingPrice: Number(product.selling_price) || 0,
      status: product.status,
      quantity: Number(product.quantity) || 0,
      quantitySold: Number(product.quantity_sold) || 0
    })) || []

    // 4. Atualizar contador de acessos (sem bloquear resposta)
    ;(async () => {
      try {
        await supabase
          .from('catalog_tokens')
          .update({ 
            access_count: (tokenData.access_count || 0) + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('id', tokenData.id)
        console.log('📊 Contador de acesso atualizado')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log('⚠️ Erro ao atualizar contador:', msg)
      }
    })()

    // 5. Preparar informações do catálogo (chave 'catalogInfo' usada pelo frontend)
    const catalogInfo = {
      totalProducts: publicProducts.length,
      categories: [...new Set(publicProducts.map(p => p.category).filter(Boolean))],
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      catalogInfo,
      products: publicProducts
    })

  } catch (error) {
    console.error('❌ Erro na API do catálogo público:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}