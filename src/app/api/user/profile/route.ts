import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function PUT(request: NextRequest) {
  try {
    const { firebase_uid, name } = await request.json()

    // Validação do firebase_uid
    if (!firebase_uid || typeof firebase_uid !== 'string') {
      return NextResponse.json(
        { error: 'firebase_uid é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Validação do nome
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Sanitização do nome
    const sanitizedName = name.trim()

    // Verificar se o nome não está vazio após sanitização
    if (sanitizedName.length === 0) {
      return NextResponse.json(
        { error: 'Nome não pode estar vazio' },
        { status: 400 }
      )
    }

    // Verificar tamanho máximo do nome
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Nome não pode ter mais de 100 caracteres' },
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

    // Verificar se o nome realmente mudou
    if (user.name === sanitizedName) {
      return NextResponse.json({
        success: true,
        message: 'Nome não foi alterado (já é o mesmo)',
        user: user
      })
    }

    // Atualizar nome do usuário
    const { data: updatedUser, error } = await supabaseAdminService.client
      .from('users')
      .update({ 
        name: sanitizedName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', {
        error,
        firebase_uid,
        user_id: user.id,
        attempted_name: sanitizedName
      })
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil no banco de dados' },
        { status: 500 }
      )
    }

    // Log de sucesso (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Perfil atualizado com sucesso:', {
        user_id: user.id,
        firebase_uid,
        old_name: user.name,
        new_name: sanitizedName
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Nome atualizado com sucesso',
      user: updatedUser
    })

  } catch (error) {
    console.error('Erro na API de atualização de perfil:', {
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