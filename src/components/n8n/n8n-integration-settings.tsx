"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Settings, 
  Key, 
  Webhook, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react'
import { N8N_PERMISSIONS } from '@/lib/n8n-auth'

interface ApiKey {
  id: string
  permissions: string[]
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  lastUsed?: Date
  description?: string
  apiKeyPreview: string
}

interface WebhookConfig {
  id: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  headers?: Record<string, string>
  createdAt: Date
  lastTriggered?: Date
}

const AVAILABLE_EVENTS = [
  { value: 'product.created', label: 'Produto Criado' },
  { value: 'product.updated', label: 'Produto Atualizado' },
  { value: 'product.sold', label: 'Produto Vendido' },
  { value: 'goal.created', label: 'Meta Criada' },
  { value: 'goal.completed', label: 'Meta Concluída' },
  { value: 'transaction.created', label: 'Transação Criada' },
  { value: 'dream.created', label: 'Sonho Criado' },
  { value: 'bet.placed', label: 'Aposta Realizada' },
  { value: 'bet.won', label: 'Aposta Ganha' }
]

const PERMISSION_LABELS = {
  [N8N_PERMISSIONS.PRODUCTS_READ]: 'Ler Produtos',
  [N8N_PERMISSIONS.PRODUCTS_WRITE]: 'Escrever Produtos',
  [N8N_PERMISSIONS.GOALS_READ]: 'Ler Metas',
  [N8N_PERMISSIONS.GOALS_WRITE]: 'Escrever Metas',
  [N8N_PERMISSIONS.TRANSACTIONS_READ]: 'Ler Transações',
  [N8N_PERMISSIONS.TRANSACTIONS_WRITE]: 'Escrever Transações',
  [N8N_PERMISSIONS.ANALYTICS_READ]: 'Ler Analytics',
  [N8N_PERMISSIONS.WEBHOOKS_MANAGE]: 'Gerenciar Webhooks',
  [N8N_PERMISSIONS.ADMIN]: 'Administrador'
}

