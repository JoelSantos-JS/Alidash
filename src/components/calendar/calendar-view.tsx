"use client"

import { useState, useMemo } from "react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks, 
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  getWeek,
  startOfWeek as startOfWeekFn,
  endOfWeek as endOfWeekFn
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarEvent } from "@/hooks/useCalendarEvents"
import { cn } from "@/lib/utils"

type CalendarViewType = "month" | "week" | "day"

interface CalendarViewProps {
  events: CalendarEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onCreateEvent?: (date?: Date) => void
  className?: string
}

export function CalendarView({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onCreateEvent,
  className,
}: CalendarViewProps) {
  const [viewType, setViewType] = useState<CalendarViewType>("month")
  const [currentDate, setCurrentDate] = useState(selectedDate)

  // Navegação
  const navigatePrevious = () => {
    switch (viewType) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (viewType) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const navigateToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateSelect(today)
  }

  // Filtrar eventos por data
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return isSameDay(eventDate, date)
    })
  }

  const getEventsForTimeSlot = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(date)
      slotEnd.setHours(hour + 1, 0, 0, 0)

      return (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      )
    })
  }

  // Formatação de títulos
  const getViewTitle = () => {
    switch (viewType) {
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: ptBR })
      case "week":
        const weekStart = startOfWeekFn(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeekFn(currentDate, { weekStartsOn: 0 })
        return `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`
      case "day":
        return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      default:
        return ""
    }
  }

  // Renderização da view mensal
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
          <div key={dayName} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {dayName}
          </div>
        ))}
        
        {/* Dias do mês */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border border-border cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "text-muted-foreground bg-muted/20",
                isSelected && "bg-primary/10 border-primary",
                isTodayDate && "bg-blue-50 border-blue-200"
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isTodayDate && "text-blue-600"
                )}>
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayEvents.length}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Renderização da view semanal
  const renderWeekView = () => {
    const weekStart = startOfWeekFn(currentDate, { weekStartsOn: 0 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="flex flex-col">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2"></div> {/* Espaço para coluna de horas */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center cursor-pointer rounded hover:bg-muted/50",
                isSameDay(day, selectedDate) && "bg-primary/10",
                isToday(day) && "bg-blue-50 text-blue-600 font-medium"
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-sm font-medium">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div className="text-lg">
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grade de horários */}
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-8 gap-1">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                {/* Coluna de horas */}
                <div className="p-2 text-sm text-muted-foreground text-right border-r">
                  {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                </div>
                
                {/* Colunas dos dias */}
                {weekDays.map((day) => {
                  const timeSlotEvents = getEventsForTimeSlot(day, hour)
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="min-h-[60px] p-1 border border-border cursor-pointer hover:bg-muted/50"
                      onClick={() => onCreateEvent?.(new Date(day.setHours(hour, 0, 0, 0)))}
                    >
                      {timeSlotEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 mb-1 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event)
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(event.start_time), "HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // Renderização da view diária
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = getEventsForDate(currentDate)

    return (
      <div className="flex flex-col">
        {/* Cabeçalho do dia */}
        <div className="p-4 text-center border-b">
          <h3 className="text-lg font-medium">
            {format(currentDate, "EEEE", { locale: ptBR })}
          </h3>
          <p className="text-2xl font-bold">
            {format(currentDate, "d")}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Lista de eventos do dia */}
        <ScrollArea className="h-[600px]">
          <div className="p-4 space-y-2">
            {hours.map((hour) => {
              const timeSlotEvents = getEventsForTimeSlot(currentDate, hour)
              
              return (
                <div key={hour} className="flex gap-4">
                  {/* Coluna de hora */}
                  <div className="w-16 text-sm text-muted-foreground text-right pt-2">
                    {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                  </div>
                  
                  {/* Coluna de eventos */}
                  <div 
                    className="flex-1 min-h-[60px] border-l border-border pl-4 cursor-pointer hover:bg-muted/50 rounded"
                    onClick={() => onCreateEvent?.(new Date(currentDate.setHours(hour, 0, 0, 0)))}
                  >
                    {timeSlotEvents.length > 0 ? (
                      <div className="space-y-2">
                        {timeSlotEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick?.(event)
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                            </div>
                            {event.location && (
                              <div className="text-sm text-muted-foreground">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Clique para criar evento
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {getViewTitle()}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Seletor de view */}
            <Select value={viewType} onValueChange={(value: CalendarViewType) => setViewType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="day">Dia</SelectItem>
              </SelectContent>
            </Select>

            {/* Navegação */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewType === "month" && renderMonthView()}
        {viewType === "week" && renderWeekView()}
        {viewType === "day" && renderDayView()}
      </CardContent>
    </Card>
  )
}