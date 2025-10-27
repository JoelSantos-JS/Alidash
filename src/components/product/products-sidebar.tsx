"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Filter,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Layers,
  Truck,
  Archive,
  Menu,
  X,
  Calculator,
  ImageIcon,
  ClipboardList
} from "lucide-react"
import { exportProductsToCSV, exportProductsToJSON } from "@/lib/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Product } from "@/types"
import { cn } from "@/lib/utils"

type ProductsSidebarProps = {
  products: Product[]
  searchQuery: string
  categoryFilter: string
  statusFilter: string
  supplierFilter: string
  onSearchChange: (query: string) => void
  onCategoryFilterChange: (category: string) => void
  onStatusFilterChange: (status: string) => void
  onSupplierFilterChange: (supplier: string) => void
  onAddProduct?: () => void
  onRefresh?: () => void
  onExport?: () => void
  onImport?: () => void
  isLoading?: boolean
  className?: string
  isMobile?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status', icon: Package },
  { value: 'purchased', label: 'Comprado', icon: ShoppingCart, color: 'text-blue-600' },
  { value: 'shipping', label: 'Em Trânsito', icon: Truck, color: 'text-yellow-600' },
  { value: 'received', label: 'Recebido', icon: CheckCircle2, color: 'text-indigo-600' },
  { value: 'selling', label: 'À Venda', icon: TrendingUp, color: 'text-green-600' },
  { value: 'sold', label: 'Vendido', icon: Archive, color: 'text-gray-600' }
]

