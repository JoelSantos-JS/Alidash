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

    console.log('🔍 Buscando metas empresariais para usuário:', userId)

    // Buscar todas as metas do usuário
    const allGoals = await supabaseAdminService.getGoals(userId)
    
    // Filtrar apenas metas empresariais (category: 'business')
    const businessGoals = allGoals.filter(goal => goal.category === 'business')
    
    console.log('✅ Metas empresariais encontradas:', businessGoals.length)

    return NextResponse.json({
      success: true,
      goals: businessGoals,
      count: businessGoals.length
    })

  } catch (error) {
    console.error('❌ Erro ao buscar metas empresariais:', error)
    
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

    // Garantir que a meta seja empresarial
    const businessGoalData = {
      ...goalData,
      category: 'business'
    }

    // Criar meta empresarial
    const goal = await supabaseAdminService.createGoal(user_id, businessGoalData)

    return NextResponse.json({
      success: true,
      goal
    })

  } catch (error) {
    console.error('Erro ao criar meta empresarial:', error)
    
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

    // Garantir que a categoria permaneça como business
    const businessUpdates = {
      ...updates,
      category: 'business'
    }

    // Atualizar meta empresarial
    const updatedGoal = await supabaseAdminService.updateGoal(userId, goalId, businessUpdates)

    return NextResponse.json({
      success: true,
      goal: updatedGoal
    })

  } catch (error) {
    console.error('Erro ao atualizar meta empresarial:', error)
    
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

    // Deletar meta empresarial
    await supabaseAdminService.deleteGoal(userId, goalId)

    return NextResponse.json({
      success: true,
      message: 'Meta empresarial deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar meta empresarial:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}