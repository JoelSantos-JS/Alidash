import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

// Configurar VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Substitua pelo seu email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export interface PushNotificationData {
  title: string
  body: string
  type: 'calendar_event' | 'product_alert' | 'transaction' | 'goal_reminder' | 'debt_reminder' | 'general'
  url?: string
  eventId?: string
  data?: any
}

/**
 * POST - Enviar notificação push para usuário
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, notification } = await request.json()

    if (!user_id || !notification) {
      return NextResponse.json(
        { error: 'user_id e notification são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se VAPID está configurado
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys não configuradas')
      return NextResponse.json(
        { 
          error: 'Serviço de notificações não configurado',
          message: 'Configure as VAPID keys no arquivo .env'
        },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    // Buscar subscriptions ativas do usuário
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (subscriptionsError) {
      console.error('Erro ao buscar subscriptions:', subscriptionsError)
      return NextResponse.json(
        { error: 'Erro ao buscar subscriptions do usuário' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Usuário não possui subscriptions ativas'
        }
      )
    }

    // Buscar preferências do usuário
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Verificar se o usuário quer receber este tipo de notificação
    if (preferences && !preferences.push_notifications) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Usuário desabilitou notificações push'
        }
      )
    }

    // Verificar preferências específicas por tipo
    const typePreferences = {
      calendar_event: preferences?.calendar_reminders !== false,
      product_alert: preferences?.product_alerts !== false,
      transaction: preferences?.transaction_alerts !== false,
      goal_reminder: preferences?.goal_reminders !== false,
      debt_reminder: preferences?.debt_reminders !== false,
      general: true
    }

    if (!typePreferences[notification.type]) {
      return NextResponse.json(
        { 
          success: false,
          message: `Usuário desabilitou notificações do tipo ${notification.type}`
        }
      )
    }

    // Preparar payload da notificação
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      tag: `alidash-${notification.type}-${Date.now()}`,
      requireInteraction: notification.type === 'calendar_event',
      data: {
        type: notification.type,
        url: notification.url || '/',
        eventId: notification.eventId,
        timestamp: new Date().toISOString(),
        ...notification.data
      },
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    }

    // Enviar notificação para todas as subscriptions do usuário
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )

        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
        console.error('Erro ao enviar para subscription:', error)
        
        // Se a subscription é inválida, marcar como inativa
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id)
        }

        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Salvar log da notificação
    await supabase
      .from('notification_logs')
      .insert({
        user_id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        success_count: successCount,
        failure_count: failureCount,
        sent_at: new Date().toISOString()
      })
      .catch(error => {
        console.warn('Erro ao salvar log de notificação:', error)
      })

    return NextResponse.json({
      success: successCount > 0,
      message: `Notificação enviada para ${successCount} dispositivo(s)`,
      details: {
        total: subscriptions.length,
        success: successCount,
        failures: failureCount,
        results
      }
    })

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}