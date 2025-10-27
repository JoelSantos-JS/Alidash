import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { firebase_uid, email, name, avatar_url } = await request.json()

    // Validação dos dados obrigatórios
    if (!firebase_uid || !email) {
      return NextResponse.json(
        { error: 'firebase_uid e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já existe pelo Firebase UID
    let user = await supabaseAdminService.getUserByFirebaseUid(firebase_uid)
    
    if (!user) {
      // Verificar se existe usuário com o mesmo email
      const existingUser = await supabaseAdminService.getUserByEmail(email)
      
      if (existingUser) {
        // Atualizar o Firebase UID do usuário existente
        user = await supabaseAdminService.updateUserFirebaseUid(existingUser.id, firebase_uid)
      } else {
        // Criar novo usuário
        user = await supabaseAdminService.createUser({
          firebase_uid,
          email,
          name: name || null,
          avatar_url: avatar_url || null,
          account_type: 'personal'
        })
      }
    } else {
      // Atualizar dados do usuário existente se necessário
      const updateData: any = {}
      
      if (name && user.name !== name) {
        updateData.name = name
      }
      
      if (avatar_url && user.avatar_url !== avatar_url) {
        updateData.avatar_url = avatar_url
      }
      
      if (Object.keys(updateData).length > 0) {
        user = await supabaseAdminService.updateUser(user.id, updateData)
      }
      
      // Atualizar último login
      await supabaseAdminService.updateUserLastLogin(user.id)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        account_type: user.account_type || 'personal'
      }
    })

  } catch (error) {
    console.error('Erro na sincronização do usuário:', {
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const firebase_uid = url.searchParams.get('firebase_uid')
    const email = url.searchParams.get('email')

    if (!firebase_uid && !email) {
      return NextResponse.json(
        { error: 'firebase_uid ou email é obrigatório' },
        { status: 400 }
      )
    }

    let user = null
    
    if (firebase_uid) {
      user = await supabaseAdminService.getUserByFirebaseUid(firebase_uid)
    } else if (email) {
      user = await supabaseAdminService.getUserByEmail(email)
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        account_type: user.account_type || 'personal'
      }
    })

  } catch (error) {
    console.error('Erro ao buscar usuário:', {
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