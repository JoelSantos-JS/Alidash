import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export interface EmailNotificationData {
  to: string
  subject: string
  body: string
  type: 'calendar_event' | 'product_alert' | 'transaction' | 'goal_reminder' | 'debt_reminder' | 'general' | 'welcome'
  eventId?: string
  data?: any
}

/**
 * POST - Enviar notificação por email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { user_id?: string; email: EmailNotificationData }
    const { user_id, email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'email é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const transactional = email.type === 'welcome'
    let targetEmail = email.to
    let targetName = 'Usuário'
    let resolvedUserId = user_id

    if (!targetEmail && resolvedUserId) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', resolvedUserId)
        .single()
      targetEmail = userData?.email || ''
      targetName = userData?.name || 'Usuário'
    }

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'Email do usuário não encontrado' },
        { status: 404 }
      )
    }

    let preferences: any = null
    if (!transactional && resolvedUserId) {
      const prefResult = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', resolvedUserId)
        .single()
      preferences = prefResult.data || null
      if (preferences && !preferences.email_notifications) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Usuário desabilitou notificações por email'
          }
        )
      }
    }

    // Verificar preferências específicas por tipo
    const typePreferences: Record<EmailNotificationData['type'], boolean> = {
      calendar_event: transactional ? true : preferences?.calendar_reminders !== false,
      product_alert: transactional ? true : preferences?.product_alerts !== false,
      transaction: transactional ? true : preferences?.transaction_alerts !== false,
      goal_reminder: transactional ? true : preferences?.goal_reminders !== false,
      debt_reminder: transactional ? true : preferences?.debt_reminders !== false,
      general: true,
      welcome: true
    }

    if (!typePreferences[email.type]) {
      return NextResponse.json(
        { 
          success: false,
          message: `Usuário desabilitou emails do tipo ${email.type}`
        }
      )
    }

    const subject = email.subject || (email.type === 'welcome' ? 'Bem-vindo ao Alidash' : '')
    const htmlBody = email.body || (email.type === 'welcome'
      ? `<h1>Bem-vindo, ${targetName}</h1><p>Seu cadastro no Alidash foi realizado.</p><p>Acesse ${process.env.NEXT_PUBLIC_APP_URL || ''} para começar.</p>`
      : '<p></p>')

    const n8nPayload = {
      to: targetEmail,
      name: targetName,
      subject,
      body: htmlBody,
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

        if (resolvedUserId) {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id: resolvedUserId,
              type: email.type,
              title: subject,
              body: htmlBody,
              channel: 'email',
              success_count: 1,
              failure_count: 0,
              sent_at: new Date().toISOString()
            })
          if (logError) {
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Email enviado com sucesso via n8n'
        })

      } catch (error) {
        console.error('Erro ao enviar via n8n:', error)
        
        if (resolvedUserId) {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id: resolvedUserId,
              type: email.type,
              title: subject,
              body: htmlBody,
              channel: 'email',
              success_count: 0,
              failure_count: 1,
              sent_at: new Date().toISOString()
            })
          if (logError) {
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
            to: targetEmail,
            subject,
            html: htmlBody || '<p>Mensagem vazia</p>'
          })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          throw new Error(`Resend failed: ${resendResponse.status} ${resendData?.error?.message || ''}`)
        }

        if (resolvedUserId) {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id: resolvedUserId,
              type: email.type,
              title: subject,
              body: htmlBody,
              channel: 'email',
              success_count: 1,
              failure_count: 0,
              sent_at: new Date().toISOString()
            })
          if (logError) {
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
        if (resolvedUserId) {
          const { error: logError } = await supabase
            .from('notification_logs')
            .insert({
              user_id: resolvedUserId,
              type: email.type,
              title: subject,
              body: htmlBody,
              channel: 'email',
              success_count: 0,
              failure_count: 1,
              sent_at: new Date().toISOString()
            })
          if (logError) {
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          return NextResponse.json({
            success: true,
            message: 'Email processado (fallback após falha Resend)',
            provider: 'development',
            data: n8nPayload
          })
        } else {
          return NextResponse.json(
            { error: 'Erro ao enviar email via Resend' },
            { status: 500 }
          )
        }
      }
    }

    // Fallback 2: modo desenvolvimento (logar sem envio real)
    try {
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
