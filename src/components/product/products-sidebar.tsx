"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  Plus,
  Search,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Eye,
  EyeOff,
  Clock,
  ShoppingCart,
  Layers,
  FileText,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  Truck,
  Star,
  Archive,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Upload,
  Edit,
  Trash2,
  MoreHorizontal,
  Tag,
  MapPin,
  Globe,
  CreditCard,
  Wallet,
  Menu,
  X
} from "lucide-react"
import { exportProductsToCSV, exportProductsToJSON, downloadFile } from "@/lib/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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

const ROI_RANGES = [
  { value: 'all', label: 'Todos os ROIs' },
  { value: 'excellent', label: 'Excelente (≥50%)', color: 'text-green-600' },
  { value: 'good', label: 'Bom (25-49%)', color: 'text-blue-600' },
  { value: 'average', label: 'Médio (10-24%)', color: 'text-yellow-600' },
  { value: 'poor', label: 'Ruim (<10%)', color: 'text-red-600' }
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [roiFilter, setRoiFilter] = useState<string>("all")
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all")
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [isMetricsOpen, setIsMetricsOpen] = useState(true)
  const [isActionsOpen, setIsActionsOpen] = useState(true)
  const [isQuickStatsOpen, setIsQuickStatsOpen] = useState(true)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate analytics data
  const analytics = useMemo(() => {
    console.log('🔄 Calculando métricas para produtos:', products?.length || 0)
    
    if (!products || products.length === 0) {
      console.log('📊 Nenhum produto encontrado, retornando métricas zeradas')
      return {
        totalProducts: 0,
        totalInvestment: 0,
        totalRevenue: 0,
        totalProfit: 0,
        avgROI: 0,
        avgMargin: 0,
        lowStockCount: 0,
        excellentROI: 0,
        categories: [],
        suppliers: [],
        topCategory: null,
        topSupplier: null,
        profitabilityScore: 0,
        inventoryValue: 0,
        soldProducts: 0,
        activeProducts: 0
      }
    }

    const totalProducts = products.length
    const totalInvestment = products.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0)
    const totalRevenue = products.reduce((acc, p) => acc + (p.sellingPrice * p.quantitySold), 0)
    const totalProfit = products.reduce((acc, p) => acc + p.actualProfit, 0)
    const avgROI = totalProducts > 0 ? products.reduce((acc, p) => acc + p.roi, 0) / totalProducts : 0
    const avgMargin = totalProducts > 0 ? products.reduce((acc, p) => acc + p.profitMargin, 0) / totalProducts : 0
    
    console.log('📊 Dados dos produtos para cálculo:', {
      totalProducts,
      sampleProduct: products[0] ? {
        name: products[0].name,
        totalCost: products[0].totalCost,
        quantity: products[0].quantity,
        sellingPrice: products[0].sellingPrice,
        quantitySold: products[0].quantitySold,
        actualProfit: products[0].actualProfit,
        roi: products[0].roi,
        profitMargin: products[0].profitMargin
      } : 'Nenhum produto'
    })
    
    // Verificar se há produtos com dados financeiros zerados
    const productsWithZeroROI = products.filter(p => p.roi === 0).length
    const productsWithZeroMargin = products.filter(p => p.profitMargin === 0).length
    
    if (productsWithZeroROI > 0 || productsWithZeroMargin > 0) {
      console.warn('⚠️ Produtos com dados financeiros zerados:', {
        zeroROI: productsWithZeroROI,
        zeroMargin: productsWithZeroMargin
      })
    }
    const lowStockCount = products.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold').length
    const excellentROI = products.filter(p => p.roi >= 50).length
    const soldProducts = products.filter(p => p.status === 'sold').length
    const activeProducts = products.filter(p => p.status === 'selling').length
    const inventoryValue = products.reduce((acc, p) => acc + (p.sellingPrice * (p.quantity - p.quantitySold)), 0)

    // Category analysis
    const categoryStats = products.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = { count: 0, profit: 0, revenue: 0 }
      }
      acc[category].count++
      acc[category].profit += product.actualProfit
      acc[category].revenue += product.sellingPrice * product.quantitySold
      return acc
    }, {} as Record<string, { count: number; profit: number; revenue: number }>)

    // Supplier analysis
    const supplierStats = products.reduce((acc, product) => {
      const supplier = product.supplier
      if (!acc[supplier]) {
        acc[supplier] = { count: 0, profit: 0, revenue: 0 }
      }
      acc[supplier].count++
      acc[supplier].profit += product.actualProfit
      acc[supplier].revenue += product.sellingPrice * product.quantitySold
      return acc
    }, {} as Record<string, { count: number; profit: number; revenue: number }>)

    const categories = Object.keys(categoryStats)
    const suppliers = Object.keys(supplierStats)
    
    const topCategory = categories.length > 0 
      ? Object.entries(categoryStats).reduce((max, [cat, stats]) => {
          const maxProfit = typeof max === 'object' && 'profit' in max ? max.profit : 0;
          return stats.profit > maxProfit ? { category: cat, ...stats } : max;
        }, { category: '', count: 0, profit: 0, revenue: 0 } as { category: string; count: number; profit: number; revenue: number })
      : null

    const topSupplier = suppliers.length > 0 
      ? Object.entries(supplierStats).reduce((max, [sup, stats]) => {
          const maxProfit = typeof max === 'object' && 'profit' in max ? max.profit : 0;
          return stats.profit > maxProfit ? { supplier: sup, ...stats } : max;
        }, { supplier: '', count: 0, profit: 0, revenue: 0 } as { supplier: string; count: number; profit: number; revenue: number })
      : null

    // Profitability score (0-100)
    const profitabilityScore = Math.min(100, Math.max(0, (avgROI / 50) * 100))

    return {
      totalProducts,
      totalInvestment,
      totalRevenue,
      totalProfit,
      avgROI,
      avgMargin,
      lowStockCount,
      excellentROI,
      categories,
      suppliers,
      topCategory,
      topSupplier,
      profitabilityScore,
      inventoryValue,
      soldProducts,
      activeProducts
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // ROI filter
    if (roiFilter !== "all") {
      switch (roiFilter) {
        case "excellent":
          filtered = filtered.filter(p => p.roi >= 50)
          break
        case "good":
          filtered = filtered.filter(p => p.roi >= 25 && p.roi < 50)
          break
        case "average":
          filtered = filtered.filter(p => p.roi >= 10 && p.roi < 25)
          break
        case "poor":
          filtered = filtered.filter(p => p.roi < 10)
          break
      }
    }

    // Price range filter
    if (priceRangeFilter !== "all") {
      switch (priceRangeFilter) {
        case "low":
          filtered = filtered.filter(p => p.sellingPrice <= 50)
          break
        case "medium":
          filtered = filtered.filter(p => p.sellingPrice > 50 && p.sellingPrice <= 200)
          break
        case "high":
          filtered = filtered.filter(p => p.sellingPrice > 200)
          break
      }
    }

    return filtered
  }, [products, statusFilter, roiFilter, priceRangeFilter])

  // Funções de exportação
  const handleExportCSV = () => {
    const csvContent = exportProductsToCSV(products)
    downloadFile(csvContent, `produtos-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const handleExportJSON = () => {
    const jsonContent = exportProductsToJSON(products)
    downloadFile(jsonContent, `produtos-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }

  const handleImportProducts = () => {
    // TODO: Implementar importação
    console.log('Importação de produtos será implementada')
  }

  // Mobile Sidebar Content
  const mobileSidebarContent = (
    <div className="h-full flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Produtos
        </h2>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Quick Stats for Mobile */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-blue-600">{analytics.totalProducts}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="p-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="text-lg font-bold text-green-600">
                          {analytics.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profitability Score */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium">Score de Lucratividade</span>
                        <Badge variant={analytics.profitabilityScore >= 70 ? "default" : analytics.profitabilityScore >= 40 ? "secondary" : "destructive"}>
                          {analytics.profitabilityScore.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={analytics.profitabilityScore} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        ROI médio: {analytics.avgROI.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={onAddProduct} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={onRefresh} disabled={isLoading} className="gap-2">
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Atualizar
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="filters" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
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
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className={cn("h-4 w-4", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fornecedor</Label>
                <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
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

        <TabsContent value="actions" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="justify-start gap-2 w-full">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="justify-start gap-2 w-full">
                <Download className="h-4 w-4" />
                Exportar JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportProducts} className="justify-start gap-2 w-full">
                <Upload className="h-4 w-4" />
                Importar Produtos
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Mobile Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span>Produtos filtrados</span>
            <Badge variant="secondary">{filteredProducts.length} de {analytics.totalProducts}</Badge>
          </div>
          <div>Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  )

  // Desktop Sidebar Content
  const desktopSidebarContent = (
    <div className="w-80 bg-card border-r h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Header Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="hidden sm:inline">Produtos</span>
                <span className="sm:hidden">Prod.</span>
              </h2>
              <Badge variant="secondary" className="text-xs">
                {analytics.totalProducts}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Gerencie seu inventário de produtos
            </p>
          </div>

          {/* Search Bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por nome do produto..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onAddProduct}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
          </div>

          <Separator />

          {/* Quick Stats */}
          <Collapsible open={isQuickStatsOpen} onOpenChange={setIsQuickStatsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Resumo Rápido</span>
              </div>
              {isQuickStatsOpen ? 
                <ChevronDown className="h-4 w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4">
              {/* Profitability Score */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Score de Lucratividade</span>
                    <Badge variant={analytics.profitabilityScore >= 70 ? "default" : analytics.profitabilityScore >= 40 ? "secondary" : "destructive"}>
                      {analytics.profitabilityScore.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={analytics.profitabilityScore} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    ROI médio: {analytics.avgROI.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro Total</p>
                        <p className="text-sm font-bold">
                          {analytics.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">ROI Excelentes</p>
                        <p className="text-sm font-bold">{analytics.excellentROI}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ativos</p>
                        <p className="text-sm font-bold">{analytics.activeProducts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vendidos</p>
                        <p className="text-sm font-bold">{analytics.soldProducts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Cards */}
              {analytics.lowStockCount > 0 && (
                <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Estoque Baixo</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.lowStockCount} produto(s) precisam de reposição
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Category */}
              {analytics.topCategory && (
                <Card className="bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium">Top Categoria</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.topCategory.category} - {analytics.topCategory.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Filters Section */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros</span>
              </div>
              {isFiltersOpen ? 
                <ChevronDown className="h-4 w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  CATEGORIA
                </Label>
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
                    {STATUS_OPTIONS.map(option => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className={cn("h-4 w-4", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  FORNECEDOR
                </Label>
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

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="advanced-filters" className="text-sm">
                  Filtros Avançados
                </Label>
                <Switch
                  id="advanced-filters"
                  checked={showAdvancedFilters}
                  onCheckedChange={setShowAdvancedFilters}
                />
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                  {/* ROI Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">PERFORMANCE ROI</Label>
                    <Select value={roiFilter} onValueChange={setRoiFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROI_RANGES.map(range => (
                          <SelectItem key={range.value} value={range.value}>
                            <span className={range.color}>{range.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">FAIXA DE PREÇO</Label>
                    <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Faixas</SelectItem>
                        <SelectItem value="low">Até R$ 50</SelectItem>
                        <SelectItem value="medium">R$ 51 - R$ 200</SelectItem>
                        <SelectItem value="high">Acima de R$ 200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Actions Section */}
          <Collapsible open={isActionsOpen} onOpenChange={setIsActionsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Ações</span>
              </div>
              {isActionsOpen ? 
                <ChevronDown className="h-4 w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="justify-start gap-2 w-full">
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportJSON} className="justify-start gap-2 w-full">
                    <Download className="h-4 w-4" />
                    Exportar JSON
                  </Button>
                </div>
                
                <Button variant="outline" size="sm" onClick={handleImportProducts} className="justify-start gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Produtos
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsReportOpen(!isReportOpen)}
                  className="justify-start gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Relatório de Estoque
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                  className="justify-start gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Análise de Performance
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Metrics Section */}
          <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Métricas Detalhadas</span>
              </div>
              {isMetricsOpen ? 
                <ChevronDown className="h-4 w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4">
              {/* Investment Overview */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Investimento Total</span>
                      <span className="text-sm font-bold text-primary">
                        {analytics.totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Valor em Estoque</span>
                      <span className="text-sm font-bold text-green-600">
                        {analytics.inventoryValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Receita Total</span>
                      <span className="text-sm font-bold text-blue-600">
                        {analytics.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Margem Média</span>
                      <span className="text-sm font-bold text-green-600">
                        {analytics.avgMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Produtos Vendidos</span>
                      <span className="text-sm font-bold">
                        {analytics.soldProducts} / {analytics.totalProducts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa de Venda</span>
                      <span className="text-sm font-bold text-blue-600">
                        {analytics.totalProducts > 0 ? ((analytics.soldProducts / analytics.totalProducts) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Relatório de Estoque Expandível */}
          {isReportOpen && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Resumo do Estoque</h4>
                <Badge variant="secondary" className="text-xs">
                  {analytics.totalProducts} produtos
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Investimento:</span>
                  <div className="font-medium text-red-600">
                    {analytics.totalInvestment.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Estoque:</span>
                  <div className="font-medium text-green-600">
                    {analytics.inventoryValue.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL',
                      maximumFractionDigits: 0
                    })}
                  </div>
                </div>
              </div>

              {analytics.lowStockCount > 0 && (
                <div className="flex items-center gap-2 text-orange-600 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{analytics.lowStockCount} produtos com estoque baixo</span>
                </div>
              )}
            </div>
          )}

          {/* Análise de Performance Expandível */}
          {isAnalysisOpen && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Performance</h4>
                <Badge variant="secondary" className="text-xs">
                  {analytics.avgROI.toFixed(1)}% ROI
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Excelente (≥50%)</span>
                  <Badge variant="outline" className="text-xs">
                    {analytics.excellentROI}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Margem Média</span>
                  <span className="font-medium text-green-600">
                    {analytics.avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {analytics.topCategory && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Top Categoria:</span>
                  <div className="font-medium">{analytics.topCategory.category}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 sm:p-6 border-t bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Produtos filtrados</span>
          <span>{filteredProducts.length} de {analytics.totalProducts}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>Última atualização</span>
          <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )

  // Render mobile sidebar when isMobile is true
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          {mobileSidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  // Render desktop sidebar
  return (
    <div className={cn("hidden lg:block", className)}>
      {desktopSidebarContent}
    </div>
  )
}