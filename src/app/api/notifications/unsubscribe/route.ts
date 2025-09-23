import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST - Cancelar subscription de push notification
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, endpoint } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se a tabela existe
    const { data: tableExists } = await supabase
      .from('push_subscriptions')
      .select('count')
      .limit(1)
      .maybeSingle()

    if (!tableExists && tableExists !== null) {
      return NextResponse.json(
        { 
          error: 'Tabela de subscriptions não configurada',
          message: 'Execute o script SQL para criar a tabela push_subscriptions'
        },
        { status: 503 }
      )
    }

    let query = supabase
      .from('push_subscriptions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    // Se endpoint específico foi fornecido, cancelar apenas essa subscription
    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }

    const { error } = await query

    if (error) {
      console.error('Erro ao cancelar subscription:', error)
      return NextResponse.json(
        { error: 'Erro ao cancelar subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao cancelar subscription:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}