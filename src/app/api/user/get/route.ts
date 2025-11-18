import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { user_id, email } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo ID
    let user = await supabaseAdminService.getUserById(user_id)
    
    // Fallback: buscar por email se não encontrado
    if (!user && email) {
      try {
        user = await supabaseAdminService.getUserByEmail(email)
      } catch {}
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Retornar dados completos do usuário
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        account_type: user.account_type || 'personal',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        is_active: user.is_active,
        plan_next_renewal_at: user.plan_next_renewal_at || null,
        plan_started_at: user.plan_started_at || null,
        plan_status: user.plan_status || null,
        plan_price_brl: user.plan_price_brl || null
      }
    })

  } catch (error) {
    console.error('Erro na API de busca de usuário:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}