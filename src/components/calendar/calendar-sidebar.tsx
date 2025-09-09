"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  MapPin,
  Users,
  Video,
  Plus,
  Filter,
  RefreshCw,
  Settings,
  Bell,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Zap,
  Globe,
  Smartphone
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

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

type CalendarSidebarProps = {
  events: CalendarEvent[]
  selectedDate?: Date
  onEventClick?: (event: CalendarEvent) => void
  onCreateEvent?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

// Dados de exemplo para demonstração
const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunião de Planejamento',
    description: 'Discussão sobre metas do próximo trimestre',
    startTime: new Date(2025, 8, 7, 9, 0),
    endTime: new Date(2025, 8, 7, 10, 30),
    location: 'Sala de Reuniões A',
    attendees: ['João Silva', 'Maria Santos'],
    type: 'meeting',
    priority: 'high',
    status: 'confirmed',
    isRecurring: false
  },
  {
    id: '2',
    title: 'Apresentação do Projeto',
    startTime: new Date(2025, 8, 7, 14, 0),
    endTime: new Date(2025, 8, 7, 15, 0),
    type: 'meeting',
    priority: 'medium',
    status: 'confirmed',
    isRecurring: false
  },
  {
    id: '3',
    title: 'Lembrete: Enviar Relatório',
    startTime: new Date(2025, 8, 8, 16, 0),
    endTime: new Date(2025, 8, 8, 16, 30),
    type: 'reminder',
    priority: 'medium',
    status: 'confirmed',
    isRecurring: false
  }
]

export function CalendarSidebar({
  events = sampleEvents,
  selectedDate = new Date(),
  onEventClick,
  onCreateEvent,
  onRefresh,
  isLoading = false,
  className
}: CalendarSidebarProps) {
  const [viewFilter, setViewFilter] = useState<"all" | "today" | "week" | "month">("today")
  const [typeFilter, setTypeFilter] = useState<"all" | "meeting" | "task" | "reminder" | "personal">("all")
  const [isEventsOpen, setIsEventsOpen] = useState(true)
  const [isStatsOpen, setIsStatsOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)

  // Filtrar eventos baseado nos filtros selecionados
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(event => event.type === typeFilter)
    }

    // Filtro por período
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    switch (viewFilter) {
      case "today":
        filtered = filtered.filter(event => 
          event.startTime >= today && event.startTime < tomorrow
        )
        break
      case "week":
        filtered = filtered.filter(event => 
          event.startTime >= today && event.startTime < weekFromNow
        )
        break
      case "month":
        filtered = filtered.filter(event => 
          event.startTime >= today && event.startTime < monthFromNow
        )
        break
    }

    return filtered.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }, [events, viewFilter, typeFilter])

  // Estatísticas dos eventos
  const stats = useMemo(() => {
    const totalEvents = events.length
    const todayEvents = events.filter(event => {
      const today = new Date()
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === today.toDateString()
    }).length
    
    const upcomingEvents = events.filter(event => event.startTime > new Date()).length
    const meetingsCount = events.filter(event => event.type === 'meeting').length
    const tasksCount = events.filter(event => event.type === 'task').length
    const remindersCount = events.filter(event => event.type === 'reminder').length

    return {
      totalEvents,
      todayEvents,
      upcomingEvents,
      meetingsCount,
      tasksCount,
      remindersCount
    }
  }, [events])

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return Users
      case 'task': return CalendarCheck
      case 'reminder': return Bell
      case 'personal': return CalendarDays
      default: return Calendar
    }
  }

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'text-blue-600'
      case 'task': return 'text-green-600'
      case 'reminder': return 'text-orange-600'
      case 'personal': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const formatEventTime = (startTime: Date, endTime: Date) => {
    const start = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const end = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${start} - ${end}`
  }

  return (
    <div className={cn("w-80 bg-background border-r flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Agenda</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateEvent}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Google Calendar Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">Google Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              googleCalendarConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-muted-foreground">
              {googleCalendarConnected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Período
            </Label>
            <Select value={viewFilter} onValueChange={(value: any) => setViewFilter(value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
              Tipo
            </Label>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="meeting">Reuniões</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
                <SelectItem value="reminder">Lembretes</SelectItem>
                <SelectItem value="personal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Estatísticas */}
          <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
              <span className="font-medium text-sm">Estatísticas</span>
              {isStatsOpen ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.todayEvents}</div>
                    <div className="text-xs text-muted-foreground">Hoje</div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</div>
                    <div className="text-xs text-muted-foreground">Próximos</div>
                  </div>
                </Card>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span>Reuniões</span>
                  </div>
                  <span className="font-medium">{stats.meetingsCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-3 w-3 text-green-600" />
                    <span>Tarefas</span>
                  </div>
                  <span className="font-medium">{stats.tasksCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3 w-3 text-orange-600" />
                    <span>Lembretes</span>
                  </div>
                  <span className="font-medium">{stats.remindersCount}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Lista de Eventos */}
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
              <span className="font-medium text-sm">
                Eventos ({filteredEvents.length})
              </span>
              {isEventsOpen ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const IconComponent = getEventTypeIcon(event.type)
                  return (
                    <Card 
                      key={event.id} 
                      className={cn(
                        "p-3 cursor-pointer hover:shadow-md transition-all border-l-4",
                        getPriorityColor(event.priority)
                      )}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <IconComponent className={cn("h-4 w-4", getEventTypeColor(event.type))} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{event.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatEventTime(event.startTime, event.endTime)}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant={event.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.status === 'confirmed' ? 'Confirmado' : 
                             event.status === 'tentative' ? 'Tentativo' : 'Cancelado'}
                          </Badge>
                        </div>
                        
                        {event.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum evento encontrado</p>
                  <p className="text-xs mt-1">Conecte sua agenda do Google ou crie um novo evento</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Configurações */}
          <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-lg">
              <span className="font-medium text-sm">Configurações</span>
              {isSettingsOpen ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Conectar Google Calendar</Label>
                  <Switch 
                    checked={googleCalendarConnected}
                    onCheckedChange={setGoogleCalendarConnected}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Notificações</Label>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Sincronização Automática</Label>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurações Avançadas
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  )
}