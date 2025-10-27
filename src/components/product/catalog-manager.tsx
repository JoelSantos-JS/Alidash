'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-supabase-auth'
import type { Product } from '@/types'
import { 
  Share2, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink, 
  Globe, 
  Settings,
  RefreshCw,
  Users,
  BarChart3,
  Calendar,
  Link as LinkIcon,
  Package
} from 'lucide-react'

interface CatalogManagerProps {
  products: Product[]
  onProductUpdate: (productId: string, isPublic: boolean) => void
}

interface CatalogToken {
  token: string
  catalogUrl: string
  isActive: boolean
  accessCount: number
  lastAccessed: string | null
  createdAt: string
}

export function CatalogManager({ products, onProductUpdate }: CatalogManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [catalogToken, setCatalogToken] = useState<CatalogToken | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCatalogToken()
    }
  }, [isOpen, user?.id])

  const fetchCatalogToken = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/catalog/token?user_id=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          setCatalogToken({
            token: data.token,
            catalogUrl: data.catalogUrl,
            isActive: data.isActive,
            accessCount: data.accessCount || 0,
            lastAccessed: data.lastAccessed,
            createdAt: data.createdAt
          })
        } else {
          setCatalogToken(null)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar token:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do catálogo",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateCatalogToken = async () => {
    if (!user?.id) return

    try {
      setIsGenerating(true)
      const response = await fetch('/api/catalog/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        const data = await response.json()
        setCatalogToken({
          token: data.token,
          catalogUrl: data.catalogUrl,
          isActive: true,
          accessCount: 0,
          lastAccessed: null,
          createdAt: new Date().toISOString()
        })
        
        toast({
          title: "Sucesso!",
          description: "Link do catálogo gerado com sucesso!"
        })
      } else {
        throw new Error('Erro ao gerar token')
      }
    } catch (error) {
      console.error('Erro ao gerar token:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerar link do catálogo",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const deactivateCatalog = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/catalog/token?user_id=${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCatalogToken(null)
        toast({
          title: "Catálogo desativado",
          description: "O link público foi desativado com sucesso"
        })
      }
    } catch (error) {
      console.error('Erro ao desativar catálogo:', error)
      toast({
        title: "Erro",
        description: "Erro ao desativar catálogo",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência"
      })
    } catch (error) {
      console.error('Erro ao copiar:', error)
      toast({
        title: "Erro",
        description: "Erro ao copiar link",
        variant: "destructive"
      })
    }
  }

  const toggleProductVisibility = async (productId: string, currentIsPublic: boolean) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/products/toggle-public?user_id=${user.id}&product_id=${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublic: !currentIsPublic })
      })

      if (response.ok) {
        onProductUpdate(productId, !currentIsPublic)
        toast({
          title: "Sucesso!",
          description: `Produto ${!currentIsPublic ? 'adicionado ao' : 'removido do'} catálogo público`
        })
      } else {
        throw new Error('Erro ao atualizar produto')
      }
    } catch (error) {
      console.error('Erro ao atualizar visibilidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade do produto",
        variant: "destructive"
      })
    }
  }

  const publicProducts = products.filter(p => p.isPublic)
  const availableProducts = products.filter(p => p.status === 'received' || p.status === 'selling')

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Catálogo Público
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Gerenciar Catálogo Público
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Link do Catálogo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LinkIcon className="h-5 w-5" />
                  Link do Catálogo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : catalogToken ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Input
                        value={catalogToken.catalogUrl}
                        readOnly
                        className="flex-1 bg-background"
                      />
                      <Button
                        onClick={() => copyToClipboard(catalogToken.catalogUrl)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(catalogToken.catalogUrl, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 rounded-lg shadow-sm">
                        <Users className="h-8 w-8 text-blue-700" />
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Visualizações</p>
                          <p className="text-2xl font-bold text-blue-900">{catalogToken.accessCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded-lg shadow-sm">
                        <Eye className="h-8 w-8 text-green-700" />
                        <div>
                          <p className="text-sm text-green-700 font-medium">Produtos Públicos</p>
                          <p className="text-2xl font-bold text-green-900">{publicProducts.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300 rounded-lg shadow-sm">
                        <Calendar className="h-8 w-8 text-purple-700" />
                        <div>
                          <p className="text-sm text-purple-700 font-medium">Último Acesso</p>
                          <p className="text-sm font-bold text-purple-900">
                            {catalogToken.lastAccessed 
                              ? new Date(catalogToken.lastAccessed).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={generateCatalogToken}
                        variant="outline"
                        size="sm"
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                        Gerar Novo Link
                      </Button>
                      <Button
                        onClick={deactivateCatalog}
                        variant="destructive"
                        size="sm"
                      >
                        Desativar Catálogo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum catálogo ativo</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie um link público para compartilhar seus produtos com clientes
                    </p>
                    <Button
                      onClick={generateCatalogToken}
                      disabled={isGenerating}
                    >
                      <Share2 className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      {isGenerating ? 'Gerando...' : 'Criar Catálogo Público'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Gerenciar Produtos ({availableProducts.length} disponíveis)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum produto disponível para o catálogo público</p>
                    <p className="text-sm">Apenas produtos "Recebidos" ou "À venda" podem ser exibidos</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{product.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>R$ {product.sellingPrice.toFixed(2)}</span>
                            <span>{product.quantity} unid.</span>
                            <Badge 
                              variant={product.status === 'selling' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {product.status === 'selling' ? 'À venda' : 'Recebido'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`public-${product.id}`} className="text-sm">
                            {product.isPublic ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Label>
                          <Switch
                            id={`public-${product.id}`}
                            checked={product.isPublic || false}
                            onCheckedChange={() => toggleProductVisibility(product.id, product.isPublic || false)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}