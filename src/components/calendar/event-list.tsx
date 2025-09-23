"use client"

import { useState } from "react"
import { format, isToday, isTomorrow, isYesterday, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, MapPin, MoreVertical, Eye, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarEvent } from "@/hooks/useCalendarEvents"
import { cn } from "@/lib/utils"

interface EventListProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
  onEventDelete?: (event: CalendarEvent) => void
  selectedDate?: Date
  showDateHeaders?: boolean
  className?: string
}

const STATUS_COLORS = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  tentative: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const STATUS_LABELS = {
  confirmed: "Confirmado",
  tentative: "Tentativo",
  cancelled: "Cancelado",
}

export function EventList({
  events,
  onEventClick,
  onEventEdit,
  onEventDelete,
  selectedDate,
  showDateHeaders = true,
  className,
}: EventListProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const formatEventTime = (event: CalendarEvent) => {
    const startDate = new Date(event.start_time)
    const endDate = new Date(event.end_time)

    if (event.is_all_day) {
      return "Dia inteiro"
    }

    return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`
  }

  const formatEventDate = (date: Date) => {
    if (isToday(date)) {
      return "Hoje"
    } else if (isTomorrow(date)) {
      return "Amanhã"
    } else if (isYesterday(date)) {
      return "Ontem"
    } else {
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
    }
  }

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {}

    events.forEach((event) => {
      const eventDate = new Date(event.start_time)
      const dateKey = format(eventDate, "yyyy-MM-dd")

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    // Ordenar eventos dentro de cada data por horário
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      })
    })

    return grouped
  }

  const filteredEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.start_time)
        return (
          eventDate >= startOfDay(selectedDate) &&
          eventDate <= endOfDay(selectedDate)
        )
      })
    : events

  const groupedEvents = showDateHeaders
    ? groupEventsByDate(filteredEvents)
    : { "all": filteredEvents }

  const sortedDateKeys = Object.keys(groupedEvents).sort()

  if (filteredEvents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {selectedDate
              ? "Nenhum evento encontrado para esta data"
              : "Nenhum evento encontrado"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {sortedDateKeys.map((dateKey) => {
        const dateEvents = groupedEvents[dateKey]
        const date = dateKey !== "all" ? new Date(dateKey) : null

        return (
          <Card key={dateKey}>
            {showDateHeaders && date && (
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  {formatEventDate(date)}
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className={showDateHeaders && date ? "pt-0" : ""}>
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {dateEvents.map((event, index) => {
                    const isExpanded = expandedEvents.has(event.id)
                    const statusColor = STATUS_COLORS[event.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.confirmed

                    return (
                      <div key={event.id}>
                        {index > 0 && <Separator className="my-3" />}
                        
                        <div className="group relative">
                          <div
                            className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => onEventClick?.(event)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium truncate">{event.title}</h4>
                                <Badge className={cn("text-xs", statusColor)}>
                                  {STATUS_LABELS[event.status as keyof typeof STATUS_LABELS]}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatEventTime(event)}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {event.description && (
                                <p className={cn(
                                  "text-sm text-muted-foreground",
                                  !isExpanded && "line-clamp-2"
                                )}>
                                  {event.description}
                                </p>
                              )}

                              {event.description && event.description.length > 100 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 mt-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleEventExpansion(event.id)
                                  }}
                                >
                                  {isExpanded ? "Ver menos" : "Ver mais"}
                                </Button>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEventClick?.(event)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEventEdit?.(event)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEventDelete?.(event)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}