export function ProductsSidebar({
  products,
  searchQuery,
  categoryFilter,
  statusFilter,
  supplierFilter,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSupplierFilterChange,
  onAddProduct,
  onRefresh,
  onExport,
  onImport,
  isLoading = false,
  className,
  isMobile = false,
  isOpen = false,
  onToggle
}: ProductsSidebarProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalProducts = products.length
    
    // Calcular produtos ativos (com estoque disponível)
    const activeProducts = products.filter(p => {
      const availableStock = p.quantity - p.quantitySold
      return availableStock > 0 && (p.status === 'selling' || p.status === 'received')
    }).length
    
    // Calcular total de unidades vendidas (não produtos vendidos)
    const soldProducts = products.reduce((sum, product) => sum + product.quantitySold, 0)
    
    // Produtos com estoque baixo (menos de 5 unidades disponíveis)
    const lowStockCount = products.filter(p => {
      const availableStock = p.quantity - p.quantitySold
      return availableStock < 5 && availableStock > 0
    }).length
    
    // Calcular lucro total real baseado nas vendas efetivas
    const totalProfit = products.reduce((sum, product) => {
      return sum + (product.actualProfit || 0)
    }, 0)

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))]

    return {
      totalProducts,
      activeProducts,
      soldProducts,
      lowStockCount,
      totalProfit,
      categories,
      suppliers
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      const matchesSupplier = supplierFilter === 'all' || product.supplier === supplierFilter
      
      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier
    })
  }, [products, searchQuery, categoryFilter, statusFilter, supplierFilter])

  const handleExportCSV = () => {
    exportProductsToCSV(filteredProducts)
  }

  const handleExportJSON = () => {
    exportProductsToJSON(filteredProducts)
  }

  // Mobile Sidebar Content
  const mobileSidebarContent = (
    <div className="h-full flex flex-col max-h-screen overflow-hidden">
      {/* Mobile Header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Produtos</h2>
          <Badge variant="secondary">{analytics.totalProducts}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Content - Área Scrollável */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="product" className="h-full flex flex-col">
          <div className="px-4 pt-2 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-6 h-9">
              <TabsTrigger value="product" className="text-xs px-1">
                <Package className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="stock" className="text-xs px-1">
                <Archive className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="images" className="text-xs px-1">
                <ImageIcon className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="supplier" className="text-xs px-1">
                <Truck className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="financial" className="text-xs px-1">
                <Calculator className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="tracking" className="text-xs px-1">
                <ClipboardList className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="product" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analytics.activeProducts}</p>
                      <p className="text-xs text-muted-foreground">À Venda</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">{analytics.soldProducts}</p>
                      <p className="text-xs text-muted-foreground">Vendidos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profit */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Lucro Total</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {analytics.totalProfit.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              {analytics.lowStockCount > 0 && (
                <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-600">Estoque Baixo</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.lowStockCount} produto(s) precisam de reposição
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stock" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Informações de estoque</p>
                <p className="text-xs">Em desenvolvimento</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="images" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Galeria de imagens</p>
                <p className="text-xs">Em desenvolvimento</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="supplier" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center text-muted-foreground">
                <Truck className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Informações de fornecedor</p>
                <p className="text-xs">Em desenvolvimento</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="financial" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Informações financeiras</p>
                <p className="text-xs">Em desenvolvimento</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tracking" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="text-center text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Informações de rastreio</p>
                <p className="text-xs">Em desenvolvimento</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="filters" className="flex-1 mt-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">CATEGORIA</Label>
                <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {analytics.categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">STATUS</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className={cn("h-3 w-3", option.color)} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">FORNECEDOR</Label>
                <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Fornecedores</SelectItem>
                    {analytics.suppliers.map(supplier => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      </div>

      {/* Mobile Footer com Botões e Info - Fixo no final */}
      <div className="border-t bg-muted/30 p-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {}} 
            className="flex-1 h-9 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onAddProduct} 
            className="flex-1 h-9 text-sm font-medium"
          >
            Adicionar Produto
          </Button>
        </div>
        
        <div className="text-center text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span>Produtos filtrados</span>
            <Badge variant="secondary" className="text-xs">{filteredProducts.length} de {analytics.totalProducts}</Badge>
          </div>
          <div>Última atualização: {isClient ? currentTime : '--:--'}</div>
        </div>
      </div>
    </div>
  )

  // Desktop Sidebar Content
  const desktopSidebarContent = (
    <div className="w-80 bg-card border-r h-full flex flex-col max-h-screen">
      {/* Header Section */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos
          </h2>
          <Badge variant="secondary">
            {analytics.totalProducts}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu inventário de produtos
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Busque por nome do produto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="flex flex-col gap-1.5">
          <Button onClick={onAddProduct} className="w-full justify-center gap-2 h-8" size="sm">
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={isLoading} className="w-full justify-center gap-2 h-8" size="sm">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar Lista
          </Button>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="p-3 border-b flex-shrink-0">
        <Card>
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium">Resumo Rápido</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">À Venda</p>
                <p className="font-medium text-green-600">{analytics.activeProducts}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendidos</p>
                <p className="font-medium text-gray-600">{analytics.soldProducts}</p>
              </div>
            </div>
            <div className="mt-1 pt-1 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Lucro Total</span>
                <span className="text-xs font-medium text-green-600">
                  {analytics.totalProfit.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>
            {analytics.lowStockCount > 0 && (
              <div className="mt-1 p-1.5 bg-red-50 dark:bg-red-950 rounded-md">
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {analytics.lowStockCount} com estoque baixo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters - Scrollable Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Filtros</h3>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3" />
                CATEGORIA
              </Label>
              <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {analytics.categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                STATUS
              </Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className={cn("h-3 w-3", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">FORNECEDOR</Label>
              <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {analytics.suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Quick Export Actions */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">EXPORTAR DADOS</Label>
              <div className="flex flex-col gap-1.5">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full justify-start gap-2 h-7">
                  <Package className="h-3 w-3" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON} className="w-full justify-start gap-2 h-7">
                  <Package className="h-3 w-3" />
                  Exportar JSON
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/50 flex-shrink-0">
        <div className="text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span>Produtos filtrados</span>
            <Badge variant="secondary">{filteredProducts.length} de {analytics.totalProducts}</Badge>
          </div>
          <div>Última atualização: {isClient ? currentTime : '--:--'}</div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          {mobileSidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className={cn("hidden lg:block", className)}>
      {desktopSidebarContent}
    </div>
  )
}