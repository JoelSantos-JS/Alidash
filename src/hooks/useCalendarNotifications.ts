'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-supabase-auth'
import { useNotifications } from '@/hooks/useNotifications'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  attendees?: string[]
  type?: 'meeting' | 'appointment' | 'reminder' | 'task'
}

export function useCalendarNotifications() {
  const { user } = useAuth()
  const { sendNotification, sendEmail } = useNotifications()

  // Função para agendar notificação de evento
  const scheduleEventNotification = useCallback(async (
    event: CalendarEvent,
    reminderMinutes: number = 15
  ) => {
    if (!user?.id) return

    const now = new Date()
    const eventStart = new Date(event.start)
    const reminderTime = new Date(eventStart.getTime() - (reminderMinutes * 60 * 1000))

    // Se o lembrete já passou, não agendar
    if (reminderTime <= now) {
      console.log('Lembrete já passou, não agendando:', event.title)
      return
    }

    // Calcular tempo até o lembrete
    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    // Agendar notificação
    setTimeout(async () => {
      try {
        // Enviar notificação push
        await sendNotification({
          title: `📅 ${event.title}`,
          body: `Evento em ${reminderMinutes} minutos${event.location ? ` - ${event.location}` : ''}`,
          type: 'calendar_event',
          url: `/agenda?event=${event.id}`,
          eventId: event.id,
          data: {
            eventStart: event.start.toISOString(),
            eventEnd: event.end.toISOString(),
            location: event.location,
            reminderMinutes
          }
        })

        console.log('Notificação de evento enviada:', event.title)
      } catch (error) {
        console.error('Erro ao enviar notificação de evento:', error)
      }
    }, timeUntilReminder)

    console.log(`Notificação agendada para ${reminderTime.toLocaleString()}: ${event.title}`)
  }, [user?.id, sendNotification])

  // Função para enviar resumo diário por email
  const sendDailyEmailSummary = useCallback(async (events: CalendarEvent[]) => {
    if (!user?.id || events.length === 0) return

    const today = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const eventsList = events
      .map(event => {
        const startTime = new Date(event.start).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
        const endTime = new Date(event.end).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
        
        return `• ${startTime} - ${endTime}: ${event.title}${event.location ? ` (${event.location})` : ''}`
      })
      .join('\n')

    const emailBody = `
Olá! Aqui está o resumo dos seus eventos para ${today}:

${eventsList}

${events.length === 1 ? 'Você tem 1 evento hoje.' : `Você tem ${events.length} eventos hoje.`}

Tenha um ótimo dia!

---
VoxCash - Seu assistente pessoal
    `.trim()

    try {
      await sendEmail({
        subject: `📅 Agenda do dia - ${today}`,
        body: emailBody,
        type: 'calendar_event',
        data: {
          eventCount: events.length,
          date: today,
          events: events.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start.toISOString(),
            end: e.end.toISOString()
          }))
        }
      })

      console.log('Resumo diário enviado por email')
    } catch (error) {
      console.error('Erro ao enviar resumo diário:', error)
    }
  }, [user?.id, sendEmail])

  // Função para notificar sobre conflitos de agenda
  const notifyScheduleConflict = useCallback(async (
    newEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[]
  ) => {
    if (!user?.id) return

    const conflictList = conflictingEvents
      .map(event => `• ${event.title} (${new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`)
      .join('\n')

    try {
      await sendNotification({
        title: '⚠️ Conflito de Agenda',
        body: `O evento "${newEvent.title}" conflita com outros eventos`,
        type: 'calendar_event',
        url: `/agenda?event=${newEvent.id}`,
        eventId: newEvent.id,
        data: {
          conflictingEvents: conflictingEvents.map(e => e.id),
          newEventId: newEvent.id
        }
      })

      // Também enviar por email se for um conflito importante
      if (conflictingEvents.length > 1) {
        await sendEmail({
          subject: '⚠️ Conflito de Agenda Detectado',
          body: `
O evento "${newEvent.title}" que você agendou para ${new Date(newEvent.start).toLocaleString('pt-BR')} conflita com os seguintes eventos:

${conflictList}

Recomendamos revisar sua agenda para evitar sobreposições.

---
VoxCash - Seu assistente pessoal
          `.trim(),
          type: 'calendar_event',
          data: {
            newEvent: newEvent.id,
            conflicts: conflictingEvents.map(e => e.id)
          }
        })
      }

      console.log('Notificação de conflito enviada')
    } catch (error) {
      console.error('Erro ao notificar conflito:', error)
    }
  }, [user?.id, sendNotification, sendEmail])

  // Função para lembrete de preparação para reunião
  const sendMeetingPreparationReminder = useCallback(async (
    event: CalendarEvent,
    minutesBefore: number = 30
  ) => {
    if (!user?.id || event.type !== 'meeting') return

    try {
      await sendNotification({
        title: '🎯 Preparação para Reunião',
        body: `Reunião "${event.title}" em ${minutesBefore} minutos. Hora de se preparar!`,
        type: 'calendar_event',
        url: `/agenda?event=${event.id}`,
        eventId: event.id,
        data: {
          preparationTime: minutesBefore,
          meetingStart: event.start.toISOString()
        }
      })

      console.log('Lembrete de preparação enviado:', event.title)
    } catch (error) {
      console.error('Erro ao enviar lembrete de preparação:', error)
    }
  }, [user?.id, sendNotification])

  // Função para notificar sobre eventos perdidos
  const notifyMissedEvent = useCallback(async (event: CalendarEvent) => {
    if (!user?.id) return

    try {
      await sendNotification({
        title: '😔 Evento Perdido',
        body: `Você perdeu o evento "${event.title}"`,
        type: 'calendar_event',
        url: `/agenda?event=${event.id}`,
        eventId: event.id,
        data: {
          missedAt: new Date().toISOString(),
          originalStart: event.start.toISOString()
        }
      })

      console.log('Notificação de evento perdido enviada:', event.title)
    } catch (error) {
      console.error('Erro ao notificar evento perdido:', error)
    }
  }, [user?.id, sendNotification])

  return {
    scheduleEventNotification,
    sendDailyEmailSummary,
    notifyScheduleConflict,
    sendMeetingPreparationReminder,
    notifyMissedEvent
  }
}