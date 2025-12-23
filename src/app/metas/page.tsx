"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-supabase-auth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  SortAsc, 
  SortDesc,
  Calendar,
  TrendingUp,
  Trophy,
  AlertTriangle,
  ArrowLeft,
  Menu
} from "lucide-react"
import { GoalsSidebar } from "@/components/goals/goals-sidebar"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalForm } from "@/components/goals/goal-form"
import { GoalsOverview } from "@/components/goals/goals-overview"
import type { Goal, Product } from "@/types"
import { cn } from "@/lib/utils"

// Função para gerar metas baseadas nos produtos reais
const generateGoalsFromProducts = (products: Product[]): Goal[] => {
  const goals: Goal[] = []
  
  if (products.length === 0) {
    // Metas de exemplo se não houver produtos
    return [
      {
        id: '1',
        name: 'Reserva de Emergência',
        description: 'Construir uma reserva de emergência equivalente a 6 meses de gastos',
        category: 'financial',
        type: 'savings',
        targetValue: 30000,
        currentValue: 5000,
        unit: 'BRL',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        createdDate: new Date(),
        priority: 'high',
        status: 'active',
        notes: 'Prioridade máxima para segurança financeira',
        tags: ['emergência', 'segurança', 'financeiro']
      },
      {
        id: '2',
        name: 'Primeira Venda',
        description: 'Realizar a primeira venda de produto',
        category: 'business',
        type: 'quantity',
        targetValue: 1,
        currentValue: 0,
        unit: 'quantity',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        createdDate: new Date(),
        priority: 'critical',
        status: 'active',
        notes: 'Foco em conseguir a primeira venda para validar o negócio',
        tags: ['negócio', 'primeira-venda', 'validação']
      }
    ]
  }
  
  // Calcular métricas dos produtos
  const totalRevenue = products.reduce((acc, p) => acc + (p.sellingPrice * p.quantitySold), 0)
  const totalProfit = products.reduce((acc, p) => acc + p.actualProfit, 0)
  const avgROI = products.length > 0 ? products.reduce((acc, p) => acc + p.roi, 0) / products.length : 0
  const totalProductsSold = products.reduce((acc, p) => acc + p.quantitySold, 0)
  
  // Meta de faturamento baseada no faturamento atual
  const currentMonthlyRevenue = totalRevenue
  const revenueTarget = Math.max(currentMonthlyRevenue * 1.5, 10000) // 50% a mais ou mínimo R$ 10k
  goals.push({
    id: 'revenue-goal',
    name: 'Meta de Faturamento Mensal',
    description: `Atingir R$ ${revenueTarget.toLocaleString('pt-BR')} de faturamento mensal`,
    category: 'business',
    type: 'revenue',
    targetValue: revenueTarget,
    currentValue: currentMonthlyRevenue,
    unit: 'BRL',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 meses
    createdDate: new Date(),
    priority: 'high',
    status: 'active',
    notes: 'Meta baseada no faturamento atual dos produtos',
    tags: ['faturamento', 'receita', 'crescimento']
  })
  
  // Meta de lucro
  const profitTarget = Math.max(totalProfit * 2, 5000) // Dobrar o lucro ou mínimo R$ 5k
  goals.push({
    id: 'profit-goal',
    name: 'Meta de Lucro',
    description: `Alcançar R$ ${profitTarget.toLocaleString('pt-BR')} de lucro líquido`,
    category: 'business',
    type: 'profit',
    targetValue: profitTarget,
    currentValue: totalProfit,
    unit: 'BRL',
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 meses
    createdDate: new Date(),
    priority: 'high',
    status: 'active',
    notes: 'Meta de lucro baseada na performance atual',
    tags: ['lucro', 'margem', 'rentabilidade']
  })
  
  // Meta de ROI se o ROI atual for baixo
  if (avgROI < 50) {
    goals.push({
      id: 'roi-goal',
      name: 'Melhorar ROI Médio',
      description: 'Atingir 50% de ROI médio nos produtos',
      category: 'business',
      type: 'percentage',
      targetValue: 50,
      currentValue: avgROI,
      unit: 'percentage',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
      createdDate: new Date(),
      priority: 'medium',
      status: 'active',
      notes: 'Foco em produtos com maior margem de lucro',
      tags: ['roi', 'otimização', 'margem']
    })
  }
  
  // Meta de vendas
  const salesTarget = Math.max(totalProductsSold * 2, 10) // Dobrar vendas ou mínimo 10
  goals.push({
    id: 'sales-goal',
    name: 'Meta de Vendas',
    description: `Vender ${salesTarget} produtos`,
    category: 'business',
    type: 'quantity',
    targetValue: salesTarget,
    currentValue: totalProductsSold,
    unit: 'quantity',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 meses
    createdDate: new Date(),
    priority: 'medium',
    status: 'active',
    notes: 'Meta baseada no histórico de vendas atual',
    tags: ['vendas', 'volume', 'crescimento']
  })
  
  // Meta pessoal de reserva de emergência
  goals.push({
    id: 'emergency-fund',
    name: 'Reserva de Emergência',
    description: 'Construir reserva equivalente a 6 meses de gastos',
    category: 'financial',
    type: 'savings',
    targetValue: 30000,
    currentValue: Math.max(totalProfit * 0.3, 1000), // 30% do lucro atual
    unit: 'BRL',
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
    createdDate: new Date(),
    priority: 'high',
    status: 'active',
    notes: 'Segurança financeira pessoal',
    tags: ['emergência', 'segurança', 'poupança']
  })
  
  return goals
}

