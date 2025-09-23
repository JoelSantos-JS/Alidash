"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock, MapPin, Users, Video, Bell, Repeat, Trash2, Edit, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarEvent } from "@/hooks/useCalendarEvents"

const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  start_time: z.date(),
  end_time: z.date(),
  location: z.string().optional(),
  is_all_day: z.boolean().default(false),
  status: z.enum(["confirmed", "tentative", "cancelled"]).default("confirmed"),
  recurrence: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  event?: CalendarEvent | null
  mode: "view" | "create" | "edit"
  onSave?: (eventData: Partial<CalendarEvent>) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
  onEdit?: () => void
}

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmado", color: "bg-green-100 text-green-800" },
  { value: "tentative", label: "Tentativo", color: "bg-yellow-100 text-yellow-800" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-800" },
]

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Diariamente" },
  { value: "weekly", label: "Semanalmente" },
  { value: "monthly", label: "Mensalmente" },
  { value: "yearly", label: "Anualmente" },
]

export function EventModal({
  isOpen,
  onClose,
  event,
  mode,
  onSave,
  onDelete,
  onEdit,
}: EventModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hora depois
      location: "",
      is_all_day: false,
      status: "confirmed",
      recurrence: "none",
    },
  })

  // Atualizar formulário quando o evento mudar
  useEffect(() => {
    if (event && (mode === "edit" || mode === "view")) {
      form.reset({
        title: event.title,
        description: event.description || "",
        start_time: new Date(event.start_time),
        end_time: new Date(event.end_time),
        location: event.location || "",
        is_all_day: event.is_all_day,
        status: event.status as "confirmed" | "tentative" | "cancelled",
        recurrence: event.recurrence || "none",
      })
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        start_time: new Date(),
        end_time: new Date(Date.now() + 60 * 60 * 1000),
        location: "",
        is_all_day: false,
        status: "confirmed",
        recurrence: "none",
      })
    }
  }, [event, mode, form])

  const handleSubmit = async (data: EventFormData) => {
    if (!onSave) return

    setIsLoading(true)
    try {
      await onSave({
        ...data,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time.toISOString(),
        recurrence: data.recurrence === "none" ? "" : data.recurrence,
        id: event?.id,
      })
      onClose()
    } catch (error) {
      console.error("Erro ao salvar evento:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !event?.id) return

    setIsLoading(true)
    try {
      await onDelete(event.id)
      onClose()
    } catch (error) {
      console.error("Erro ao deletar evento:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status)
    return statusOption ? (
      <Badge className={statusOption.color}>
        {statusOption.label}
      </Badge>
    ) : null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {mode === "view" && "Detalhes do Evento"}
                {mode === "create" && "Criar Novo Evento"}
                {mode === "edit" && "Editar Evento"}
              </span>
              {mode === "view" && event && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              )}
            </DialogTitle>
            {mode === "view" && event && (
              <DialogDescription>
                {formatDateTime(new Date(event.start_time))} - {formatDateTime(new Date(event.end_time))}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {mode === "view" && event ? (
              // Modo de visualização
              <div className="space-y-6 p-1">
                <div>
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  {event.description && (
                    <p className="text-muted-foreground mt-2">{event.description}</p>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Data e Hora</p>
                        <p className="text-sm text-muted-foreground">
                          {event.is_all_day ? (
                            format(new Date(event.start_time), "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            `${formatDateTime(new Date(event.start_time))} - ${formatDateTime(new Date(event.end_time))}`
                          )}
                        </p>
                      </div>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Local</p>
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        {getStatusBadge(event.status)}
                      </div>
                    </div>

                    {event.recurrence && (
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Recorrência</p>
                          <p className="text-sm text-muted-foreground">
                            {RECURRENCE_OPTIONS.find(opt => opt.value === event.recurrence)?.label}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Modo de criação/edição
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o título do evento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adicione uma descrição (opcional)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_all_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Evento de dia inteiro</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            O evento durará o dia todo
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data/Hora de Início *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    form.watch("is_all_day") ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      format(field.value, "dd/MM/yyyy HH:mm", { locale: ptBR })
                                    )
                                  ) : (
                                    <span>Selecione a data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    const currentTime = field.value || new Date()
                                    const newDate = new Date(date)
                                    newDate.setHours(currentTime.getHours())
                                    newDate.setMinutes(currentTime.getMinutes())
                                    field.onChange(newDate)
                                  }
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                              {!form.watch("is_all_day") && (
                                <div className="p-3 border-t">
                                  <Label>Horário</Label>
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      if (field.value && e.target.value) {
                                        const [hours, minutes] = e.target.value.split(":")
                                        const newDate = new Date(field.value)
                                        newDate.setHours(parseInt(hours), parseInt(minutes))
                                        field.onChange(newDate)
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data/Hora de Fim *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    form.watch("is_all_day") ? (
                                      format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      format(field.value, "dd/MM/yyyy HH:mm", { locale: ptBR })
                                    )
                                  ) : (
                                    <span>Selecione a data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    const currentTime = field.value || new Date()
                                    const newDate = new Date(date)
                                    newDate.setHours(currentTime.getHours())
                                    newDate.setMinutes(currentTime.getMinutes())
                                    field.onChange(newDate)
                                  }
                                }}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                              />
                              {!form.watch("is_all_day") && (
                                <div className="p-3 border-t">
                                  <Label>Horário</Label>
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      if (field.value && e.target.value) {
                                        const [hours, minutes] = e.target.value.split(":")
                                        const newDate = new Date(field.value)
                                        newDate.setHours(parseInt(hours), parseInt(minutes))
                                        field.onChange(newDate)
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local</FormLabel>
                        <FormControl>
                          <Input placeholder="Adicione um local (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrence"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recorrência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a recorrência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RECURRENCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}
          </ScrollArea>

          {mode !== "view" && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : mode === "create" ? "Criar Evento" : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}