import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo ID
    const user = await supabaseAdminService.getUserById(user_id)
    
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
        is_active: user.is_active
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