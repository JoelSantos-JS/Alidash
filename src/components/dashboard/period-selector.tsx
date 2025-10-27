"use client"

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface PeriodSelectorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  className?: string
}

export function PeriodSelector({ 
  currentDate, 
  onDateChange, 
  className 
}: PeriodSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handlePreviousMonth = () => {
    const newDate = subMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handlePreviousMonth}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="min-w-[150px] font-medium"
            aria-label="Selecionar mês"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            defaultMonth={currentDate}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleNextMonth}
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}