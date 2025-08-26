"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  Flame, 
  Award,
  Calendar,
  Activity,
  Zap,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Heart,
  BookOpen,
  Star
} from "lucide-react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import type { Goal } from "@/types"
import { cn } from "@/lib/utils"

interface GoalsOverviewProps {
  goals: Goal[]
  className?: string
}

const categoryColors = {
  financial: '#10b981', // green
  business: '#3b82f6', // blue
  personal: '#ec4899', // pink
  health: '#ef4444', // red
  education: '#8b5cf6', // purple
  other: '#f59e0b' // yellow
}

const categoryIcons = {
  financial: DollarSign,
  business: Briefcase,
  personal: Heart,
  health: Activity,
  education: BookOpen,
  other: Star
}

const priorityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#10b981'
}

export function GoalsOverview({ goals, className }: GoalsOverviewProps) {
  const analytics = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        overdue: 0,
        avgProgress: 0,
        completionRate: 0,
        categoryStats: [],
        priorityStats: [],
        progressDistribution: [],
        monthlyProgress: [],
        upcomingDeadlines: [],
        topPerformers: [],
        momentum: 0
      }
    }

    const totalGoals = goals.length
    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length
    const overdue = goals.filter(g => g.status === 'overdue').length
    
    // Average progress calculation
    const avgProgress = totalGoals > 0 
      ? goals.reduce((acc, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
          return acc + Math.min(100, progress)
        }, 0) / totalGoals
      : 0

    // Completion rate
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

    // Category statistics
    const categoryStats = Object.entries(
      goals.reduce((acc, goal) => {
        const category = goal.category
        if (!acc[category]) {
          acc[category] = { count: 0, completed: 0, avgProgress: 0, totalProgress: 0 }
        }
        acc[category].count++
        if (goal.status === 'completed') acc[category].completed++
        
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
        acc[category].totalProgress += Math.min(100, progress)
        return acc
      }, {} as Record<string, { count: number; completed: number; avgProgress: number; totalProgress: number }>)
    ).map(([category, stats]) => ({
      category,
      count: stats.count,
      completed: stats.completed,
      avgProgress: stats.count > 0 ? stats.totalProgress / stats.count : 0,
      completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
      color: categoryColors[category as keyof typeof categoryColors]
    }))

    // Priority statistics
    const priorityStats = Object.entries(
      goals.reduce((acc, goal) => {
        const priority = goal.priority
        if (!acc[priority]) {
          acc[priority] = { count: 0, completed: 0 }
        }
        acc[priority].count++
        if (goal.status === 'completed') acc[priority].completed++
        return acc
      }, {} as Record<string, { count: number; completed: number }>)
    ).map(([priority, stats]) => ({
      priority,
      count: stats.count,
      completed: stats.completed,
      completionRate: stats.count > 0 ? (stats.completed / stats.count) * 100 : 0,
      color: priorityColors[priority as keyof typeof priorityColors]
    }))

    // Progress distribution
    const progressDistribution = [
      { range: '0-25%', count: 0, color: '#ef4444' },
      { range: '26-50%', count: 0, color: '#f97316' },
      { range: '51-75%', count: 0, color: '#eab308' },
      { range: '76-99%', count: 0, color: '#3b82f6' },
      { range: '100%', count: 0, color: '#10b981' }
    ]

    goals.forEach(goal => {
      const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
      if (progress === 100) progressDistribution[4].count++
      else if (progress >= 76) progressDistribution[3].count++
      else if (progress >= 51) progressDistribution[2].count++
      else if (progress >= 26) progressDistribution[1].count++
      else progressDistribution[0].count++
    })

    // Upcoming deadlines (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const upcomingDeadlines = goals
      .filter(g => g.status === 'active' && new Date(g.deadline) <= thirtyDaysFromNow)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
      .map(goal => {
        const daysUntil = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
        return {
          ...goal,
          daysUntil,
          progress: Math.min(100, progress)
        }
      })

    // Top performers (highest progress)
    const topPerformers = goals
      .filter(g => g.status === 'active')
      .map(goal => {
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
        return { ...goal, progress: Math.min(100, progress) }
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)

    // Momentum calculation (goals completed in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCompletions = goals.filter(g => 
      g.status === 'completed' && new Date(g.createdDate) >= thirtyDaysAgo
    ).length
    const momentum = (recentCompletions / Math.max(1, totalGoals)) * 100

    // Monthly progress simulation (last 6 months)
    const monthlyProgress = Array.from({ length: 6 }, (_, i) => {
      const month = new Date()
      month.setMonth(month.getMonth() - (5 - i))
      return {
        month: month.toLocaleDateString('pt-BR', { month: 'short' }),
        completed: Math.floor(Math.random() * 5) + 1, // Simulated data
        created: Math.floor(Math.random() * 8) + 2 // Simulated data
      }
    })

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      overdue,
      avgProgress,
      completionRate,
      categoryStats,
      priorityStats,
      progressDistribution,
      monthlyProgress,
      upcomingDeadlines,
      topPerformers,
      momentum
    }
  }, [goals])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeGoals} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.completedGoals} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgProgress.toFixed(1)}%</div>
            <Progress value={analytics.avgProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Momentum</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.momentum.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overdue > 0 && `${analytics.overdue} atrasadas`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
            <CardDescription>
              Progresso médio por categoria de meta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const categoryNames = {
                        financial: 'Financeiro',
                        business: 'Negócios',
                        personal: 'Pessoal',
                        health: 'Saúde',
                        education: 'Educação',
                        other: 'Outros'
                      }
                      return categoryNames[value as keyof typeof categoryNames] || value
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Number(value).toFixed(1)}%`, 
                      name === 'avgProgress' ? 'Progresso Médio' : 'Taxa de Conclusão'
                    ]}
                    labelFormatter={(label) => {
                      const categoryNames = {
                        financial: 'Financeiro',
                        business: 'Negócios',
                        personal: 'Pessoal',
                        health: 'Saúde',
                        education: 'Educação',
                        other: 'Outros'
                      }
                      return categoryNames[label as keyof typeof categoryNames] || label
                    }}
                  />
                  <Bar dataKey="avgProgress" fill="#3b82f6" name="Progresso Médio" />
                  <Bar dataKey="completionRate" fill="#10b981" name="Taxa de Conclusão" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Distribuição de Progresso
            </CardTitle>
            <CardDescription>
              Quantas metas estão em cada faixa de progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.progressDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {analytics.progressDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: string, props: any) => [
                    `${value} metas`,
                    props.payload.range
                  ]} />
                  <Legend 
                    formatter={(value, entry: any) => entry.payload.range}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Prazos
            </CardTitle>
            <CardDescription>
              Metas com prazo nos próximos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma meta com prazo próximo
                </p>
              ) : (
                analytics.upcomingDeadlines.map((goal) => {
                  const CategoryIcon = categoryIcons[goal.category]
                  return (
                    <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          `bg-${goal.category === 'financial' ? 'green' : 
                               goal.category === 'business' ? 'blue' : 
                               goal.category === 'personal' ? 'pink' : 
                               goal.category === 'health' ? 'red' : 
                               goal.category === 'education' ? 'purple' : 'yellow'}-50`
                        )}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{goal.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {goal.daysUntil === 0 ? 'Hoje' : 
                             goal.daysUntil === 1 ? 'Amanhã' : 
                             `${goal.daysUntil} dias`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{goal.progress.toFixed(0)}%</div>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Melhores Performances
            </CardTitle>
            <CardDescription>
              Metas com maior progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma meta ativa encontrada
                </p>
              ) : (
                analytics.topPerformers.map((goal, index) => {
                  const CategoryIcon = categoryIcons[goal.category]
                  return (
                    <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className={cn(
                          "p-2 rounded-lg",
                          `bg-${goal.category === 'financial' ? 'green' : 
                               goal.category === 'business' ? 'blue' : 
                               goal.category === 'personal' ? 'pink' : 
                               goal.category === 'health' ? 'red' : 
                               goal.category === 'education' ? 'purple' : 'yellow'}-50`
                        )}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{goal.name}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {goal.priority === 'critical' && '🔥'}
                            {goal.priority === 'high' && '⚡'}
                            {goal.priority === 'medium' && '📋'}
                            {goal.priority === 'low' && '📝'}
                            {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{goal.progress.toFixed(0)}%</div>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all" 
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(analytics.overdue > 0 || analytics.upcomingDeadlines.length > 3) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.overdue > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção Necessária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você tem <strong>{analytics.overdue}</strong> meta{analytics.overdue > 1 ? 's' : ''} em atraso. 
                  Considere revisar os prazos ou ajustar as expectativas.
                </p>
              </CardContent>
            </Card>
          )}
          
          {analytics.upcomingDeadlines.length > 3 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-5 w-5" />
                  Agenda Intensa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você tem <strong>{analytics.upcomingDeadlines.length}</strong> metas com prazo próximo. 
                  Considere priorizar as mais importantes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}