"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useDualSync } from '@/lib/dual-database-sync'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
  
  // Hook de sincronização dual com prioridade no Supabase
  const dualSync = useDualSync(user?.uid || '', 'SUPABASE_PRIORITY')
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Carregar dados reais do Firebase
  useEffect(() => {
    if (authLoading || !user) return

    const fetchData = async () => {
      try {
        console.log('🎯 Carregando dados para metas do usuário:', user.uid)
        
        // Carregar produtos do Firebase
        const docRef = doc(db, "user-data", user.uid)
        const docSnap = await getDoc(docRef)

        let userProducts: Product[] = []
        let userGoals: Goal[] = []

        if (docSnap.exists()) {
          const userData = docSnap.data()
          console.log('📦 Dados encontrados:', {
            products: userData.products?.length || 0,
            goals: userData.goals?.length || 0
          })
          
          // Carregar produtos
          if (userData.products && userData.products.length > 0) {
            userProducts = userData.products.map((p: any) => ({
              ...p,
              purchaseDate: p.purchaseDate?.toDate ? p.purchaseDate.toDate() : new Date(p.purchaseDate),
              sales: p.sales ? p.sales.map((s: any) => ({
                ...s, 
                date: s.date?.toDate ? s.date.toDate() : 
                      typeof s.date === 'string' ? new Date(s.date) : 
                      new Date(s.date)
              })) : [],
            }))
          }
          
          // Carregar metas existentes
          if (userData.goals && userData.goals.length > 0) {
            userGoals = userData.goals.map((g: any) => ({
              ...g,
              deadline: g.deadline?.toDate ? g.deadline.toDate() : new Date(g.deadline),
              createdDate: g.createdDate?.toDate ? g.createdDate.toDate() : new Date(g.createdDate),
              milestones: g.milestones ? g.milestones.map((m: any) => ({
                ...m,
                targetDate: m.targetDate?.toDate ? m.targetDate.toDate() : new Date(m.targetDate),
                completedDate: m.completedDate?.toDate ? m.completedDate.toDate() : m.completedDate ? new Date(m.completedDate) : undefined
              })) : []
            }))
          }
        }

        setProducts(userProducts)
        
        // Se não há metas salvas, gerar baseadas nos produtos
        if (userGoals.length === 0) {
          console.log('🎯 Gerando metas baseadas nos produtos')
          userGoals = generateGoalsFromProducts(userProducts)
          
          // Salvar metas geradas no Firebase
          if (userGoals.length > 0) {
            const updatedData = {
              ...docSnap.exists() ? docSnap.data() : {},
              goals: userGoals.map(goal => ({
                ...goal,
                deadline: goal.deadline,
                createdDate: goal.createdDate
              }))
            }
            await setDoc(docRef, updatedData, { merge: true })
            console.log('💾 Metas salvas no Firebase')
          }
        }
        
        setGoals(userGoals)
        
        toast({
          title: "Metas carregadas",
          description: `${userGoals.length} meta${userGoals.length !== 1 ? 's' : ''} ${userGoals.length === 0 ? 'criada' : 'carregada'}${userGoals.length > 1 ? 's' : ''} com base nos seus produtos`,
          duration: 3000,
        })
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error)
        toast({
          title: "Erro ao carregar metas",
          description: "Não foi possível carregar suas metas. Tente novamente.",
          variant: "destructive",
        })
        
        // Usar metas de exemplo em caso de erro
        const fallbackGoals = generateGoalsFromProducts([])
        setGoals(fallbackGoals)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [authLoading, user, toast])

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
        // Update existing goal
        const updatedGoal = { ...editingGoal, ...goalData }
        updatedGoals = goals.map(goal => 
          goal.id === editingGoal.id ? updatedGoal : goal
        )
        
        // Usar sincronização dual para atualizar
        try {
          const result = await dualSync.updateGoal(editingGoal.id, goalData)
          
          if (result.success) {
            setGoals(updatedGoals)
            console.log(`✅ Meta atualizada - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
            
            toast({
              title: "Meta atualizada",
              description: `${goalData.name} - Supabase: ${result.supabaseSuccess ? '✅' : '❌'} | Firebase: ${result.firebaseSuccess ? '✅' : '❌'}`,
            })
          } else {
            toast({
              title: "Erro ao atualizar meta",
              description: `Falha na sincronização: ${result.errors.join(', ')}`,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Erro na sincronização dual:', error)
          toast({
            title: "Erro ao atualizar meta",
            description: "Não foi possível atualizar a meta. Tente novamente.",
            variant: "destructive",
          })
        }
      } else {
        // Create new goal
        const newGoal: Goal = {
          ...goalData,
          id: Date.now().toString(),
          createdDate: new Date(),
          milestones: [],
          reminders: [],
          linkedEntities: {}
        }
        
        // Usar sincronização dual para criar
        try {
          const goalDataWithCreatedDate = {
            ...goalData,
            createdDate: new Date(),
            linkedEntities: {}
          }
          
          const result = await dualSync.createGoal(goalDataWithCreatedDate)
          
          if (result.success) {
            updatedGoals = [...goals, newGoal]
            setGoals(updatedGoals)
            console.log(`✅ Meta criada - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
            
            toast({
              title: "Meta criada",
              description: `${goalData.name} foi criada com sucesso!`,
            })
          } else {
            toast({
              title: "Erro ao criar meta",
              description: `Falha na sincronização: ${result.errors.join(', ')}`,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Erro na sincronização dual:', error)
          toast({
            title: "Erro ao criar meta",
            description: "Não foi possível criar a meta. Tente novamente.",
            variant: "destructive",
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
        // Usar sincronização dual para deletar
        const result = await dualSync.deleteGoal(goal.id)
        
        if (result.success) {
          const updatedGoals = goals.filter(g => g.id !== goal.id)
          setGoals(updatedGoals)
          console.log(`✅ Meta deletada - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
          
          toast({
            title: "Meta excluída",
            description: `${goal.name} - Supabase: ${result.supabaseSuccess ? '✅' : '❌'} | Firebase: ${result.firebaseSuccess ? '✅' : '❌'}`,
          })
        } else {
          toast({
            title: "Erro ao excluir meta",
            description: `Falha na sincronização: ${result.errors.join(', ')}`,
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro ao excluir meta:', error)
        toast({
          title: "Erro",
          description: "Não foi possível excluir a meta.",
          variant: "destructive"
        })
      }
    }
  }

  // Função para atualizar progresso de uma meta
  const handleUpdateProgress = async (goal: Goal, newCurrentValue: number) => {
    try {
      // Usar sincronização dual para atualizar progresso
      const result = await dualSync.updateGoal(goal.id, { currentValue: newCurrentValue })
      
      if (result.success) {
        const updatedGoals = goals.map(g => 
          g.id === goal.id 
            ? { ...g, currentValue: newCurrentValue }
            : g
        )
        setGoals(updatedGoals)
        console.log(`✅ Progresso atualizado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
        
        toast({
          title: "Progresso atualizado",
          description: `${goal.name} - Progresso: ${((newCurrentValue / goal.targetValue) * 100).toFixed(1)}%`,
        })
      } else {
        toast({
          title: "Erro ao atualizar progresso",
          description: `Falha na sincronização: ${result.errors.join(', ')}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso.",
        variant: "destructive"
      })
    }
  }

  // Função para marcar meta como concluída
  const handleCompleteGoal = async (goal: Goal) => {
    try {
      // Usar sincronização dual para marcar como concluída
      const result = await dualSync.updateGoal(goal.id, { 
        status: 'completed' as const, 
        currentValue: goal.targetValue 
      })
      
      if (result.success) {
        const updatedGoals = goals.map(g => 
          g.id === goal.id 
            ? { ...g, status: 'completed' as const, currentValue: g.targetValue }
            : g
        )
        setGoals(updatedGoals)
        console.log(`✅ Meta concluída - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
        
        toast({
          title: "🎉 Meta concluída!",
          description: `Parabéns! Você alcançou a meta "${goal.name}".`,
        })
      } else {
        toast({
          title: "Erro ao concluir meta",
          description: `Falha na sincronização: ${result.errors.join(', ')}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao concluir meta:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a meta como concluída.",
        variant: "destructive"
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
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
                <SheetContent side="left" className="w-80">
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
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="hidden lg:block">
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