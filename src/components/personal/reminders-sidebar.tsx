"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { cn } from "@/lib/utils"
import { Bell, Calendar, Clock, CheckCircle, AlertTriangle, Plus } from "lucide-react"

interface ReminderEvent {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: "confirmed" | "tentative" | "cancelled"
  priority: "low" | "medium" | "high"
  is_all_day?: boolean
  event_type: "reminder"
  created_at?: string
  updated_at?: string
}

interface RemindersSidebarProps {
  className?: string
  onAdd?: () => void
}

export function RemindersSidebar({ className, onAdd }: RemindersSidebarProps) {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<ReminderEvent[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const lastErrorAtRef = useRef(0)

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      setReminders([])
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const now = new Date()
      const startIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const endIso = new Date(weekFromNow.getFullYear(), weekFromNow.getMonth(), weekFromNow.getDate(), 23, 59, 59, 999).toISOString()

      const url = new URL(`/api/personal/reminders`, window.location.origin)
      url.searchParams.set("user_id", user.id)
      url.searchParams.set("start_date", startIso)
      url.searchParams.set("end_date", endIso)
      url.searchParams.set("limit", "50")

      const res = await fetch(url.toString(), { signal: controller.signal })
      if (!res.ok) {
        throw new Error("Falha ao buscar lembretes")
      }
      const data = await res.json()
      const list = (data?.reminders || []) as ReminderEvent[]
      setReminders(list)
    } catch (error) {
      if (controller.signal.aborted) return
      const now = Date.now()
      if (now - lastErrorAtRef.current > 8000) {
        lastErrorAtRef.current = now
        toast({
          title: "Erro",
          description: "Não foi possível carregar os lembretes.",
          variant: "destructive",
        })
      }
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }, [user?.id, toast])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const handler = () => {
      refetch()
    }
    window.addEventListener("reminders:changed", handler)
    return () => {
      window.removeEventListener("reminders:changed", handler)
    }
  }, [refetch])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const isSameDay = (iso: string) => {
      const d = new Date(iso)
      return d.toDateString() === now.toDateString()
    }
    const isOverdue = (iso: string) => new Date(iso) < now
    const isPending = (status: ReminderEvent["status"]) => status !== "cancelled"

    const todayCount = reminders.filter(r => isPending(r.status) && isSameDay(r.start_time)).length
    const upcomingCount = reminders.filter(r => isPending(r.status) && new Date(r.start_time) > now).length
    const overdueCount = reminders.filter(r => isPending(r.status) && isOverdue(r.start_time)).length

    return { todayCount, upcomingCount, overdueCount }
  }, [reminders])

  const nextReminders = useMemo(() => {
    const now = new Date()
    return reminders
      .filter(r => r.status !== "cancelled" && new Date(r.start_time) >= new Date(now.setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 6)
  }, [reminders])

  const markDone = async (reminder: ReminderEvent) => {
    try {
      const res = await fetch(`/api/personal/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminder.id, user_id: reminder.user_id, status: "cancelled" }),
      })
      if (!res.ok) {
        throw new Error("Falha ao atualizar lembrete")
      }
      setReminders(prev => prev.map(r => (r.id === reminder.id ? { ...r, status: "cancelled" } : r)))
      toast({ title: "Lembrete concluído", description: "O lembrete foi marcado como concluído." })
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível marcar o lembrete como concluído.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Hoje</span>
                    <Calendar className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-blue-600">{stats.todayCount}</div>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Próximos</span>
                    <Clock className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-lg font-bold text-green-600">{stats.upcomingCount}</div>
                </Card>
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Atrasados</span>
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="text-lg font-bold text-red-600">{stats.overdueCount}</div>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Próximos lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : nextReminders.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Sem lembretes agendados para os próximos dias</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {nextReminders.map(r => {
                const dt = new Date(r.start_time)
                const dateStr = dt.toLocaleDateString("pt-BR")
                const timeStr = r.is_all_day ? "Dia todo" : dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                const variant = r.priority === "high" ? "destructive" : r.priority === "low" ? "secondary" : "outline"
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{r.title}</span>
                          <Badge variant={variant} className="text-[10px]">{r.priority}</Badge>
                          {r.status === "cancelled" && (
                            <Badge variant="secondary" className="text-[10px]">
                              Concluído
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.status !== "cancelled" ? (
                        <Button variant="ghost" size="sm" onClick={() => markDone(r)}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Feito</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
