import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST - Registrar subscription de push notification
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, subscription } = await request.json()

    if (!user_id || !subscription) {
      return NextResponse.json(
        { error: 'user_id e subscription são obrigatórios' },
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

    // Verificar se já existe uma subscription para este usuário
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existingSubscription) {
      // Atualizar subscription existente
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingSubscription.id)

      if (error) {
        console.error('Erro ao atualizar subscription:', error)
        return NextResponse.json(
          { error: 'Erro ao atualizar subscription' },
          { status: 500 }
        )
      }
    } else {
      // Criar nova subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        })

      if (error) {
        console.error('Erro ao criar subscription:', error)
        return NextResponse.json(
          { error: 'Erro ao criar subscription' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription registrada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao registrar subscription:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}