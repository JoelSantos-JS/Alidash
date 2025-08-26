"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Target, 
  Calendar, 
  Flag, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Hash,
  Rocket,
  Heart,
  Briefcase,
  Activity,
  BookOpen,
  Star,
  Award,
  Zap,
  Users
} from "lucide-react"
import type { Goal } from "@/types"
import { cn } from "@/lib/utils"

interface GoalCardProps {
  goal: Goal
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  onUpdateProgress?: (goal: Goal, newValue: number) => void
  onToggleStatus?: (goal: Goal) => void
  className?: string
}

const categoryIcons = {
  financial: DollarSign,
  business: Briefcase,
  personal: Heart,
  health: Activity,
  education: BookOpen,
  other: Star
}

const categoryColors = {
  financial: 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  business: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  personal: 'text-pink-600 bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800',
  health: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  education: 'text-purple-600 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  other: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
}

const priorityColors = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
}

const statusConfig = {
  active: { label: 'Ativa', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Rocket },
  paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Pause },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: Trash2 },
  overdue: { label: 'Atrasada', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertTriangle }
}

const unitLabels = {
  BRL: 'R$',
  USD: '$',
  percentage: '%',
  quantity: 'un',
  days: 'dias',
  custom: ''
}

export function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onUpdateProgress, 
  onToggleStatus,
  className 
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const progress = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0
  const isOverdue = new Date(goal.deadline) < new Date() && goal.status === 'active'
  const daysUntilDeadline = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  const CategoryIcon = categoryIcons[goal.category]
  const StatusIcon = statusConfig[goal.status].icon
  
  const formatValue = (value: number) => {
    if (goal.unit === 'BRL' || goal.unit === 'USD') {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: goal.unit === 'BRL' ? 'BRL' : 'USD' 
      })
    }
    return `${value.toLocaleString('pt-BR')}${unitLabels[goal.unit]}`
  }

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getDeadlineStatus = () => {
    if (goal.status === 'completed') return null
    if (isOverdue) return { text: 'Atrasada', color: 'text-red-600' }
    if (daysUntilDeadline <= 3) return { text: `${daysUntilDeadline} dias`, color: 'text-orange-600' }
    if (daysUntilDeadline <= 7) return { text: `${daysUntilDeadline} dias`, color: 'text-yellow-600' }
    return { text: `${daysUntilDeadline} dias`, color: 'text-muted-foreground' }
  }

  const deadlineStatus = getDeadlineStatus()

  return (
    <TooltipProvider>
      <Card className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-pointer",
        isOverdue && "border-red-200 dark:border-red-800",
        goal.status === 'completed' && "border-green-200 dark:border-green-800",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn(
                "p-2 rounded-lg",
                categoryColors[goal.category]
              )}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold truncate">
                  {goal.name}
                </CardTitle>
                {goal.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {goal.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("text-xs", statusConfig[goal.status].color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[goal.status].label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", priorityColors[goal.priority])}>
                    {goal.priority === 'critical' && '🔥'}
                    {goal.priority === 'high' && '⚡'}
                    {goal.priority === 'medium' && '📋'}
                    {goal.priority === 'low' && '📝'}
                    {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(goal)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onToggleStatus && goal.status === 'active' && (
                  <DropdownMenuItem onClick={() => onToggleStatus(goal)}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </DropdownMenuItem>
                )}
                {onToggleStatus && goal.status === 'paused' && (
                  <DropdownMenuItem onClick={() => onToggleStatus(goal)}>
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </DropdownMenuItem>
                )}
                {onToggleStatus && goal.status === 'active' && progress >= 100 && (
                  <DropdownMenuItem onClick={() => onToggleStatus(goal)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Concluída
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(goal)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso</span>
              <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatValue(goal.currentValue)}</span>
                <span>{formatValue(goal.targetValue)}</span>
              </div>
            </div>

            {/* Quick Update Progress */}
            {onUpdateProgress && goal.status === 'active' && (
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    const increment = goal.targetValue * 0.1 // 10% increment
                    onUpdateProgress(goal, Math.min(goal.targetValue, goal.currentValue + increment))
                  }}
                >
                  +10%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    const increment = goal.targetValue * 0.25 // 25% increment
                    onUpdateProgress(goal, Math.min(goal.targetValue, goal.currentValue + increment))
                  }}
                >
                  +25%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => onUpdateProgress(goal, goal.targetValue)}
                >
                  100%
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Prazo</div>
                <div className={cn("text-xs", deadlineStatus?.color || 'text-muted-foreground')}>
                  {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                  {deadlineStatus && (
                    <span className="ml-1">({deadlineStatus.text})</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Tipo</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {goal.type.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Preview */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Marcos</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Menos' : 'Mais'}
                </Button>
              </div>
              
              <div className="space-y-1">
                {(isExpanded ? goal.milestones : goal.milestones.slice(0, 2)).map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      milestone.isCompleted ? "bg-green-500" : "bg-muted-foreground"
                    )} />
                    <span className={cn(
                      milestone.isCompleted && "line-through text-muted-foreground"
                    )}>
                      {milestone.name}
                    </span>
                    <span className="text-muted-foreground ml-auto">
                      {formatValue(milestone.targetValue)}
                    </span>
                  </div>
                ))}
                {!isExpanded && goal.milestones.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{goal.milestones.length - 2} marcos
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {goal.tags && goal.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-1">
                {goal.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                    #{tag}
                  </Badge>
                ))}
                {goal.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    +{goal.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Achievement Badge for Completed Goals */}
        {goal.status === 'completed' && (
          <CardFooter className="pt-0">
            <div className="w-full flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Meta Concluída! 🎉
              </span>
            </div>
          </CardFooter>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <CardFooter className="pt-0">
            <div className="w-full flex items-center justify-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Meta em Atraso
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  )
}