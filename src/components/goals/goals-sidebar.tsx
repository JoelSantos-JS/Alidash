"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Activity,
  PieChart,
  BarChart3,
  Zap,
  Star,
  Clock,
  Users,
  Trophy,
  Flame,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  Flag,
  Rocket,
  Heart,
  BookOpen,
  Briefcase
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Goal } from "@/types"
import { cn } from "@/lib/utils"

type GoalsSidebarProps = {
  goals: Goal[]
  periodFilter: "week" | "month" | "quarter" | "year"
  categoryFilter: string
  statusFilter: string
  priorityFilter: string
  onPeriodFilterChange: (period: "week" | "month" | "quarter" | "year") => void
  onCategoryFilterChange: (category: string) => void
  onStatusFilterChange: (status: string) => void
  onPriorityFilterChange: (priority: string) => void
  onExport?: () => void
  onRefresh?: () => void
  onCreateGoal?: () => void
  isLoading?: boolean
  className?: string
}

const GOAL_CATEGORIES = [
  {
    id: 'financial',
    name: 'Financeiro',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'business',
    name: 'Negócios',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'personal',
    name: 'Pessoal',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    borderColor: 'border-pink-200 dark:border-pink-800'
  },
  {
    id: 'health',
    name: 'Saúde',
    icon: Activity,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  {
    id: 'education',
    name: 'Educação',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    id: 'other',
    name: 'Outros',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  }
]

const PRIORITY_LEVELS = [
  { id: 'critical', name: 'Crítica', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
  { id: 'high', name: 'Alta', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' },
  { id: 'medium', name: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'low', name: 'Baixa', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' }
]

const STATUS_OPTIONS = [
  { id: 'active', name: 'Ativa', icon: Rocket, color: 'text-blue-600' },
  { id: 'paused', name: 'Pausada', icon: Clock, color: 'text-yellow-600' },
  { id: 'completed', name: 'Concluída', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'cancelled', name: 'Cancelada', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'overdue', name: 'Atrasada', icon: AlertTriangle, color: 'text-orange-600' }
]

export function GoalsSidebar({
  goals,
  periodFilter,
  categoryFilter,
  statusFilter,
  priorityFilter,
  onPeriodFilterChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onExport,
  onRefresh,
  onCreateGoal,
  isLoading = false,
  className
}: GoalsSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['financial', 'business'])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [isMetricsOpen, setIsMetricsOpen] = useState(true)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true)
  const [isInsightsOpen, setIsInsightsOpen] = useState(true)

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        overdue: 0,
        avgProgress: 0,
        criticalGoals: 0,
        nearDeadline: 0,
        topCategory: null,
        completionRate: 0,
        momentum: 0
      }
    }

    const totalGoals = goals.length
    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length
    const overdue = goals.filter(g => g.status === 'overdue').length
    const criticalGoals = goals.filter(g => g.priority === 'critical').length
    
    // Goals with deadline in next 7 days
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nearDeadline = goals.filter(g => 
      g.status === 'active' && new Date(g.deadline) <= nextWeek
    ).length

    // Average progress
    const avgProgress = totalGoals > 0 
      ? goals.reduce((acc, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
          return acc + Math.min(100, progress)
        }, 0) / totalGoals
      : 0

    // Completion rate
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

    // Category analysis
    const categoryStats = goals.reduce((acc, goal) => {
      const category = goal.category
      if (!acc[category]) {
        acc[category] = { count: 0, completed: 0, avgProgress: 0 }
      }
      acc[category].count++
      if (goal.status === 'completed') acc[category].completed++
      
      const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
      acc[category].avgProgress += Math.min(100, progress)
      return acc
    }, {} as Record<string, { count: number; completed: number; avgProgress: number }>)

    // Calculate average progress for each category
    Object.keys(categoryStats).forEach(cat => {
      categoryStats[cat].avgProgress = categoryStats[cat].avgProgress / categoryStats[cat].count
    })

    const topCategory = Object.keys(categoryStats).length > 0 
      ? Object.entries(categoryStats).reduce((max, [cat, stats]) => {
          return stats.avgProgress > max.avgProgress ? { category: cat, ...stats } : max
        }, { category: '', count: 0, completed: 0, avgProgress: 0 })
      : null

    // Momentum calculation (goals completed in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCompletions = goals.filter(g => 
      g.status === 'completed' && new Date(g.createdDate) >= thirtyDaysAgo
    ).length
    const momentum = (recentCompletions / Math.max(1, totalGoals)) * 100

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      overdue,
      avgProgress,
      criticalGoals,
      nearDeadline,
      topCategory,
      completionRate,
      momentum
    }
  }, [goals])

  const filteredGoals = useMemo(() => {
    let filtered = [...goals]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(g => g.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(g => g.category === categoryFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(g => g.priority === priorityFilter)
    }

    return filtered
  }, [goals, statusFilter, categoryFilter, priorityFilter])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className={cn(
      "w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "md:w-80 w-full max-w-sm", // Mobile: full width but max 384px, Desktop: 320px
      className
    )}>
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-3 p-3 md:gap-4 md:p-4"> {/* Smaller gaps and padding on mobile */}
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h2 className="font-semibold text-sm md:text-base">Metas</h2>
            </div>
            <div className="flex items-center gap-0.5 md:gap-1">
              {onCreateGoal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCreateGoal}
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <RefreshCw className={cn("h-3 w-3 md:h-4 md:w-4", isLoading && "animate-spin")} />
                </Button>
              )}
              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="h-7 w-7 md:h-8 md:w-8 p-0"
                >
                  <Download className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
            <Card className="p-2 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Target className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <div>
                  <div className="text-base md:text-lg font-bold">{analytics.activeGoals}</div>
                  <div className="text-xs text-muted-foreground">Ativas</div>
                </div>
              </div>
            </Card>
            <Card className="p-2 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                <div>
                  <div className="text-base md:text-lg font-bold">{analytics.completedGoals}</div>
                  <div className="text-xs text-muted-foreground">Concluídas</div>
                </div>
              </div>
            </Card>
            <Card className="p-2 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                <div>
                  <div className="text-base md:text-lg font-bold">{analytics.momentum.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Momentum</div>
                </div>
              </div>
            </Card>
            <Card className="p-2 md:p-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                <div>
                  <div className="text-base md:text-lg font-bold">{analytics.nearDeadline}</div>
                  <div className="text-xs text-muted-foreground">Urgentes</div>
                </div>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Filters */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium text-sm md:text-base">Filtros</span>
              </div>
              {isFiltersOpen ? 
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 md:space-y-3 mt-2 md:mt-3">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">PERÍODO</Label>
                <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
                  <SelectTrigger className="h-7 md:h-8 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="quarter">Este Trimestre</SelectItem>
                    <SelectItem value="year">Este Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">STATUS</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="h-7 md:h-8 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <status.icon className={cn("h-3 w-3", status.color)} />
                          <span className="text-xs md:text-sm">{status.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">CATEGORIA</Label>
                <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                  <SelectTrigger className="h-7 md:h-8 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {GOAL_CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <category.icon className={cn("h-3 w-3", category.color)} />
                          <span className="text-xs md:text-sm">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">PRIORIDADE</Label>
                <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
                  <SelectTrigger className="h-7 md:h-8 text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItem key={priority.id} value={priority.id}>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className={cn("w-2 h-2 rounded-full", priority.bgColor)} />
                          <span className="text-xs md:text-sm">{priority.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">FILTROS AVANÇADOS</Label>
                <Switch 
                  checked={showAdvancedFilters} 
                  onCheckedChange={setShowAdvancedFilters}
                  className="scale-75 md:scale-100"
                />
              </div>

              {showAdvancedFilters && (
                <div className="space-y-2 md:space-y-3 p-2 md:p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">PROGRESSO</Label>
                    <div className="grid grid-cols-2 gap-1 md:gap-2">
                      <Button variant="outline" size="sm" className="h-6 md:h-7 text-xs px-1 md:px-2">
                        0-25%
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 md:h-7 text-xs px-1 md:px-2">
                        26-50%
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 md:h-7 text-xs px-1 md:px-2">
                        51-75%
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 md:h-7 text-xs px-1 md:px-2">
                        76-100%
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Key Metrics */}
          <Collapsible open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Activity className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium text-sm md:text-base">Métricas Chave</span>
              </div>
              {isMetricsOpen ? 
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 md:space-y-3 mt-2 md:mt-3">
              <Card className="p-2 md:p-3">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm font-medium">Progresso Médio</span>
                  <span className="text-xs md:text-sm font-bold text-primary">{analytics.avgProgress.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.avgProgress} className="h-1.5 md:h-2" />
              </Card>

              <Card className="p-2 md:p-3">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm font-medium">Taxa de Conclusão</span>
                  <span className="text-xs md:text-sm font-bold text-green-600">{analytics.completionRate.toFixed(1)}%</span>
                </div>
                <Progress value={analytics.completionRate} className="h-1.5 md:h-2" />
              </Card>

              {analytics.criticalGoals > 0 && (
                <Card className="p-2 md:p-3 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                    <div>
                      <div className="text-xs md:text-sm font-medium text-red-600">
                        {analytics.criticalGoals} Meta{analytics.criticalGoals > 1 ? 's' : ''} Crítica{analytics.criticalGoals > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">Requer atenção imediata</div>
                    </div>
                  </div>
                </Card>
              )}

              {analytics.topCategory && (
                <Card className="p-2 md:p-3">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Award className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                    <div>
                      <div className="text-xs md:text-sm font-medium">Melhor Categoria</div>
                      <div className="text-xs text-muted-foreground">
                        {GOAL_CATEGORIES.find(c => c.id === analytics.topCategory?.category)?.name} 
                        ({analytics.topCategory.avgProgress.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Categories Overview */}
          <Collapsible open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5 md:gap-2">
                <PieChart className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium text-sm md:text-base">Categorias</span>
              </div>
              {isCategoriesOpen ? 
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 md:space-y-2 mt-2 md:mt-3">
              {GOAL_CATEGORIES.map(category => {
                const categoryGoals = goals.filter(g => g.category === category.id)
                const isSelected = selectedCategories.includes(category.id)
                const avgProgress = categoryGoals.length > 0 
                  ? categoryGoals.reduce((acc, g) => {
                      const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
                      return acc + Math.min(100, progress)
                    }, 0) / categoryGoals.length
                  : 0

                return (
                  <Card 
                    key={category.id} 
                    className={cn(
                      "p-2 md:p-3 cursor-pointer transition-all hover:shadow-md",
                      isSelected && category.borderColor,
                      isSelected && category.bgColor
                    )}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <category.icon className={cn("h-3 w-3 md:h-4 md:w-4", category.color)} />
                        <div>
                          <div className="text-xs md:text-sm font-medium">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {categoryGoals.length} meta{categoryGoals.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs md:text-sm font-bold">{avgProgress.toFixed(0)}%</div>
                        <div className="w-8 md:w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all", category.color.replace('text-', 'bg-'))} 
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Insights & Tips */}
          <Collapsible open={isInsightsOpen} onOpenChange={setIsInsightsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium text-sm md:text-base">Insights</span>
              </div>
              {isInsightsOpen ? 
                <ChevronDown className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" /> : 
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:text-primary" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 md:space-y-3 mt-2 md:mt-3">
              {analytics.nearDeadline > 0 && (
                <Card className="p-2 md:p-3 border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-1.5 md:gap-2">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mt-0.5" />
                    <div>
                      <div className="text-xs md:text-sm font-medium text-orange-600">Atenção aos Prazos</div>
                      <div className="text-xs text-muted-foreground">
                        {analytics.nearDeadline} meta{analytics.nearDeadline > 1 ? 's' : ''} com prazo próximo. 
                        Considere revisar suas prioridades.
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {analytics.momentum > 50 && (
                <Card className="p-2 md:p-3 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-1.5 md:gap-2">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 mt-0.5" />
                    <div>
                      <div className="text-xs md:text-sm font-medium text-green-600">Excelente Momentum!</div>
                      <div className="text-xs text-muted-foreground">
                        Você está no caminho certo. Continue assim para manter o ritmo.
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {analytics.avgProgress < 30 && analytics.activeGoals > 0 && (
                <Card className="p-2 md:p-3 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-1.5 md:gap-2">
                    <Info className="h-3 w-3 md:h-4 md:w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-xs md:text-sm font-medium text-blue-600">Dica de Produtividade</div>
                      <div className="text-xs text-muted-foreground">
                        Considere quebrar suas metas em marcos menores para facilitar o progresso.
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-2 md:p-3">
                <div className="flex items-start gap-1.5 md:gap-2">
                  <Flag className="h-3 w-3 md:h-4 md:w-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="text-xs md:text-sm font-medium">Meta da Semana</div>
                    <div className="text-xs text-muted-foreground">
                      Foque em completar pelo menos uma meta de alta prioridade.
                    </div>
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Results Summary */}
          <div className="text-xs text-muted-foreground text-center pt-1 md:pt-2 px-1">
            {filteredGoals.length} de {analytics.totalGoals} metas
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}