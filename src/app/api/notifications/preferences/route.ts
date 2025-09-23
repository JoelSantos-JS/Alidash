import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export interface NotificationPreferences {
  pushNotifications: boolean
  emailNotifications: boolean
  calendarReminders: boolean
  productAlerts: boolean
  transactionAlerts: boolean
  goalReminders: boolean
  debtReminders: boolean
  reminderTime: number
}

/**
 * GET - Buscar preferências de notificação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se a tabela existe
    const { data: tableExists } = await supabase
      .from('notification_preferences')
      .select('count')
      .limit(1)
      .maybeSingle()

    if (!tableExists && tableExists !== null) {
      // Tabela não existe, retornar preferências padrão
      const defaultPreferences: NotificationPreferences = {
        pushNotifications: false,
        emailNotifications: true,
        calendarReminders: true,
        productAlerts: true,
        transactionAlerts: true,
        goalReminders: true,
        debtReminders: true,
        reminderTime: 15
      }

      return NextResponse.json({
        preferences: defaultPreferences,
        message: 'Usando preferências padrão - tabela não configurada'
      })
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar preferências:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar preferências' },
        { status: 500 }
      )
    }

    if (!preferences) {
      // Usuário não tem preferências salvas, retornar padrão
      const defaultPreferences: NotificationPreferences = {
        pushNotifications: false,
        emailNotifications: true,
        calendarReminders: true,
        productAlerts: true,
        transactionAlerts: true,
        goalReminders: true,
        debtReminders: true,
        reminderTime: 15
      }

      return NextResponse.json({
        preferences: defaultPreferences
      })
    }

    // Converter dados do banco para o formato esperado
    const userPreferences: NotificationPreferences = {
      pushNotifications: preferences.push_notifications || false,
      emailNotifications: preferences.email_notifications || true,
      calendarReminders: preferences.calendar_reminders || true,
      productAlerts: preferences.product_alerts || true,
      transactionAlerts: preferences.transaction_alerts || true,
      goalReminders: preferences.goal_reminders || true,
      debtReminders: preferences.debt_reminders || true,
      reminderTime: preferences.reminder_time || 15
    }

    return NextResponse.json({
      preferences: userPreferences
    })

  } catch (error) {
    console.error('Erro ao buscar preferências de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Salvar preferências de notificação do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, preferences } = await request.json()

    if (!user_id || !preferences) {
      return NextResponse.json(
        { error: 'user_id e preferences são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se a tabela existe
    const { data: tableExists } = await supabase
      .from('notification_preferences')
      .select('count')
      .limit(1)
      .maybeSingle()

    if (!tableExists && tableExists !== null) {
      return NextResponse.json(
        { 
          error: 'Tabela de preferências não configurada',
          message: 'Execute o script SQL para criar a tabela notification_preferences'
        },
        { status: 503 }
      )
    }

    // Converter formato do frontend para o banco
    const dbPreferences = {
      user_id,
      push_notifications: preferences.pushNotifications || false,
      email_notifications: preferences.emailNotifications !== false,
      calendar_reminders: preferences.calendarReminders !== false,
      product_alerts: preferences.productAlerts !== false,
      transaction_alerts: preferences.transactionAlerts !== false,
      goal_reminders: preferences.goalReminders !== false,
      debt_reminders: preferences.debtReminders !== false,
      reminder_time: preferences.reminderTime || 15,
      updated_at: new Date().toISOString()
    }

    // Tentar atualizar primeiro
    const { data: existingPrefs } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user_id)
      .single()

    let result
    if (existingPrefs) {
      // Atualizar preferências existentes
      result = await supabase
        .from('notification_preferences')
        .update(dbPreferences)
        .eq('user_id', user_id)
    } else {
      // Criar novas preferências
      result = await supabase
        .from('notification_preferences')
        .insert({
          ...dbPreferences,
          created_at: new Date().toISOString()
        })
    }

    if (result.error) {
      console.error('Erro ao salvar preferências:', result.error)
      return NextResponse.json(
        { error: 'Erro ao salvar preferências' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferências salvas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar preferências de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}