import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Função para gerar token único
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET - Obter token do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const origin = new URL(request.url).origin
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || origin).replace(/\/+$/, '')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando token para usuário:', userId)

    // Buscar token existente
    const { data: tokenData, error: tokenError } = await supabase
      .from('catalog_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (tokenError && tokenError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Erro ao buscar token:', tokenError)
      return NextResponse.json({ 
        error: 'Erro ao buscar token' 
      }, { status: 500 })
    }

    if (tokenData) {
      console.log('✅ Token existente encontrado')
      return NextResponse.json({
        success: true,
        token: tokenData.token,
        catalogUrl: `${baseUrl}/catalogo/${tokenData.token}`,
        isActive: tokenData.is_active,
        accessCount: tokenData.access_count,
        lastAccessed: tokenData.last_accessed,
        createdAt: tokenData.created_at
      })
    }

    console.log('ℹ️ Nenhum token encontrado para o usuário')
    return NextResponse.json({
      success: true,
      token: null,
      message: 'Nenhum token encontrado. Use POST para criar um novo.'
    })

  } catch (error) {
    console.error('❌ Erro na API de token:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST - Criar novo token
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('➕ Criando novo token para usuário:', userId)

    // Verificar se usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Desativar tokens existentes
    await supabase
      .from('catalog_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)

    // Gerar novo token único
    let newToken: string
    let tokenExists = true
    let attempts = 0

    do {
      newToken = generateToken()
      const { data } = await supabase
        .from('catalog_tokens')
        .select('id')
        .eq('token', newToken)
        .single()
      
      tokenExists = !!data
      attempts++
    } while (tokenExists && attempts < 10)

    if (tokenExists) {
      return NextResponse.json(
        { error: 'Erro ao gerar token único' },
        { status: 500 }
      )
    }

    // Criar novo token
    const { data: newTokenData, error: createError } = await supabase
      .from('catalog_tokens')
      .insert({
        user_id: userId,
        token: newToken,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro ao criar token:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar token' 
      }, { status: 500 })
    }

    console.log('✅ Token criado com sucesso:', newToken)

    return NextResponse.json({
      success: true,
      token: newToken,
      catalogUrl: `${baseUrl}/catalogo/${newToken}`,
      message: 'Token criado com sucesso!'
    })

  } catch (error) {
    console.error('❌ Erro ao criar token:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE - Desativar token
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🗑️ Desativando token para usuário:', userId)

    // Desativar todos os tokens do usuário
    const { error: updateError } = await supabase
      .from('catalog_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Erro ao desativar token:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao desativar token' 
      }, { status: 500 })
    }

    console.log('✅ Token desativado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Token desativado com sucesso!'
    })

  } catch (error) {
    console.error('❌ Erro ao desativar token:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}