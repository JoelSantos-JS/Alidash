import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const backupData = await request.json()
    
    if (!backupData.userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    if (backupData.userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        success: false,
        message: 'Backup não configurado - Supabase não disponível',
        error: 'SUPABASE_NOT_CONFIGURED'
      }, { status: 503 })
    }
    const supabase = createServiceClient()

    // Preparar dados para Supabase
    const dataToSave = {
      user_id: user.id,
      products: backupData.products || [],
      dreams: backupData.dreams || [],
      bets: backupData.bets || [],
      last_sync: new Date().toISOString()
    }

    // Verificar se já existe backup para este usuário
    const { data: existing } = await supabase
      .from('firebase_backup')
      .select('id')
      .eq('user_id', backupData.userId)
      .single()

    let result
    if (existing) {
      // Atualizar backup existente
      result = await supabase
        .from('firebase_backup')
        .update(dataToSave)
        .eq('user_id', backupData.userId)
    } else {
      // Criar novo backup
      result = await supabase
        .from('firebase_backup')
        .insert(dataToSave)
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup salvo com sucesso!',
      itemCounts: {
        products: dataToSave.products.length,
        dreams: dataToSave.dreams.length,
        bets: dataToSave.bets.length
      },
      lastSync: dataToSave.last_sync
    })

  } catch (error: any) {
    console.error('Erro ao salvar backup:', error)
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        exists: false,
        lastSync: null,
        itemCounts: null,
        error: 'SUPABASE_NOT_CONFIGURED'
      })
    }
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('firebase_backup')
      .select('last_sync, products, dreams, bets')
      .eq('user_id', userId)
      .single()

    if (error) {
      return NextResponse.json({ 
        exists: false, 
        lastSync: null, 
        itemCounts: null 
      })
    }

    return NextResponse.json({ 
      exists: true,
      lastSync: data.last_sync,
      itemCounts: {
        products: data.products?.length || 0,
        dreams: data.dreams?.length || 0,
        bets: data.bets?.length || 0
      }
    })

  } catch (error: any) {
    console.error('Erro ao verificar backup:', error)
    return NextResponse.json({ 
      exists: false, 
      lastSync: null, 
      itemCounts: null 
    })
  }
} 
