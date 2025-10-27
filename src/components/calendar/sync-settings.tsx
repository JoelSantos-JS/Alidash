"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  RefreshCw, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar,
  Zap,
  Globe,
  ArrowLeftRight
} from "lucide-react"
import { toast } from "sonner"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useSyncSettings } from "@/hooks/useSyncSettings"
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar"

interface SyncSettings {
  autoSync: boolean
  syncInterval: number // em minutos
  bidirectionalSync: boolean
  syncOnStartup: boolean
  syncOnEventCreate: boolean
  syncOnEventUpdate: boolean
  syncOnEventDelete: boolean
  lastSync: string | null
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  syncErrors: string[]
}

interface SyncSettingsProps {
  isConnected: boolean
  onSync?: () => Promise<void>
  className?: string
}

export function SyncSettings({ isConnected, onSync, className }: SyncSettingsProps) {
  const { user } = useSupabaseAuth()
  const { 
    settings, 
    loading, 
    error,
    updateSettings,
    updateSyncStatus
  } = useSyncSettings()
  const { syncEvents } = useGoogleCalendar()
  const [isSyncing, setIsSyncing] = useState(false)

  // Auto sync timer
  useEffect(() => {
    if (!settings?.autoSync || !isConnected) return

    const interval = setInterval(async () => {
      if (settings.syncStatus !== 'syncing') {
        await handleAutoSync()
      }
    }, settings.syncInterval * 60 * 1000) // Converter minutos para ms

    return () => clearInterval(interval)
  }, [settings?.autoSync, settings?.syncInterval, isConnected, settings?.syncStatus])

  const handleAutoSync = async () => {
    if (!onSync || isSyncing || !settings) return

    try {
      setIsSyncing(true)
      await updateSyncStatus('syncing')
      
      await onSync()
      
      await updateSyncStatus('success', new Date().toISOString(), [])
    } catch (error) {
      console.error('Erro na sincronização automática:', error)
      await updateSyncStatus('error', undefined, [error instanceof Error ? error.message : 'Erro desconhecido'])
    } finally {
      setIsSyncing(false)
    }
  }

  const handleManualSync = async () => {
    if (!settings) return

    try {
      setIsSyncing(true)
      await updateSyncStatus('syncing')
      
      if (onSync) {
        await onSync()
      } else {
        await syncEvents()
      }
      
      await updateSyncStatus('success', new Date().toISOString(), [])
      toast.success('Sincronização concluída')
    } catch (error) {
      console.error('Erro na sincronização manual:', error)
      await updateSyncStatus('error', undefined, [error instanceof Error ? error.message : 'Erro desconhecido'])
      toast.error('Erro na sincronização')
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusIcon = () => {
    if (!settings) return <Clock className="h-4 w-4 text-muted-foreground" />
    
    switch (settings.syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSyncStatusText = () => {
    if (!settings) return 'Carregando...'
    
    switch (settings.syncStatus) {
      case 'syncing':
        return 'Sincronizando...'
      case 'success':
        return 'Sincronizado'
      case 'error':
        return 'Erro na sincronização'
      default:
        return 'Aguardando'
    }
  }

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Nunca'
    
    const date = new Date(lastSync)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Sincronização Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !settings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Sincronização Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700">
                {error || 'Erro ao carregar configurações'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Sincronização Automática
          </CardTitle>
          <CardDescription>
            Conecte o Google Calendar para habilitar a sincronização automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Globe className="h-8 w-8 mr-3" />
            <span>Google Calendar não conectado</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Sincronização Automática
        </CardTitle>
        <CardDescription>
          Configure como seus eventos são sincronizados com o Google Calendar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status da Sincronização */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getSyncStatusIcon()}
            <div>
              <p className="font-medium">{getSyncStatusText()}</p>
              <p className="text-sm text-muted-foreground">
                Última sincronização: {formatLastSync(settings?.lastSync || null)}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </Button>
        </div>

        {/* Erros de Sincronização */}
        {settings?.syncErrors && settings.syncErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700">Erros de Sincronização</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {settings.syncErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Configurações Gerais */}
        <div className="space-y-4">
          <h4 className="font-medium">Configurações Gerais</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar eventos automaticamente em intervalos regulares
              </p>
            </div>
            <Switch
              checked={settings?.autoSync || false}
              onCheckedChange={(checked) => updateSettings({ autoSync: checked })}
              disabled={loading}
            />
          </div>

          {settings?.autoSync && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Intervalo de Sincronização</Label>
                <p className="text-sm text-muted-foreground">
                  Frequência da sincronização automática
                </p>
              </div>
              <Select
                value={settings.syncInterval.toString()}
                onValueChange={(value) => updateSettings({ syncInterval: parseInt(value) })}
                disabled={loading}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização Bidirecional</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar mudanças em ambas as direções
              </p>
            </div>
            <Switch
              checked={settings?.bidirectionalSync || false}
              onCheckedChange={(checked) => updateSettings({ bidirectionalSync: checked })}
              disabled={loading}
            />
          </div>
        </div>

        <Separator />

        {/* Triggers de Sincronização */}
        <div className="space-y-4">
          <h4 className="font-medium">Triggers de Sincronização</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronizar ao Iniciar</Label>
              <p className="text-sm text-muted-foreground">
                Executar sincronização quando abrir a aplicação
              </p>
            </div>
            <Switch
              checked={settings?.syncOnStartup || false}
              onCheckedChange={(checked) => updateSettings({ syncOnStartup: checked })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronizar ao Criar Evento</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar automaticamente quando criar um evento
              </p>
            </div>
            <Switch
              checked={settings?.syncOnEventCreate || false}
              onCheckedChange={(checked) => updateSettings({ syncOnEventCreate: checked })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronizar ao Editar Evento</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar automaticamente quando editar um evento
              </p>
            </div>
            <Switch
              checked={settings?.syncOnEventUpdate || false}
              onCheckedChange={(checked) => updateSettings({ syncOnEventUpdate: checked })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronizar ao Deletar Evento</Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar automaticamente quando deletar um evento
              </p>
            </div>
            <Switch
              checked={settings?.syncOnEventDelete || false}
              onCheckedChange={(checked) => updateSettings({ syncOnEventDelete: checked })}
              disabled={loading}
            />
          </div>
        </div>

        <Separator />

        {/* Informações Adicionais */}
        <div className="space-y-3">
          <h4 className="font-medium">Recursos da Sincronização</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="w-fit">
                <Zap className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
              <span className="text-muted-foreground">Sincronização instantânea</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="w-fit">
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Bidirecional
              </Badge>
              <span className="text-muted-foreground">Ambas as direções</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="w-fit">
                <Calendar className="h-3 w-3 mr-1" />
                Múltiplos Calendários
              </Badge>
              <span className="text-muted-foreground">Suporte completo</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="w-fit">
                <CheckCircle className="h-3 w-3 mr-1" />
                Detecção de Conflitos
              </Badge>
              <span className="text-muted-foreground">Resolução automática</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}