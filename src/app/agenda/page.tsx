"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { ArrowLeft, Plus, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Tipos para eventos de agenda
type CalendarEvent = {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[]
  type: 'meeting' | 'task' | 'reminder' | 'personal'
  priority: 'low' | 'medium' | 'high'
  status: 'confirmed' | 'tentative' | 'cancelled'
  isRecurring?: boolean
  calendarId?: string
  googleEventId?: string
}

export default function AgendaPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
    // TODO: Abrir modal de detalhes do evento
  }

  const handleCreateEvent = () => {
    console.log('Create event clicked')
    // TODO: Abrir modal de criação de evento
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // TODO: Sincronizar com Google Calendar
      console.log('Refreshing calendar...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular loading
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar de Agenda */}
      <CalendarSidebar
        events={events}
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
        onRefresh={handleRefresh}
        isLoading={isLoading}
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
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
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
                <CardTitle>Integração com Google Calendar</CardTitle>
                <CardDescription>
                  Conecte sua conta do Google para sincronizar seus eventos automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div>
                      <p className="font-medium">Não Conectado</p>
                      <p className="text-sm text-muted-foreground">
                        Conecte sua conta do Google para acessar seus calendários
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">
                    Conectar Google Calendar
                  </Button>
                </div>
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
    </div>
  )
}