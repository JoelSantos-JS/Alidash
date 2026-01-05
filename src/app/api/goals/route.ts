import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      goals: goals || [],
      count: (goals || []).length
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

    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const insertData = { user_id, ...goalData }
    const { data: created, error } = await supabase
      .from('goals')
      .insert(insertData)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      goal: created
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

    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: updatedGoal, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
