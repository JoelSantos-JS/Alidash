"use client"

import { useState } from 'react'
import { useDualSync, DualSyncPresets, type DualSyncResult } from '@/lib/dual-database-sync'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SyncStatus {
  isLoading: boolean
  lastResult: DualSyncResult | null
  syncMode: keyof typeof DualSyncPresets
}

export function DualSyncExample() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastResult: null,
    syncMode: 'BEST_EFFORT'
  })

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    purchasePrice: 0,
    sellingPrice: 0,
    description: ''
  })

  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: 0,
    type: 'expense' as 'revenue' | 'expense',
    category: '',
    paymentMethod: 'pix' as any
  })

  // Hook de sincronização dual
  const dualSync = useDualSync(user?.firebase_uid || '', syncStatus.syncMode)

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
      const result = await dualSync.createProduct({
        name: productForm.name,
        category: productForm.category,
        purchasePrice: productForm.purchasePrice,
        sellingPrice: productForm.sellingPrice,
        description: productForm.description,
        status: 'purchased',
        quantity: 1,
        quantitySold: 0,
        purchaseDate: new Date()
      })

      setSyncStatus(prev => ({ ...prev, lastResult: result, isLoading: false }))

      if (result.success) {
        toast({
          title: 'Produto Criado!',
          description: `Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        })
        
        // Limpar formulário
        setProductForm({
          name: '',
          category: '',
          purchasePrice: 0,
          sellingPrice: 0,
          description: ''
        })
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

  const handleCreateTransaction = async () => {
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
      const result = await dualSync.createTransaction({
        description: transactionForm.description,
        amount: transactionForm.amount,
        type: transactionForm.type,
        category: transactionForm.category,
        paymentMethod: transactionForm.paymentMethod,
        status: 'completed',
        date: new Date()
      })

      setSyncStatus(prev => ({ ...prev, lastResult: result, isLoading: false }))

      if (result.success) {
        toast({
          title: 'Transação Criada!',
          description: `Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        })
        
        // Limpar formulário
        setTransactionForm({
          description: '',
          amount: 0,
          type: 'expense',
          category: '',
          paymentMethod: 'pix'
        })
      } else {
        toast({
          title: 'Erro ao Criar Transação',
          description: result.errors.join(', '),
          variant: 'destructive'
        })
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isLoading: false }))
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar transação',
        variant: 'destructive'
      })
    }
  }

  const getSyncModeDescription = (mode: keyof typeof DualSyncPresets) => {
    switch (mode) {
      case 'FIREBASE_PRIORITY':
        return 'Prioriza Firebase - falha se Firebase falhar'
      case 'SUPABASE_PRIORITY':
        return 'Prioriza Supabase - falha se Supabase falhar'
      case 'BEST_EFFORT':
        return 'Melhor esforço - mantém dados onde conseguir gravar'
      case 'STRICT_DUAL':
        return 'Dual estrito - exige sucesso em ambos os bancos'
      default:
        return 'Modo desconhecido'
    }
  }

  const renderSyncResult = (result: DualSyncResult) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">
            {result.success ? 'Sincronização Bem-sucedida' : 'Falha na Sincronização'}
          </span>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span className="text-xs">Firebase:</span>
            <Badge variant={result.firebaseSuccess ? 'default' : 'destructive'} className="text-xs">
              {result.firebaseSuccess ? 'OK' : 'ERRO'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            <span className="text-xs">Supabase:</span>
            <Badge variant={result.supabaseSuccess ? 'default' : 'destructive'} className="text-xs">
              {result.supabaseSuccess ? 'OK' : 'ERRO'}
            </Badge>
          </div>
        </div>
        
        {result.errors.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-xs">
                <strong>Erros:</strong>
                <ul className="mt-1 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Faça login para testar a sincronização dual.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configurações de Sincronização Dual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sync-mode">Modo de Sincronização</Label>
            <Select
              value={syncStatus.syncMode}
              onValueChange={(value: keyof typeof DualSyncPresets) => 
                setSyncStatus(prev => ({ ...prev, syncMode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEST_EFFORT">Melhor Esforço</SelectItem>
                <SelectItem value="FIREBASE_PRIORITY">Prioridade Firebase</SelectItem>
                <SelectItem value="SUPABASE_PRIORITY">Prioridade Supabase</SelectItem>
                <SelectItem value="STRICT_DUAL">Dual Estrito</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getSyncModeDescription(syncStatus.syncMode)}
            </p>
          </div>

          {/* Status da Última Sincronização */}
          {syncStatus.lastResult && (
            <div className="space-y-2">
              <Label>Última Sincronização</Label>
              {renderSyncResult(syncStatus.lastResult)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Produto (Dual Sync)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome do Produto</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: iPhone 15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-category">Categoria</Label>
              <Input
                id="product-category"
                value={productForm.category}
                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Eletrônicos"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Preço de Compra</Label>
              <Input
                id="purchase-price"
                type="number"
                step="0.01"
                value={productForm.purchasePrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selling-price">Preço de Venda</Label>
              <Input
                id="selling-price"
                type="number"
                step="0.01"
                value={productForm.sellingPrice}
                onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do produto..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handleCreateProduct} 
            disabled={syncStatus.isLoading || !productForm.name}
            className="w-full"
          >
            {syncStatus.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Criar Produto (Dual Sync)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Formulário de Transação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Transação (Dual Sync)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-description">Descrição</Label>
              <Input
                id="transaction-description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Compra de material"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Valor</Label>
              <Input
                id="transaction-amount"
                type="number"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Tipo</Label>
              <Select
                value={transactionForm.type}
                onValueChange={(value: 'revenue' | 'expense') => 
                  setTransactionForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-category">Categoria</Label>
              <Input
                id="transaction-category"
                value={transactionForm.category}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Compras"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select
                value={transactionForm.paymentMethod}
                onValueChange={(value) => 
                  setTransactionForm(prev => ({ ...prev, paymentMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCreateTransaction} 
            disabled={syncStatus.isLoading || !transactionForm.description}
            className="w-full"
          >
            {syncStatus.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Criar Transação (Dual Sync)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}