import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando categorias globais do sistema')

    // Buscar todas as categorias do sistema (são globais, não por usuário)
    const { data, error } = await supabaseAdminService.client
      .from('categories')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    
    const categories = (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: cat.type,
      color: '#6B7280', // Cor padrão
      icon: 'tag', // Ícone padrão
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
    const { firebase_uid, categoryData } = body

    if (!firebase_uid) {
      return NextResponse.json(
        { error: 'Firebase UID é obrigatório' },
        { status: 400 }
      )
    }

    if (!categoryData) {
      return NextResponse.json(
        { error: 'Dados da categoria são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo firebase_uid
    const user = await supabaseAdminService.getUserByFirebaseUid(firebase_uid)
    
    if (!user) {
      return NextResponse.json(
        { error: `Usuário não encontrado no Supabase para firebase_uid: ${firebase_uid}` },
        { status: 404 }
      )
    }

    // Criar categoria usando o UUID do Supabase (apenas campos existentes)
    const { data, error } = await supabaseAdminService.client
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description || '',
        type: categoryData.type || 'transaction'
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

    // Atualizar categoria
    const { data, error } = await supabaseAdminService.client
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
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
    const { error } = await supabaseAdminService.client
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
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}