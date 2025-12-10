import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function GET() {
  try {
    console.log('🔍 Buscando categorias globais do sistema')

    // Buscar todas as categorias do sistema (são globais, não por usuário)
    const { data, error } = await supabaseAdminService.getClient()
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    const categories = (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: cat.type,
      color: (cat as any).color ?? '#6B7280',
      icon: (cat as any).icon ?? 'tag',
      budget: 0,
      spent: 0,
      transactions: 0,
      isDefault: true,
      created_at: cat.created_at
    }))
    
    console.log('✅ Categorias encontradas:', categories.length)

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length
    })

  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, categoryData } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    if (!categoryData) {
      return NextResponse.json(
        { error: 'Dados da categoria são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo user_id
    const user = await supabaseAdminService.getUserById(user_id)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: `Usuário não encontrado no Supabase para user_id: ${user_id}` },
        { status: 404 }
      )
    }

    
    const { data, error } = await supabaseAdminService.getClient()
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description || '',
        type: categoryData.type || 'transaction',
        color: categoryData.color ?? null,
        icon: categoryData.icon ?? null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      category: data
    })

  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, updates } = body

    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    if (!updates) {
      return NextResponse.json(
        { error: 'Dados para atualização são obrigatórios' },
        { status: 400 }
      )
    }

    const updatePayload: Record<string, any> = {}
    if (typeof updates?.name === 'string') updatePayload.name = updates.name
    if (typeof updates?.description === 'string') updatePayload.description = updates.description
    if (typeof updates?.type === 'string') updatePayload.type = updates.type
    if (typeof (updates as any)?.color === 'string') updatePayload.color = (updates as any).color
    if (typeof (updates as any)?.icon === 'string') updatePayload.icon = (updates as any).icon

    const { data, error } = await supabaseAdminService.getClient()
      .from('categories')
      .update(updatePayload)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      category: data
    })

  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    // Deletar categoria diretamente (hard delete)
    const { error } = await supabaseAdminService.getClient()
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar categoria:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
