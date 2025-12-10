"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Trophy, 
  Plus,
  ArrowRight,
  Flame,
  CheckCircle2
} from "lucide-react"
import type { Goal } from "@/types"
import { cn } from "@/lib/utils"

interface GoalsWidgetProps {
  goals: Goal[]
  className?: string
}

export function GoalsWidget({ goals, className }: GoalsWidgetProps) {
  const analytics = useMemo(() => {
    if (!goals || goals.length === 0) {
      return {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        overdue: 0,
        avgProgress: 0,
        nearDeadline: 0,
        topGoals: [],
        urgentGoals: [],
        momentum: 0
      }
    }

    const totalGoals = goals.length
    const activeGoals = goals.filter(g => g.status === 'active').length
    const completedGoals = goals.filter(g => g.status === 'completed').length
    const overdue = goals.filter(g => g.status === 'overdue').length
    
    // Average progress
    const avgProgress = totalGoals > 0 
      ? goals.reduce((acc, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
          return acc + Math.min(100, progress)
        }, 0) / totalGoals
      : 0

    // Goals with deadline in next 7 days
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nearDeadline = goals.filter(g => 
      g.status === 'active' && new Date(g.deadline) <= nextWeek
    ).length

    // Top performing goals (highest progress)
    const topGoals = goals
      .filter(g => g.status === 'active')
      .map(goal => {
        const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
        return { ...goal, progress: Math.min(100, progress) }
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)

    // Urgent goals (critical priority or near deadline)
    const urgentGoals = goals
      .filter(g => {
        const isNearDeadline = new Date(g.deadline) <= nextWeek
        return g.status === 'active' && (g.priority === 'critical' || isNearDeadline)
      })
      .slice(0, 2)

    // Momentum (goals completed in last 30 days)
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
      nearDeadline,
      topGoals,
      urgentGoals,
      momentum
    }
  }, [goals])

  const formatValue = (goal: Goal) => {
    if (goal.unit === 'BRL' || goal.unit === 'USD') {
      return goal.currentValue.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: goal.unit === 'BRL' ? 'BRL' : 'USD' 
      })
    }
    const unitLabels = {
      BRL: 'R$',
      USD: '$',
      percentage: '%',
      quantity: 'un',
      days: 'dias',
      custom: ''
    }
    return `${goal.currentValue.toLocaleString('pt-BR')}${unitLabels[goal.unit]}`
  }

  const getDeadlineText = (deadline: Date) => {
    const days = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Amanhã'
    if (days < 0) return `${Math.abs(days)} dias atrás`
    return `${days} dias`
  }

  if (analytics.totalGoals === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso das suas metas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">Nenhuma meta criada</h4>
            <p className="text-muted-foreground mb-4 text-sm">
              Comece definindo suas primeiras metas para acompanhar seu progresso.
            </p>
            <Link href="/metas">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas
              <Badge variant="secondary">{analytics.activeGoals} ativas</Badge>
            </CardTitle>
            <CardDescription>
              {analytics.avgProgress.toFixed(0)}% de progresso médio
            </CardDescription>
          </div>
          <Link href="/metas">
            <Button variant="outline" size="sm">
              Ver Todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.activeGoals}</div>
            <div className="text-xs text-muted-foreground">Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.completedGoals}</div>
            <div className="text-xs text-muted-foreground">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics.momentum.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Momentum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics.nearDeadline}</div>
            <div className="text-xs text-muted-foreground">Urgentes</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso Geral</span>
            <span className="font-bold text-primary">{analytics.avgProgress.toFixed(1)}%</span>
          </div>
          <Progress value={analytics.avgProgress} className="h-2" />
        </div>

        {/* Urgent Goals Alert */}
        {analytics.urgentGoals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              Metas Urgentes
            </div>
            <div className="space-y-2">
              {analytics.urgentGoals.map((goal) => {
                const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
                return (
                  <div key={goal.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{goal.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getDeadlineText(new Date(goal.deadline))}
                        {goal.priority === 'critical' && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">🔥</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{progress.toFixed(0)}%</div>
                      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Performing Goals */}
        {analytics.topGoals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-yellow-600" />
              Melhores Performances
            </div>
            <div className="space-y-2">
              {analytics.topGoals.map((goal, index) => (
                <div key={goal.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{goal.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatValue(goal)} de {goal.targetValue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">{goal.progress.toFixed(0)}%</div>
                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Momentum Indicator */}
        {analytics.momentum > 0 && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium">Momentum Excelente!</div>
                <div className="text-xs text-muted-foreground">
                  {analytics.momentum.toFixed(0)}% das metas concluídas recentemente
                </div>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href="/metas" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Gerenciar Metas
            </Button>
          </Link>
          <Link href="/metas">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