export default function MetasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'priority' | 'created'>('deadline')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  
  // Removido dual-sync: metas e produtos são carregados via API do Supabase
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [redirecting, setRedirecting] = useState(false)

  // Carregar dados reais do Supabase
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        console.log('🎯 Carregando metas do Supabase para usuário:', user.id)
        
        const response = await fetch(`/api/goals?user_id=${user.id}`)
        const data = await response.json()
        const userGoals: Goal[] = data.success && Array.isArray(data.goals) ? data.goals : []
        console.log(`✅ Metas gerais carregadas: ${userGoals.length}`)
        
        // Carregar produtos do Supabase
        const productsResponse = await fetch(`/api/products/get?user_id=${user.id}`)
        const productsData = await productsResponse.json()
        let userProducts: Product[] = []
        
        if (productsData.success && productsData.products) {
          userProducts = productsData.products.map((p: any) => ({
            ...p,
            purchaseDate: new Date(p.purchaseDate),
            sales: p.sales ? p.sales.map((s: any) => ({
              ...s, 
              date: new Date(s.date)
            })) : [],
          }))
          console.log('✅ Produtos carregados do Supabase:', userProducts.length)
        } else {
          console.log('⚠️ Nenhum produto encontrado no Supabase')
        }


        
        setProducts(userProducts)
        setGoals(userGoals)
        
        toast({
          title: "Metas carregadas",
          description: `${userGoals.length} meta${userGoals.length !== 1 ? 's' : ''} carregada${userGoals.length !== 1 ? 's' : ''}`,
          duration: 3000,
        })
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
        toast({
          title: "Erro ao carregar metas",
          description: "Não foi possível carregar suas metas. Tente novamente.",
          variant: "destructive",
        })
        
        // Evitar dados mock: não usar fallback automático
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  useEffect(() => {
    if (!authLoading && !user) {
      setRedirecting(true)
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals.filter(goal => {
      const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = categoryFilter === "all" || goal.category === categoryFilter
      const matchesStatus = statusFilter === "all" || goal.status === statusFilter
      const matchesPriority = priorityFilter === "all" || goal.priority === priorityFilter
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriority
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'deadline':
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          break
        case 'progress':
          const progressA = a.targetValue > 0 ? (a.currentValue / a.targetValue) * 100 : 0
          const progressB = b.targetValue > 0 ? (b.currentValue / b.targetValue) * 100 : 0
          comparison = progressA - progressB
          break
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'created':
          comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [goals, searchTerm, categoryFilter, statusFilter, priorityFilter, sortBy, sortOrder])

  const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'createdDate' | 'milestones' | 'reminders' | 'linkedEntities'>) => {
    try {
      let updatedGoals: Goal[]
      
      if (editingGoal) {
        // Atualizar meta via API do Supabase
        const updatedGoal = { ...editingGoal, ...goalData }
        updatedGoals = goals.map(goal => 
          goal.id === editingGoal.id ? updatedGoal : goal
        )

        try {
          const resp = await fetch('/api/goals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goalId: editingGoal.id,
              updates: goalData,
              userId: user!.id,
            })
          })

          const data = await resp.json()
          if (resp.ok && data.success) {
            setGoals(updatedGoals)
            toast({
              title: 'Meta atualizada',
              description: `${goalData.name} atualizada com sucesso`,
            })
          } else {
            toast({
              title: 'Erro ao atualizar meta',
              description: data.error || 'Falha ao atualizar a meta',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Erro ao atualizar meta:', error)
          toast({
            title: 'Erro ao atualizar meta',
            description: 'Não foi possível atualizar a meta. Tente novamente.',
            variant: 'destructive',
          })
        }
      } else {
        // Criar nova meta via API do Supabase
        const newGoal: Goal = {
          ...goalData,
          id: Date.now().toString(),
          createdDate: new Date(),
          milestones: [],
          reminders: [],
          linkedEntities: {}
        }
        
        try {
          const goalDataWithCreatedDate = {
            ...goalData,
            createdDate: new Date(),
            linkedEntities: {}
          }

          const resp = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user!.id,
              goalData: goalDataWithCreatedDate,
            })
          })
          const data = await resp.json()

          if (resp.ok && data.success) {
            updatedGoals = [...goals, newGoal]
            setGoals(updatedGoals)
            toast({
              title: 'Meta criada',
              description: `${goalData.name} foi criada com sucesso!`,
            })
          } else {
            toast({
              title: 'Erro ao criar meta',
              description: data.error || 'Falha ao criar a meta',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Erro ao criar meta:', error)
          toast({
            title: 'Erro ao criar meta',
            description: 'Não foi possível criar a meta. Tente novamente.',
            variant: 'destructive',
          })
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar meta:', error)
      toast({
        title: "Erro ao salvar meta",
        description: "Não foi possível salvar a meta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsFormOpen(false)
      setEditingGoal(undefined)
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setIsFormOpen(true)
  }

  const handleDeleteGoal = async (goal: Goal) => {
    if (confirm(`Tem certeza que deseja excluir a meta "${goal.name}"?`)) {
      try {
        const resp = await fetch(`/api/goals?goalId=${goal.id}&user_id=${user!.id}`, {
          method: 'DELETE'
        })
        const data = await resp.json()

        if (resp.ok && data.success) {
          const updatedGoals = goals.filter(g => g.id !== goal.id)
          setGoals(updatedGoals)
          toast({
            title: 'Meta deletada',
            description: `${goal.name} removida com sucesso`,
          })
        } else {
          toast({
            title: 'Erro ao excluir meta',
            description: data.error || 'Falha ao excluir a meta',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Erro ao excluir meta:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a meta.',
          variant: 'destructive'
        })
      }
    }
  }

  // Função para atualizar progresso de uma meta
  const handleUpdateProgress = async (goal: Goal, newCurrentValue: number) => {
    try {
      const resp = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          updates: { currentValue: newCurrentValue },
          userId: user!.id,
        })
      })
      const data = await resp.json()

      if (resp.ok && data.success) {
        const updatedGoals = goals.map(g => 
          g.id === goal.id 
            ? { ...g, currentValue: newCurrentValue }
            : g
        )
        setGoals(updatedGoals)
        toast({
          title: 'Progresso atualizado',
          description: `${goal.name} - Progresso: ${((newCurrentValue / goal.targetValue) * 100).toFixed(1)}%`,
        })
      } else {
        toast({
          title: 'Erro ao atualizar progresso',
          description: data.error || 'Falha ao atualizar progresso',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o progresso.',
        variant: 'destructive'
      })
    }
  }

  // Função para marcar meta como concluída
  const handleCompleteGoal = async (goal: Goal) => {
    try {
      const resp = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          updates: { status: 'completed' as const, currentValue: goal.targetValue },
          userId: user!.id,
        })
      })
      const data = await resp.json()

      if (resp.ok && data.success) {
        const updatedGoals = goals.map(g => 
          g.id === goal.id 
            ? { ...g, status: 'completed' as const, currentValue: g.targetValue }
            : g
        )
        setGoals(updatedGoals)
        toast({
          title: '🎉 Meta concluída!',
          description: `Parabéns! Você alcançou a meta "${goal.name}".`,
        })
      } else {
        toast({
          title: 'Erro ao concluir meta',
          description: data.error || 'Falha ao concluir a meta',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao concluir meta:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a meta como concluída.',
        variant: 'destructive'
      })
    }
  }

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6" />
                  Metas
                </h1>
                <p className="text-muted-foreground text-sm">
                  Defina e acompanhe seus objetivos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingGoal(undefined)
                  setIsFormOpen(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Meta
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:hidden mb-4">
              <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Menu className="h-4 w-4 mr-2" />
                    Filtros e Configurações
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 h-full">
                  {/* Título acessível exigido pelo Radix Dialog */}
                  <SheetTitle className="sr-only">Filtros e Configurações de Metas</SheetTitle>
                  <GoalsSidebar
                    goals={goals}
                    periodFilter={periodFilter}
                    categoryFilter={categoryFilter}
                    onPeriodFilterChange={setPeriodFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    priorityFilter={priorityFilter}
                    onPriorityFilterChange={setPriorityFilter}
                    className="h-full border-0"
                  />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="hidden lg:block sticky top-4">
              <GoalsSidebar
                goals={goals}
                periodFilter={periodFilter}
                categoryFilter={categoryFilter}
                onPeriodFilterChange={setPeriodFilter}
                onCategoryFilterChange={setCategoryFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={periodFilter} onValueChange={(value) => setPeriodFilter(value as any)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
                <TabsTrigger value="quarter">Trimestre</TabsTrigger>
                <TabsTrigger value="year">Ano</TabsTrigger>
              </TabsList>

              <TabsContent value={periodFilter} className="space-y-6">
                {/* Overview */}
                <GoalsOverview goals={filteredAndSortedGoals} />

                {/* Goals Grid/List */}
                {isLoading ? (
                  <div className="grid gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : filteredAndSortedGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma meta encontrada</h3>
                    <p className="text-muted-foreground mb-4">
                      {goals.length === 0 
                        ? "Comece criando sua primeira meta!"
                        : "Tente ajustar os filtros para encontrar suas metas."
                      }
                    </p>
                    <Button
                      onClick={() => {
                        setEditingGoal(undefined)
                        setIsFormOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Meta
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' 
                      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                      : "grid-cols-1"
                  )}>
                    {filteredAndSortedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDelete={handleDeleteGoal}
                        onUpdateProgress={handleUpdateProgress}
                        onToggleStatus={handleCompleteGoal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Goal Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <GoalForm
            goalToEdit={editingGoal}
            onSave={handleSaveGoal}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingGoal(undefined)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
