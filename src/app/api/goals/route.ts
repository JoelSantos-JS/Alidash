import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import type { Goal } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando metas para usuário:', userId)

    // Buscar metas diretamente por UUID do Supabase
    const goals = await supabaseAdminService.getGoals(userId)
    console.log('✅ Metas encontradas:', goals.length)

    return NextResponse.json({
      success: true,
      goals,
      count: goals.length
    })

  } catch (error) {
    console.error('❌ Erro ao buscar metas:', error)
    
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
    const { user_id, goalData } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    if (!goalData) {
      return NextResponse.json(
        { error: 'Dados da meta são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar meta usando o UUID do Supabase
    const goal = await supabaseAdminService.createGoal(user_id, goalData)

    return NextResponse.json({
      success: true,
      goal
    })

  } catch (error) {
    console.error('Erro ao criar meta:', error)
    
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
    const { goalId, updates, userId } = body

    if (!goalId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!updates) {
      return NextResponse.json(
        { error: 'Dados para atualização são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar meta
    const updatedGoal = await supabaseAdminService.updateGoal(userId, goalId, updates)

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    })

  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
    
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
    const goalId = searchParams.get('goalId')
    const userId = searchParams.get('user_id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Deletar meta
    await supabaseAdminService.deleteGoal(userId, goalId)

    return NextResponse.json({
      success: true,
      message: 'Meta deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar meta:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}