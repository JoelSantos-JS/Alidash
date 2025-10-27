'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-supabase-auth'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Calendar, ShoppingCart, Target, CreditCard, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NotificationPreferences {
  push_notifications: boolean
  email_notifications: boolean
  calendar_reminders: boolean
  product_alerts: boolean
  transaction_alerts: boolean
  goal_reminders: boolean
  debt_reminders: boolean
  reminder_time: number
}

export default function NotificationSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { 
    permission, 
    subscription, 
    requestPermission, 
    subscribeToPush, 
    unsubscribeFromPush,
    testNotification 
  } = useNotifications()
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_notifications: false,
    email_notifications: true,
    calendar_reminders: true,
    product_alerts: true,
    transaction_alerts: true,
    goal_reminders: true,
    debt_reminders: true,
    reminder_time: 15
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Carregar preferências do usuário
  useEffect(() => {
    if (user?.id) {
      loadPreferences()
    }
  }, [user?.id])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar preferências de notificação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user?.id) return

    setSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          preferences
        })
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Preferências salvas com sucesso!"
        })
      } else {
        throw new Error('Erro ao salvar preferências')
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar preferências",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if (permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          toast({
            title: "Erro",
            description: "Permissão para notificações negada",
            variant: "destructive"
          })
          return
        }
      }
      
      if (!subscription) {
        const subscribed = await subscribeToPush()
        if (!subscribed) {
          toast({
            title: "Erro",
            description: "Erro ao ativar notificações push",
            variant: "destructive"
          })
          return
        }
      }
    } else {
      await unsubscribeFromPush()
    }

    setPreferences(prev => ({ ...prev, push_notifications: enabled }))
  }

  const handleTestNotification = async () => {
    try {
      await testNotification()
      toast({
        title: "Sucesso",
        description: "Notificação de teste enviada!"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação de teste",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Configure como e quando você deseja receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notificações Push */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações Push
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações instantâneas no navegador
              </p>
            </div>
            <Switch
              checked={preferences.push_notifications}
              onCheckedChange={handlePushNotificationToggle}
            />
          </div>

          {preferences.push_notifications && (
            <div className="ml-6 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                className="text-xs"
              >
                Testar Notificação
              </Button>
              {permission !== 'granted' && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Permissão para notificações necessária
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Notificações por Email */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificações por Email
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba resumos e alertas importantes por email
            </p>
          </div>
          <Switch
            checked={preferences.email_notifications}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, email_notifications: checked }))
            }
          />
        </div>

        <Separator />

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Tipos de Notificação</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-normal">
                <Calendar className="h-4 w-4" />
                Lembretes de Calendário
              </Label>
              <Switch
                checked={preferences.calendar_reminders}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, calendar_reminders: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-normal">
                <ShoppingCart className="h-4 w-4" />
                Alertas de Produtos
              </Label>
              <Switch
                checked={preferences.product_alerts}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, product_alerts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-normal">
                <CreditCard className="h-4 w-4" />
                Alertas de Transações
              </Label>
              <Switch
                checked={preferences.transaction_alerts}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, transaction_alerts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-normal">
                <Target className="h-4 w-4" />
                Lembretes de Metas
              </Label>
              <Switch
                checked={preferences.goal_reminders}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, goal_reminders: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 font-normal">
                <AlertCircle className="h-4 w-4" />
                Lembretes de Dívidas
              </Label>
              <Switch
                checked={preferences.debt_reminders}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, debt_reminders: checked }))
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tempo de Lembrete */}
        <div className="space-y-2">
          <Label className="text-base font-medium">Tempo de Antecedência</Label>
          <p className="text-sm text-muted-foreground">
            Minutos antes do evento para receber lembretes
          </p>
          <select
            value={preferences.reminder_time}
            onChange={(e) =>
              setPreferences(prev => ({ 
                ...prev, 
                reminder_time: parseInt(e.target.value) 
              }))
            }
            className="w-full p-2 border rounded-md"
          >
            <option value={5}>5 minutos</option>
            <option value={10}>10 minutos</option>
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
            <option value={120}>2 horas</option>
            <option value={1440}>1 dia</option>
          </select>
        </div>

        <Separator />

        {/* Botões de Ação */}
        <div className="space-y-3">
          {/* Botão de Teste - só aparece se push notifications estiver ativo */}
          {preferences.push_notifications && subscription && (
            <Button 
              onClick={handleTestNotification}
              variant="outline"
              className="w-full"
            >
              🔔 Testar Notificação
            </Button>
          )}
          
          {/* Botão Salvar */}
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}