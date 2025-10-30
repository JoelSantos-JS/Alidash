'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-supabase-auth'
import { useDualSync } from '@/lib/dual-database-sync'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product } from '@/types'

interface SyncStatus {
  isLoading: boolean
  lastResult: any
  products: Product[]
}

export function ProductsSyncExample() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastResult: null,
    products: []
  })

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    supplier: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: ''
  })

  const { createProduct, updateProduct, deleteProduct, getProducts } = useDualSync(user?.id || '')

  const handleCreateProduct = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      })
      return
    }

    setSyncStatus(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await createProduct({
        name: productForm.name,
        category: productForm.category,
        supplier: productForm.supplier,
        aliexpressLink: '',
        imageUrl: '',
        description: productForm.description,
        purchasePrice: productForm.purchasePrice,
        shippingCost: 0,
        importTaxes: 0,
        packagingCost: 0,
        marketingCost: 0,
        otherCosts: 0,
        totalCost: productForm.purchasePrice,
        sellingPrice: productForm.sellingPrice,
        expectedProfit: productForm.sellingPrice - productForm.purchasePrice,
        profitMargin: ((productForm.sellingPrice - productForm.purchasePrice) / productForm.purchasePrice) * 100,
        quantity: 1,
        quantitySold: 0,
        status: 'purchased',
        purchaseDate: new Date(),
        roi: 0,
        actualProfit: 0,
        sales: []
      })

      setSyncStatus(prev => ({ ...prev, lastResult: result, isLoading: false }))

      if (result.success) {
        toast({
          title: 'Produto Criado!',
          description: `Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        })
        
        // Limpar formulário
        setProductForm({
          name: '',
          category: '',
          supplier: '',
          purchasePrice: 0,
          sellingPrice: 0,
          description: ''
        })

        // Recarregar produtos
        await loadProducts()
      } else {
        toast({
          title: 'Erro ao Criar Produto',
          description: result.errors.join(', '),
          variant: 'destructive'
        })
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isLoading: false }))
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar produto',
        variant: 'destructive'
      })
    }
  }

  const loadProducts = async () => {
    if (!user) return

    try {
      const products = await getProducts()
      setSyncStatus(prev => ({ ...prev, products }))
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleUpdateProduct = async (productId: string) => {
    if (!user) return

    try {
      const result = await updateProduct(productId, {
        sellingPrice: 250,
        status: 'selling'
      })

      if (result.success) {
        toast({
          title: 'Produto Atualizado!',
          description: `Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        })
        await loadProducts()
      } else {
        toast({
          title: 'Erro ao Atualizar Produto',
          description: result.errors.join(', '),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar produto',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!user) return

    try {
      const result = await deleteProduct(productId)

      if (result.success) {
        toast({
          title: 'Produto Deletado!',
          description: `Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        })
        await loadProducts()
      } else {
        toast({
          title: 'Erro ao Deletar Produto',
          description: result.errors.join(', '),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao deletar produto',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sincronização Dual de Produtos</CardTitle>
          <CardDescription>
            Teste a sincronização de produtos entre Firebase e Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                  <SelectItem value="roupas">Roupas</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={productForm.supplier}
                onChange={(e) => setProductForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Preço de Compra</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={productForm.purchasePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="sellingPrice">Preço de Venda</Label>
              <Input
                id="sellingPrice"
                type="number"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do produto"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCreateProduct} 
              disabled={syncStatus.isLoading || !productForm.name}
            >
              {syncStatus.isLoading ? 'Criando...' : 'Criar Produto'}
            </Button>
            <Button onClick={loadProducts} variant="outline">
              Carregar Produtos
            </Button>
          </div>

          {syncStatus.lastResult && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Último Resultado:</h4>
              <div className="text-sm space-y-1">
                <div>Supabase: {syncStatus.lastResult.supabaseSuccess ? '✅' : '❌'}</div>
                <div>Supabase: {syncStatus.lastResult.supabaseSuccess ? '✅' : '❌'}</div>
                {syncStatus.lastResult.errors.length > 0 && (
                  <div className="text-red-600">
                    Erros: {syncStatus.lastResult.errors.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {syncStatus.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({syncStatus.products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncStatus.products.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="text-sm">Compra: R$ {product.purchasePrice} | Venda: R$ {product.sellingPrice}</p>
                      <p className="text-sm">Status: {product.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateProduct(product.id)}
                      >
                        Atualizar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}