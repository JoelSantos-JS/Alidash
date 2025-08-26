"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
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
        updatedGoals = goals.map(goal => 
          goal.id === editingGoal.id 
            ? { ...goal, ...goalData }
            : goal
        )
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
        updatedGoals = [...goals, newGoal]
      }
      
      setGoals(updatedGoals)
      
      // Salvar no Firebase
      if (user) {
        const docRef = doc(db, "user-data", user.uid)
        const docSnap = await getDoc(docRef)
        const existingData = docSnap.exists() ? docSnap.data() : {}
        
        const updatedData = {
          ...existingData,
          goals: updatedGoals.map(goal => ({
            ...goal,
            deadline: goal.deadline,
            createdDate: goal.createdDate
          }))
        }
        
        await setDoc(docRef, updatedData, { merge: true })
        
        toast({
          title: editingGoal ? "Meta atualizada" : "Meta criada",
          description: `A meta "${goalData.name}" foi ${editingGoal ? 'atualizada' : 'criada'} com sucesso.`,
        })
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
        const updatedGoals = goals.filter(g => g.id !== goal.id)
        setGoals(updatedGoals)
        
        // Salvar no Firebase
        if (user) {
          const docRef = doc(db, "user-data", user.uid)
          const docSnap = await getDoc(docRef)
          const existingData = docSnap.exists() ? docSnap.data() : {}
          
          const updatedData = {
            ...existingData,
            goals: updatedGoals.map(goal => ({
              ...goal,
              deadline: goal.deadline,
              createdDate: goal.createdDate
            }))
          }
          
          await setDoc(docRef, updatedData, { merge: true })
          
          toast({
            title: "Meta excluída",
            description: `A meta "${goal.name}" foi excluída com sucesso.`,
          })
        }
      } catch (error) {
        console.error('❌ Erro ao excluir meta:', error)
        toast({
          title: "Erro ao excluir meta",
          description: "Não foi possível excluir a meta. Tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const handleUpdateProgress = async (goal: Goal, newValue: number) => {
    try {
      const updatedGoals = goals.map(g => 
        g.id === goal.id 
          ? { ...g, currentValue: newValue }
          : g
      )
      setGoals(updatedGoals)
      
      // Salvar no Firebase
      if (user) {
        const docRef = doc(db, "user-data", user.uid)
        const docSnap = await getDoc(docRef)
        const existingData = docSnap.exists() ? docSnap.data() : {}
        
        const updatedData = {
          ...existingData,
          goals: updatedGoals.map(goal => ({
            ...goal,
            deadline: goal.deadline,
            createdDate: goal.createdDate
          }))
        }
        
        await setDoc(docRef, updatedData, { merge: true })
        
        const progress = goal.targetValue > 0 ? (newValue / goal.targetValue) * 100 : 0
        toast({
          title: "Progresso atualizado",
          description: `Meta "${goal.name}" agora está ${progress.toFixed(1)}% concluída.`,
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar progresso:', error)
      toast({
        title: "Erro ao atualizar progresso",
        description: "Não foi possível atualizar o progresso. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (goal: Goal) => {
    let newStatus: Goal['status']
    
    switch (goal.status) {
      case 'active':
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
        newStatus = progress >= 100 ? 'completed' : 'paused'
        break
      case 'paused':
        newStatus = 'active'
        break
      default:
        return
    }
    
    try {
      const updatedGoals = goals.map(g => 
        g.id === goal.id 
          ? { ...g, status: newStatus }
          : g
      )
      setGoals(updatedGoals)
      
      // Salvar no Firebase
      if (user) {
        const docRef = doc(db, "user-data", user.uid)
        const docSnap = await getDoc(docRef)
        const existingData = docSnap.exists() ? docSnap.data() : {}
        
        const updatedData = {
          ...existingData,
          goals: updatedGoals.map(goal => ({
            ...goal,
            deadline: goal.deadline,
            createdDate: goal.createdDate
          }))
        }
        
        await setDoc(docRef, updatedData, { merge: true })
        
        const statusLabels = {
          active: 'ativada',
          paused: 'pausada',
          completed: 'concluída',
          cancelled: 'cancelada',
          overdue: 'marcada como atrasada'
        }
        
        toast({
          title: "Status atualizado",
          description: `Meta "${goal.name}" foi ${statusLabels[newStatus]}.`,
        })
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error)
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status da meta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const openCreateForm = () => {
    setEditingGoal(undefined)
    setIsFormOpen(true)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <GoalsSidebar
          goals={goals}
          periodFilter={periodFilter}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onPeriodFilterChange={setPeriodFilter}
          onCategoryFilterChange={setCategoryFilter}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onCreateGoal={openCreateForm}
          onExport={() => console.log('Export goals')}
          onRefresh={() => console.log('Refresh goals')}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              
              {/* Mobile Filters Button */}
              <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="md:hidden flex items-center gap-2"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="text-xs">Filtros</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <GoalsSidebar
                    goals={goals}
                    periodFilter={periodFilter}
                    categoryFilter={categoryFilter}
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    onPeriodFilterChange={setPeriodFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    onStatusFilterChange={setStatusFilter}
                    onPriorityFilterChange={setPriorityFilter}
                    onCreateGoal={() => {
                      setIsMobileFiltersOpen(false)
                      openCreateForm()
                    }}
                    onExport={() => console.log('Export goals')}
                    onRefresh={() => console.log('Refresh goals')}
                  />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <h1 className="text-lg md:text-2xl font-bold">Metas</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filteredAndSortedGoals.length} de {goals.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar metas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 xl:w-64"
                />
              </div>
              
              {/* Sort - Hidden on mobile */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-24 md:w-32 lg:w-40 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Prazo</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="priority">Prioridade</SelectItem>
                  <SelectItem value="created">Criação</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-8 w-8 p-0"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-3 w-3 md:h-4 md:w-4" /> : <SortDesc className="h-3 w-3 md:h-4 md:w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="h-8 w-8 p-0 hidden sm:flex"
              >
                {viewMode === 'grid' ? <List className="h-3 w-3 md:h-4 md:w-4" /> : <LayoutGrid className="h-3 w-3 md:h-4 md:w-4" />}
              </Button>
              
              <Button onClick={openCreateForm} size="sm" className="text-xs md:text-sm">
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Nova Meta</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 md:p-6">
            {isLoading ? (
              <div className="space-y-4 md:space-y-6">
                {/* Loading Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-4">
                    <Skeleton className="h-6 md:h-8 w-24 md:w-32" />
                    <Skeleton className="h-5 md:h-6 w-12 md:w-16" />
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Skeleton className="h-7 md:h-8 w-20 md:w-32" />
                    <Skeleton className="h-7 md:h-8 w-7 md:w-8" />
                    <Skeleton className="h-7 md:h-8 w-16 md:w-24" />
                  </div>
                </div>
                
                {/* Loading Tabs */}
                <div className="flex gap-2">
                  <Skeleton className="h-8 md:h-10 w-24 md:w-32" />
                  <Skeleton className="h-8 md:h-10 w-20 md:w-32" />
                </div>
                
                {/* Loading Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2 md:space-y-4">
                      <Skeleton className="h-40 md:h-48 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Tabs defaultValue="goals" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger value="goals" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Metas ({filteredAndSortedGoals.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <GoalsOverview goals={goals} />
                </TabsContent>

                <TabsContent value="goals" className="space-y-6">
                  {filteredAndSortedGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Target className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {goals.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {goals.length === 0 
                          ? 'Comece criando sua primeira meta para acompanhar seu progresso.'
                          : 'Tente ajustar os filtros ou termo de busca.'
                        }
                      </p>
                      {goals.length === 0 && (
                        <Button onClick={openCreateForm}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Meta
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
                        : "space-y-3 md:space-y-4"
                    )}>
                      {filteredAndSortedGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={handleEditGoal}
                          onDelete={handleDeleteGoal}
                          onUpdateProgress={handleUpdateProgress}
                          onToggleStatus={handleToggleStatus}
                          className={viewMode === 'list' ? 'max-w-none' : ''}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Goal Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <GoalForm
            onSave={handleSaveGoal}
            goalToEdit={editingGoal}
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