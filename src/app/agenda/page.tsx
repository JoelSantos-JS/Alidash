'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarSidebar } from '@/components/calendar/calendar-sidebar'
import { CalendarView } from '@/components/calendar/calendar-view'
import { EventModal } from '@/components/calendar/event-modal'
import { EventList } from '@/components/calendar/event-list'
import { SyncSettings } from '@/components/calendar/sync-settings'
import NotificationSettings from '@/components/notifications/notification-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Plus, Settings, RefreshCw, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar'
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents'
import { toast } from 'sonner'

export default function AgendaPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { 
    status: googleStatus, 
    connectGoogleCalendar, 
    disconnectGoogleCalendar, 
    syncEvents 
  } = useGoogleCalendar()
  const { 
    events, 
    isLoading: eventsLoading, 
    error: eventsError,
    getTodayEvents, 
    getUpcomingEvents,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents()

  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventModalMode, setEventModalMode] = useState<'view' | 'create' | 'edit'>('view')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showSyncSettings, setShowSyncSettings] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [loading, user, router])

  // Verificar callback do OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    if (code && state === 'google_calendar_auth') {
      handleOAuthCallback(code)
    }
  }, [])

  const handleOAuthCallback = async (code: string) => {
    try {
      const response = await fetch('/api/calendar/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      if (response.ok) {
        toast.success('Google Calendar conectado com sucesso!')
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname)
        // Recarregar status
        window.location.reload()
      } else {
        throw new Error('Falha na autenticação')
      }
    } catch (error) {
      console.error('Erro no callback OAuth:', error)
      toast.error('Erro ao conectar Google Calendar')
    }
  }

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleCalendar()
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error)
      toast.error('Erro ao conectar Google Calendar')
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogleCalendar()
      toast.success('Google Calendar desconectado')
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error)
      toast.error('Erro ao desconectar Google Calendar')
    }
  }

  const handleSyncEvents = async () => {
    setIsSyncing(true)
    try {
      await syncEvents()
      toast.success('Eventos sincronizados com sucesso!')
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error)
      toast.error('Erro ao sincronizar eventos')
    } finally {
      setIsSyncing(false)
    }
  }

  // Converter eventos para o formato do sidebar
  const convertToSidebarEvent = (event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: new Date(event.start_time).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    endTime: new Date(event.end_time).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    date: new Date(event.start_time).toLocaleDateString('pt-BR'),
    priority: event.priority || 'medium',
    type: event.type || 'meeting',
    attendees: event.attendees || [],
    user_id: event.user_id,
    start_time: event.start_time,
    end_time: event.end_time,
    is_all_day: event.is_all_day,
    recurrence: event.recurrence,
    created_at: event.created_at,
    updated_at: event.updated_at
  })

  const sidebarEvents = events.map(convertToSidebarEvent)

  // Funções de gerenciamento de eventos
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setEventModalMode('view')
    setEventModalOpen(true)
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setEventModalMode('create')
    setEventModalOpen(true)
  }

  const handleEditEvent = (event?: CalendarEvent) => {
    if (event) {
      setSelectedEvent(event)
    }
    setEventModalMode('edit')
    setEventModalOpen(true)
  }

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      if (eventModalMode === 'create') {
        await createEvent(eventData)
        toast.success('Evento criado com sucesso!')
      } else if (eventModalMode === 'edit' && selectedEvent) {
        await updateEvent(selectedEvent.id, eventData)
        toast.success('Evento atualizado com sucesso!')
      }
      setEventModalOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      toast.error('Erro ao salvar evento')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      toast.success('Evento excluído com sucesso!')
      setEventModalOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento')
    }
  }

  const handleCloseModal = () => {
    setEventModalOpen(false)
    setSelectedEvent(null)
  }

  const handleRefresh = async () => {
    try {
      console.log('Refreshing calendar...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de Agenda */}
      <CalendarSidebar
        events={sidebarEvents}
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
        onRefresh={handleRefresh}
        isLoading={eventsLoading}
        className="w-80 border-r"
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Agenda</h1>
                <p className="text-muted-foreground">Gerencie seus eventos e compromissos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSyncSettings(!showSyncSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Sincronização
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </Button>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Status da Integração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Integração com Google Calendar
                </CardTitle>
                <CardDescription>
                  Conecte sua conta do Google para sincronizar eventos automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {googleStatus.isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <div className={`h-3 w-3 rounded-full ${
                        googleStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    )}
                    <span className="font-medium">
                      Status: {googleStatus.isLoading ? 'Verificando...' : 
                               googleStatus.isConnected ? 'Conectado' : 'Não Conectado'}
                    </span>
                    {googleStatus.lastSync && (
                      <span className="text-sm text-muted-foreground">
                        (Última sync: {new Date(googleStatus.lastSync).toLocaleString()})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {googleStatus.isConnected ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSyncEvents}
                          disabled={isSyncing}
                        >
                          {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sincronizar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={handleDisconnectGoogle}
                          disabled={googleStatus.isLoading}
                        >
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={handleConnectGoogle}
                        disabled={googleStatus.isLoading}
                      >
                        {googleStatus.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Conectar Google Calendar
                      </Button>
                    )}
                  </div>
                </div>

                {googleStatus.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{googleStatus.error}</span>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p>Após conectar, você poderá:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sincronizar eventos automaticamente</li>
                    <li>Criar eventos diretamente no Google Calendar</li>
                    <li>Receber notificações de eventos</li>
                    <li>Visualizar eventos de múltiplos calendários</li>
                  </ul>
                </div>
              </CardContent>
            </Card>



            {/* Configurações de Sincronização */}
            {showSyncSettings && (
              <SyncSettings
                isConnected={googleStatus.isConnected}
                onSync={handleSyncEvents}
              />
            )}

            {/* Configurações de Notificação */}
            {showNotificationSettings && (
              <NotificationSettings />
            )}

            {/* Visualização do Calendário */}
            <CalendarView
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />

            {/* Lista de Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seus Eventos</span>
                  <div className="flex items-center gap-2">
                    {eventsLoading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {events.length} evento{events.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os seus eventos em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventList
                  events={events}
                  onEventClick={handleEventClick}
                  onEventEdit={handleEditEvent}
                  onEventDelete={(event) => handleDeleteEvent(event.id)}
                  showDateHeaders={true}
                />
              </CardContent>
            </Card>

            {/* Próximos Recursos */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos em Desenvolvimento</CardTitle>
                <CardDescription>
                  Funcionalidades que serão implementadas em breve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">📅 Visualização de Calendário</h3>
                    <p className="text-sm text-muted-foreground">
                      Interface de calendário completa com visualizações mensais, semanais e diárias
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">🔄 Sincronização Automática</h3>
                    <p className="text-sm text-muted-foreground">
                      Sincronização bidirecional com Google Calendar em tempo real
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">🔔 Notificações</h3>
                    <p className="text-sm text-muted-foreground">
                      Lembretes e notificações personalizáveis para seus eventos
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">👥 Eventos Compartilhados</h3>
                    <p className="text-sm text-muted-foreground">
                      Criação e gerenciamento de eventos com múltiplos participantes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle>Como Usar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Conecte sua conta do Google</p>
                      <p className="text-sm text-muted-foreground">
                        Clique em "Conectar Google Calendar" para autorizar o acesso aos seus calendários
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Visualize seus eventos</p>
                      <p className="text-sm text-muted-foreground">
                        Seus eventos do Google Calendar aparecerão automaticamente na sidebar
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Gerencie seus compromissos</p>
                      <p className="text-sm text-muted-foreground">
                        Crie, edite e organize seus eventos diretamente no VoxCash
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Eventos */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        mode={eventModalMode}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onEdit={() => handleEditEvent()}
      />
    </div>
  )
}