export function N8NIntegrationSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewApiKeyDialog, setShowNewApiKeyDialog] = useState(false)
  const [showNewWebhookDialog, setShowNewWebhookDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // Estados para formulários
  const [newApiKeyForm, setNewApiKeyForm] = useState({
    description: '',
    permissions: [] as string[],
    expiresInDays: 365
  })

  const [newWebhookForm, setNewWebhookForm] = useState({
    url: '',
    events: [] as string[],
    secret: '',
    headers: '{}'
  })

  useEffect(() => {
    if (user) {
      loadApiKeys()
      loadWebhooks()
    }
  }, [user])

  const loadApiKeys = async () => {
    try {
      const response = await fetch(`/api/n8n/auth?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Erro ao carregar API keys:', error)
    }
  }

  const loadWebhooks = async () => {
    try {
      const response = await fetch(`/api/n8n/webhooks?action=list`, {
        headers: {
          'x-api-key': 'temp-key' // Implementar autenticação adequada
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createApiKey = async () => {
    try {
      const response = await fetch('/api/n8n/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          ...newApiKeyForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        setNewApiKey(data.apiKey)
        setShowNewApiKeyDialog(false)
        setNewApiKeyForm({ description: '', permissions: [], expiresInDays: 365 })
        await loadApiKeys()
        
        toast({
          title: 'API Key criada',
          description: 'Sua nova API key foi criada com sucesso. Copie-a agora, pois não será mostrada novamente.'
        })
      } else {
        throw new Error('Erro ao criar API key')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a API key.',
        variant: 'destructive'
      })
    }
  }

  const revokeApiKey = async (apiKey: string) => {
    try {
      const response = await fetch('/api/n8n/auth', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          userId: user?.id
        })
      })

      if (response.ok) {
        await loadApiKeys()
        toast({
          title: 'API Key revogada',
          description: 'A API key foi revogada com sucesso.'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar a API key.',
        variant: 'destructive'
      })
    }
  }

  const createWebhook = async () => {
    try {
      let headers = {}
      try {
        headers = JSON.parse(newWebhookForm.headers)
      } catch {
        toast({
          title: 'Erro',
          description: 'Headers deve ser um JSON válido.',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/n8n/webhooks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'temp-key' // Implementar autenticação adequada
        },
        body: JSON.stringify({
          ...newWebhookForm,
          headers
        })
      })

      if (response.ok) {
        setShowNewWebhookDialog(false)
        setNewWebhookForm({ url: '', events: [], secret: '', headers: '{}' })
        await loadWebhooks()
        
        toast({
          title: 'Webhook configurado',
          description: 'Seu webhook foi configurado com sucesso.'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível configurar o webhook.',
        variant: 'destructive'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado',
      description: 'Texto copiado para a área de transferência.'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integração N8N
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Integração N8N
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure a integração com N8N para automatizar seus fluxos de trabalho
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">API Keys</h3>
              <Dialog open={showNewApiKeyDialog} onOpenChange={setShowNewApiKeyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova API Key</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={newApiKeyForm.description}
                        onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ex: Integração N8N Principal"
                      />
                    </div>
                    
                    <div>
                      <Label>Permissões</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Switch
                              checked={newApiKeyForm.permissions.includes(permission)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewApiKeyForm(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission]
                                  }))
                                } else {
                                  setNewApiKeyForm(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission)
                                  }))
                                }
                              }}
                            />
                            <Label className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="expires">Expira em (dias)</Label>
                      <Input
                        id="expires"
                        type="number"
                        value={newApiKeyForm.expiresInDays}
                        onChange={(e) => setNewApiKeyForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <Button onClick={createApiKey} className="w-full">
                      Criar API Key
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {newApiKey && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Nova API Key criada!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Copie esta API key agora. Ela não será mostrada novamente.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newApiKey}
                      readOnly
                      className="font-mono text-sm"
                      type={showApiKey ? 'text' : 'password'}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewApiKey('')}
                    className="mt-2"
                  >
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma API key configurada</p>
                  <p className="text-sm">Crie uma API key para começar a usar a integração N8N</p>
                </div>
              ) : (
                apiKeys.map((apiKey) => (
                  <Card key={apiKey.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{apiKey.description || 'API Key'}</span>
                            {apiKey.isActive ? (
                              <Badge variant="default">Ativa</Badge>
                            ) : (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {apiKey.apiKeyPreview}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {apiKey.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS] || permission}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Criada em {new Date(apiKey.createdAt).toLocaleDateString()}
                            {apiKey.lastUsed && (
                              <span> • Último uso: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Webhooks</h3>
              <Dialog open={showNewWebhookDialog} onOpenChange={setShowNewWebhookDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Configurar Novo Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhook-url">URL do Webhook</Label>
                      <Input
                        id="webhook-url"
                        value={newWebhookForm.url}
                        onChange={(e) => setNewWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://seu-n8n.com/webhook/voxcash"
                      />
                    </div>
                    
                    <div>
                      <Label>Eventos</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {AVAILABLE_EVENTS.map((event) => (
                          <div key={event.value} className="flex items-center space-x-2">
                            <Switch
                              checked={newWebhookForm.events.includes(event.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewWebhookForm(prev => ({
                                    ...prev,
                                    events: [...prev.events, event.value]
                                  }))
                                } else {
                                  setNewWebhookForm(prev => ({
                                    ...prev,
                                    events: prev.events.filter(e => e !== event.value)
                                  }))
                                }
                              }}
                            />
                            <Label className="text-sm">{event.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="webhook-secret">Secret (opcional)</Label>
                      <Input
                        id="webhook-secret"
                        value={newWebhookForm.secret}
                        onChange={(e) => setNewWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                        placeholder="Chave secreta para validação"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="webhook-headers">Headers Customizados (JSON)</Label>
                      <Textarea
                        id="webhook-headers"
                        value={newWebhookForm.headers}
                        onChange={(e) => setNewWebhookForm(prev => ({ ...prev, headers: e.target.value }))}
                        placeholder='{"Authorization": "Bearer token"}'
                        rows={3}
                      />
                    </div>
                    
                    <Button onClick={createWebhook} className="w-full">
                      Configurar Webhook
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum webhook configurado</p>
                  <p className="text-sm">Configure webhooks para receber eventos em tempo real</p>
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            <span className="font-medium font-mono text-sm">{webhook.url}</span>
                            {webhook.isActive ? (
                              <Badge variant="default">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Criado em {new Date(webhook.createdAt).toLocaleDateString()}
                          {webhook.lastTriggered && (
                            <span> • Último trigger: {new Date(webhook.lastTriggered).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📚 Documentação da API</h4>
          <p className="text-sm text-blue-800 mb-3">
            Use estas URLs base para suas integrações N8N:
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-700">GET/POST</span>
              <code className="bg-blue-100 px-2 py-1 rounded">/api/n8n/products</code>
              <span className="text-blue-600">- Gerenciar produtos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700">GET</span>
              <code className="bg-blue-100 px-2 py-1 rounded">/api/n8n/analytics</code>
              <span className="text-blue-600">- Obter analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-700">POST</span>
              <code className="bg-blue-100 px-2 py-1 rounded">/api/n8n/webhooks</code>
              <span className="text-blue-600">- Receber eventos</span>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-3">
            💡 Inclua sua API key no header: <code>x-api-key: sua_api_key</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
