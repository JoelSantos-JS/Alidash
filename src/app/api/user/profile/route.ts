import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { user_id, name } = await request.json()

    // Validação do user_id
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id é obrigatório e deve ser uma string válida' },
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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    let internalUserId = user.id
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }

    if (user_id !== user.id && user_id !== internalUserId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const { data: userRow, error: fetchError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', internalUserId)
      .single()

    if (fetchError || !userRow) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o nome realmente mudou
    if (userRow.name === sanitizedName) {
      return NextResponse.json({
        success: true,
        message: 'Nome não foi alterado (já é o mesmo)',
        user: userRow
      })
    }

    // Atualizar nome do usuário
    const { data: updatedUser, error } = await serviceSupabase
      .from('users')
      .update({ 
        name: sanitizedName,
        updated_at: new Date().toISOString()
      })
      .eq('id', internalUserId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar perfil:', {
        error,
        user_id: internalUserId,
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
        user_id: internalUserId,
        old_name: userRow.name,
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
