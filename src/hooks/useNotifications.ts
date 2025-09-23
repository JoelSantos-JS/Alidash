"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'

export interface NotificationPreferences {
  pushNotifications: boolean
  emailNotifications: boolean
  calendarReminders: boolean
  productAlerts: boolean
  transactionAlerts: boolean
  goalReminders: boolean
  debtReminders: boolean
  reminderTime: number // minutos antes do evento
}

export interface PushNotificationData {
  title: string
  body: string
  type: 'calendar_event' | 'product_alert' | 'transaction' | 'goal_reminder' | 'debt_reminder' | 'general'
  url?: string
  eventId?: string
  data?: any
}

export function useNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushNotifications: false,
    emailNotifications: true,
    calendarReminders: true,
    productAlerts: true,
    transactionAlerts: true,
    goalReminders: true,
    debtReminders: true,
    reminderTime: 15
  })
  const [loading, setLoading] = useState(false)

  // Verificar suporte a notificações
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window)
      setPermission(Notification.permission)
    }
  }, [])

  // Carregar preferências do usuário
  useEffect(() => {
    if (user?.id) {
      loadPreferences()
    }
  }, [user?.id])

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/notifications/preferences?user_id=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences || preferences)
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
    }
  }

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return

    try {
      setLoading(true)
      const updatedPreferences = { ...preferences, ...newPreferences }
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          preferences: updatedPreferences
        })
      })

      if (response.ok) {
        setPreferences(updatedPreferences)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notificações não são suportadas neste navegador')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        await subscribeToPush()
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }

  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Verificar se já existe uma subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Criar nova subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('VAPID public key não configurada')
          return null
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
      }

      setSubscription(subscription)

      // Salvar subscription no servidor
      if (user?.id) {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.id,
            subscription: subscription.toJSON()
          })
        })
      }

      return subscription
    } catch (error) {
      console.error('Erro ao se inscrever para push:', error)
      return null
    }
  }

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
      }

      // Remover subscription do servidor
      if (user?.id) {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: user.id
          })
        })
      }

      return true
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error)
      return false
    }
  }

  const sendNotification = useCallback(async (data: PushNotificationData): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          notification: data
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return false
    }
  }, [user?.id])

  const scheduleNotification = useCallback(async (
    data: PushNotificationData,
    scheduledTime: Date
  ): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          notification: data,
          scheduled_time: scheduledTime.toISOString()
        })
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao agendar notificação:', error)
      return false
    }
  }, [user?.id])

  const testNotification = useCallback(async (): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return false
    }

    return sendNotification({
      title: 'Teste - Alidash',
      body: 'Suas notificações estão funcionando perfeitamente! 🎉',
      type: 'general'
    })
  }, [permission, requestPermission, sendNotification])

  return {
    // Estado
    permission,
    isSupported,
    subscription,
    preferences,
    loading,
    
    // Ações
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    savePreferences,
    sendNotification,
    scheduleNotification,
    testNotification,
    
    // Helpers
    isEnabled: permission === 'granted' && preferences.pushNotifications,
    canRequest: isSupported && permission === 'default'
  }
}

// Utility function para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}