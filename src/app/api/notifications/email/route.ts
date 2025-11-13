import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export interface EmailNotificationData {
  to: string
  subject: string
  body: string
  type: 'calendar_event' | 'product_alert' | 'transaction' | 'goal_reminder' | 'debt_reminder' | 'general'
  eventId?: string
  data?: any
}

/**
 * POST - Enviar notificação por email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { user_id: string; email: EmailNotificationData }
    const { user_id, email } = body

    if (!user_id || !email) {
      return NextResponse.json(
        { error: 'user_id e email são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Buscar preferências do usuário
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // Verificar se o usuário quer receber emails
    if (preferences && !preferences.email_notifications) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Usuário desabilitou notificações por email'
        }
      )
    }

    // Verificar preferências específicas por tipo
    const typePreferences: Record<EmailNotificationData['type'], boolean> = {
      calendar_event: preferences?.calendar_reminders !== false,
      product_alert: preferences?.product_alerts !== false,
      transaction: preferences?.transaction_alerts !== false,
      goal_reminder: preferences?.goal_reminders !== false,
      debt_reminder: preferences?.debt_reminders !== false,
      general: true
    }

    if (!typePreferences[email.type]) {
      return NextResponse.json(
        { 
          success: false,
          message: `Usuário desabilitou emails do tipo ${email.type}`
        }
      )
    }

    // Buscar dados do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user_id)
      .single()

    if (!userData?.email) {
      return NextResponse.json(
        { error: 'Email do usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para n8n
    const n8nPayload = {
      to: userData.email,
      name: userData.name || 'Usuário',
      subject: email.subject,
      body: email.body,
      type: email.type,
      eventId: email.eventId,
      timestamp: new Date().toISOString(),
      ...email.data
    }

    // Enviar via n8n webhook (se configurado)
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(n8nPayload)
        })

        if (!response.ok) {
          throw new Error(`N8N webhook failed: ${response.status}`)
        }

        // Salvar log da notificação
        {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id,
              type: email.type,
              title: email.subject,
              body: email.body,
              channel: 'email',
              success_count: 1,
              failure_count: 0,
              sent_at: new Date().toISOString()
            })
          if (logError) {
            console.warn('Erro ao salvar log de notificação:', logError)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Email enviado com sucesso via n8n'
        })

      } catch (error) {
        console.error('Erro ao enviar via n8n:', error)
        
        // Salvar log de falha
        {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id,
              type: email.type,
              title: email.subject,
              body: email.body,
              channel: 'email',
              success_count: 0,
              failure_count: 1,
              sent_at: new Date().toISOString()
            })
          if (logError) {
            console.warn('Erro ao salvar log de notificação:', logError)
          }
        }

        return NextResponse.json(
          { error: 'Erro ao enviar email via n8n' },
          { status: 500 }
        )
      }
    }

    // Fallback 1: usar Resend via HTTP (sem SDK)
    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = process.env.EMAIL_FROM || 'Alidash <no-reply@voxcash.app>'

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: fromAddress,
            to: userData.email,
            subject: email.subject,
            // Enviar em HTML; se vier texto puro, manter simples
            html: email.body || '<p>Mensagem vazia</p>'
          })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          throw new Error(`Resend failed: ${resendResponse.status} ${resendData?.error?.message || ''}`)
        }

        {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id,
              type: email.type,
              title: email.subject,
              body: email.body,
              channel: 'email',
              success_count: 1,
              failure_count: 0,
              sent_at: new Date().toISOString()
            })
          if (logError) {
            console.warn('Erro ao salvar log de notificação (Resend):', logError)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Email enviado com sucesso via Resend',
          provider: 'resend',
          data: resendData
        })
      } catch (error) {
        console.error('Erro ao enviar via Resend:', error)
        {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id,
              type: email.type,
              title: email.subject,
              body: email.body,
              channel: 'email',
              success_count: 0,
              failure_count: 1,
              sent_at: new Date().toISOString()
            })
          if (logError) {
            console.warn('Erro ao salvar log de notificação (Resend):', logError)
          }
        }

        return NextResponse.json(
          { error: 'Erro ao enviar email via Resend' },
          { status: 500 }
        )
      }
    }

    // Fallback 2: modo desenvolvimento (logar sem envio real)
    try {
      // Nota: Esta é uma implementação básica
      // Em produção, você deve usar um serviço de email dedicado
      console.log('Enviando email via fallback:', n8nPayload)
      
      return NextResponse.json({
        success: true,
        message: 'Email processado (modo desenvolvimento)',
        provider: 'development',
        data: n8nPayload
      })

    } catch (error) {
      console.error('Erro no fallback de email:', error)
      return NextResponse.json(
        { error: 'Erro ao processar email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}