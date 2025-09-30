import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { firebase_uid } = await request.json()

    if (!firebase_uid || typeof firebase_uid !== 'string') {
      return NextResponse.json(
        { error: 'firebase_uid é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo Firebase UID
    const user = await supabaseAdminService.getUserByFirebaseUid(firebase_uid)
    
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
        firebase_uid: user.firebase_uid,
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