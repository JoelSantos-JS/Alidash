"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  PieChart,
  LineChart,
  Zap,
  Star,
  Archive,
  Eye,
  EyeOff,
  Clock,
  Users,
  ShoppingCart,
  Layers,
  FileText,
  Settings,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Product } from "@/types"
import { cn } from "@/lib/utils"

type ReportsSidebarProps = {
  data: Product[]
  periodFilter: "week" | "month" | "quarter" | "year"
  categoryFilter: string
  onPeriodFilterChange: (period: "week" | "month" | "quarter" | "year") => void
  onCategoryFilterChange: (category: string) => void
  onExport?: () => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

const METRIC_CARDS = [
  {
    id: 'profitability',
    name: 'Lucratividade',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'inventory',
    name: 'Estoque',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    id: 'velocity',
    name: 'Velocidade',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  }
]

const CHART_TYPES = [
  { id: 'overview', name: 'Visão Geral', icon: BarChart3, charts: ['profitability', 'category', 'velocity', 'roi'] },
  { id: 'performance', name: 'Performance', icon: Target, charts: ['inventory', 'supplier', 'margin', 'trends'] },
  { id: 'trends', name: 'Tendências', icon: LineChart, charts: ['trends', 'category', 'roi'] },
  { id: 'analysis', name: 'Análise', icon: PieChart, charts: ['margin', 'supplier', 'velocity', 'inventory'] }
]

export function ReportsSidebar({
  data,
  periodFilter,
  categoryFilter,
  onPeriodFilterChange,
  onCategoryFilterChange,
  onExport,
  onRefresh,
  isLoading = false,
  className
}: ReportsSidebarProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['profitability', 'performance'])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState('overview')
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [isMetricsOpen, setIsMetricsOpen] = useState(true)
  const [isChartsOpen, setIsChartsOpen] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roiFilter, setRoiFilter] = useState<string>("all")

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!data || data.length === 0) {
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
        topCategory: null,
        profitabilityScore: 0
      }
    }

    const totalProducts = data.length
    const totalInvestment = data.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0)
    const totalRevenue = data.reduce((acc, p) => acc + (p.sellingPrice * p.quantitySold), 0)
    const totalProfit = data.reduce((acc, p) => acc + p.actualProfit, 0)
    const avgROI = totalProducts > 0 ? data.reduce((acc, p) => acc + p.roi, 0) / totalProducts : 0
    const avgMargin = totalProducts > 0 ? data.reduce((acc, p) => acc + p.profitMargin, 0) / totalProducts : 0
    const lowStockCount = data.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold').length
    const excellentROI = data.filter(p => p.roi >= 50).length

    // Category analysis
    const categoryStats = data.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = { count: 0, profit: 0, revenue: 0 }
      }
      acc[category].count++
      acc[category].profit += product.actualProfit
      acc[category].revenue += product.sellingPrice * product.quantitySold
      return acc
    }, {} as Record<string, { count: number; profit: number; revenue: number }>)

    const categories = Object.keys(categoryStats)
    const topCategory = categories.length > 0 
      ? Object.entries(categoryStats).reduce((max, [cat, stats]) => {
          const maxProfit = typeof max === 'object' && 'profit' in max ? max.profit : 0;
          return stats.profit > maxProfit ? { category: cat, ...stats } : max;
        }, { category: '', count: 0, profit: 0, revenue: 0 } as { category: string; count: number; profit: number; revenue: number })
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
      topCategory,
      profitabilityScore
    }
  }, [data])

  const filteredData = useMemo(() => {
    let filtered = [...data]

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

    return filtered
  }, [data, statusFilter, roiFilter])

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    )
  }

  return (
    <div className={cn("w-80 bg-card border-r h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Header Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Hub
              </h2>
              <Badge variant="secondary" className="text-xs">
                {analytics.totalProducts} produtos
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Controle completo dos seus relatórios
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>

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
              {/* Period Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  PERÍODO
                </Label>
                <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                    <SelectItem value="quarter">Último Trimestre</SelectItem>
                    <SelectItem value="year">Último Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">STATUS</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="purchased">Comprado</SelectItem>
                        <SelectItem value="shipping">Enviando</SelectItem>
                        <SelectItem value="received">Recebido</SelectItem>
                        <SelectItem value="selling">Vendendo</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ROI Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">PERFORMANCE ROI</Label>
                    <Select value={roiFilter} onValueChange={setRoiFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os ROIs</SelectItem>
                        <SelectItem value="excellent">Excelente (≥50%)</SelectItem>
                        <SelectItem value="good">Bom (25-49%)</SelectItem>
                        <SelectItem value="average">Médio (10-24%)</SelectItem>
                        <SelectItem value="poor">Ruim (&lt;10%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Key Metrics */}
          <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Métricas Chave</span>
              </div>
              {isMetricsOpen ? 
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
                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
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

          {/* Chart Type Selector */}
          <Collapsible open={isChartsOpen} onOpenChange={setIsChartsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span className="font-medium">Visualizações</span>
              </div>
              {isChartsOpen ? 
                <ChevronDown className="h-4 w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-4 w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-4">
              {CHART_TYPES.map((chartType) => {
                const IconComponent = chartType.icon
                const isSelected = selectedChartType === chartType.id
                
                return (
                  <Button
                    key={chartType.id}
                    variant={isSelected ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => setSelectedChartType(chartType.id)}
                  >
                    <IconComponent className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">{chartType.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {chartType.charts.length} gráficos
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                  </Button>
                )
              })}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Exportar Dados</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <Download className="h-4 w-4" />
                Relatório PDF
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <FileText className="h-4 w-4" />
                Planilha Excel
              </Button>
            </div>
          </div>

        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Última atualização</span>
          <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}