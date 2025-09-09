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

    // Verificar se é UUID do Supabase ou Firebase UID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    
    let goals: Goal[]
    
    if (isUUID) {
      // Buscar diretamente por UUID do Supabase
      goals = await supabaseAdminService.getGoals(userId)
      console.log('✅ Metas encontradas (UUID direto):', goals.length)
    } else {
      // Buscar usuário pelo Firebase UID primeiro
      const user = await supabaseAdminService.getUserByFirebaseUid(userId)
      
      if (!user) {
        console.log('❌ Usuário não encontrado para Firebase UID:', userId)
        return NextResponse.json(
          { error: `Usuário não encontrado para firebase_uid: ${userId}` },
          { status: 404 }
        )
      }
      
      console.log('✅ Usuário encontrado:', user.email)
      goals = await supabaseAdminService.getGoals(user.id)
      console.log('✅ Metas encontradas:', goals.length)
    }

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
    const { firebase_uid, goalData } = body

    if (!firebase_uid) {
      return NextResponse.json(
        { error: 'Firebase UID é obrigatório' },
        { status: 400 }
      )
    }

    if (!goalData) {
      return NextResponse.json(
        { error: 'Dados da meta são obrigatórios' },
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

    // Criar meta usando o UUID do Supabase
    const goal = await supabaseAdminService.createGoal(user.id, goalData)

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
    const { goalId, updates } = body

    if (!goalId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
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
    await supabaseAdminService.updateGoal(goalId, updates)

    return NextResponse.json({
      success: true,
      message: 'Meta atualizada com sucesso'
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

    if (!goalId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      )
    }

    // Deletar meta
    await supabaseAdminService.deleteGoal(goalId)

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