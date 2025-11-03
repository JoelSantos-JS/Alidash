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
  Users,
  CheckSquare,
  Check,
  Trophy,
  MoreHorizontal,
  PiggyBank,
  Plane,
  Home,
  GraduationCap,
  Dumbbell,
  ShoppingBag,
  Wallet
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
  financial: Wallet,
  business: Briefcase,
  personal: Heart,
  health: Dumbbell,
  education: GraduationCap,
  travel: Plane,
  investment: TrendingUp,
  savings: PiggyBank,
  emergency_fund: PiggyBank,
  purchase: ShoppingBag,
  vacation: Plane,
  home_purchase: Home,
  other: Star
}

const categoryColors = {
  financial: 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  business: 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  personal: 'text-pink-600 bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800',
  health: 'text-red-600 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  education: 'text-purple-600 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  travel: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
  investment: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  savings: 'text-green-600 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  emergency_fund: 'text-orange-600 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
  purchase: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800',
  vacation: 'text-pink-600 bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800',
  home_purchase: 'text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  other: 'text-gray-600 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800'
}

const categoryGradients = {
  financial: 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-950 dark:via-emerald-950 dark:to-green-900 border-green-200 dark:border-green-800',
  business: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 dark:from-blue-950 dark:via-sky-950 dark:to-blue-900 border-blue-200 dark:border-blue-800',
  personal: 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 dark:from-pink-950 dark:via-rose-950 dark:to-pink-900 border-pink-200 dark:border-pink-800',
  health: 'bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-950 dark:via-rose-950 dark:to-red-900 border-red-200 dark:border-red-800',
  education: 'bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-purple-950 dark:via-violet-950 dark:to-purple-900 border-purple-200 dark:border-purple-800',
  travel: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 dark:from-indigo-950 dark:via-blue-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800',
  investment: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950 dark:via-teal-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800',
  savings: 'bg-gradient-to-br from-green-50 via-lime-50 to-green-100 dark:from-green-950 dark:via-lime-950 dark:to-green-900 border-green-200 dark:border-green-800',
  emergency_fund: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-orange-950 dark:via-amber-950 dark:to-orange-900 border-orange-200 dark:border-orange-800',
  purchase: 'bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 dark:from-cyan-950 dark:via-teal-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800',
  vacation: 'bg-gradient-to-br from-pink-50 via-fuchsia-50 to-pink-100 dark:from-pink-950 dark:via-fuchsia-950 dark:to-pink-900 border-pink-200 dark:border-pink-800',
  home_purchase: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-900 border-amber-200 dark:border-amber-800',
  other: 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-950 dark:via-slate-950 dark:to-gray-900 border-gray-200 dark:border-gray-800'
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
  
  const CategoryIcon = categoryIcons[goal.category] || Star
  const statusInfo = statusConfig[goal.status] || statusConfig.active
  const StatusIcon = statusInfo?.icon || Rocket
  
  const formatValue = (value: number | undefined | null) => {
    // Handle undefined, null, or NaN values
    if (value === undefined || value === null || isNaN(value)) {
      return '0'
    }
    
    if (goal.unit === 'BRL' || goal.unit === 'USD') {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: goal.unit === 'BRL' ? 'BRL' : 'USD' 
      })
    }
    return `${value.toLocaleString('pt-BR')}${unitLabels[goal.unit] || ''}`
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
        "group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 overflow-hidden",
        categoryGradients[goal.category] || categoryGradients.other,
        isOverdue && "ring-2 ring-red-400 ring-opacity-50",
        goal.status === 'completed' && "ring-2 ring-green-400 ring-opacity-50",
        "hover:scale-[1.02] hover:shadow-2xl",
        className
      )}>
        <CardHeader className="pb-4 relative">
          {/* Category accent bar */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1",
            categoryColors[goal.category]?.split(' ')[0].replace('text-', 'bg-') || 'bg-gray-600'
          )} />
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={cn(
                "p-3 rounded-xl shadow-sm border-2 border-white/20 backdrop-blur-sm",
                categoryColors[goal.category] || categoryColors.other
              )}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-bold truncate mb-1 text-gray-800 dark:text-gray-100">
                  {goal.name}
                </CardTitle>
                {goal.description && (
                  <CardDescription className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-300">
                    {goal.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={cn("text-xs font-medium shadow-sm", statusInfo?.color || statusConfig.active.color)}>
                    <StatusIcon className="h-3 w-3 mr-1.5" />
                    {statusInfo?.label || statusConfig.active.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs font-medium shadow-sm backdrop-blur-sm", priorityColors[goal.priority] || priorityColors.medium)}>
                    {goal.priority === 'critical' && '🔥'}
                    {goal.priority === 'high' && '⚡'}
                    {goal.priority === 'medium' && '📋'}
                    {goal.priority === 'low' && '📝'}
                    {(goal.priority || 'medium').charAt(0).toUpperCase() + (goal.priority || 'medium').slice(1)}
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

        <CardContent className="pt-0 px-6 pb-6">
          {/* Progress Section */}
          <div className="space-y-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Progresso</span>
              <span className={cn(
                "font-bold text-lg",
                progress >= 100 ? "text-green-600" : 
                progress >= 75 ? "text-blue-600" : 
                progress >= 50 ? "text-yellow-600" : 
                progress >= 25 ? "text-orange-600" : "text-red-600"
              )}>{progress.toFixed(1)}%</span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <Progress value={progress} className={cn(
                  "h-3 rounded-full shadow-inner",
                  progress >= 100 ? "[&>div]:bg-green-500" : 
                  progress >= 75 ? "[&>div]:bg-blue-500" : 
                  progress >= 50 ? "[&>div]:bg-yellow-500" : 
                  progress >= 25 ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"
                )} />
                {progress > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                )}
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 font-medium">
                <span>{formatValue(goal.currentValue)}</span>
                <span>{formatValue(goal.targetValue)}</span>
              </div>
            </div>

            {/* Quick Update Progress */}
            {onUpdateProgress && goal.status === 'active' && (
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-3 text-xs font-medium bg-white/70 hover:bg-white/90 border-white/30 backdrop-blur-sm shadow-sm"
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
                  className="h-7 px-3 text-xs font-medium bg-white/70 hover:bg-white/90 border-white/30 backdrop-blur-sm shadow-sm"
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
                  className="h-7 px-3 text-xs font-medium bg-green-100/70 hover:bg-green-200/90 border-green-200/50 text-green-700 backdrop-blur-sm shadow-sm"
                  onClick={() => onUpdateProgress(goal, goal.targetValue)}
                >
                  ✓ 100%
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-5 bg-white/30" />

          {/* Meta Information */}
          <div className="grid grid-cols-1 gap-4 text-sm bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg shadow-sm border backdrop-blur-sm",
                deadlineStatus?.color?.includes('red') ? 'bg-red-100/80 border-red-200/50 dark:bg-red-900/30 dark:border-red-700/50' :
                deadlineStatus?.color?.includes('yellow') ? 'bg-yellow-100/80 border-yellow-200/50 dark:bg-yellow-900/30 dark:border-yellow-700/50' :
                'bg-blue-100/80 border-blue-200/50 dark:bg-blue-900/30 dark:border-blue-700/50'
              )}>
                <Calendar className={cn(
                  "h-4 w-4",
                  deadlineStatus?.color?.includes('red') ? 'text-red-600 dark:text-red-400' :
                  deadlineStatus?.color?.includes('yellow') ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                )} />
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200">Prazo</div>
                <div className={cn("text-xs font-medium", deadlineStatus?.color || 'text-gray-500 dark:text-gray-400')}>
                  {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                  {deadlineStatus && (
                    <span className="ml-1">({deadlineStatus.text})</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg shadow-sm border backdrop-blur-sm",
                categoryColors[goal.category]?.includes('emerald') ? 'bg-emerald-100/80 border-emerald-200/50 dark:bg-emerald-900/30 dark:border-emerald-700/50' :
                categoryColors[goal.category]?.includes('blue') ? 'bg-blue-100/80 border-blue-200/50 dark:bg-blue-900/30 dark:border-blue-700/50' :
                categoryColors[goal.category]?.includes('purple') ? 'bg-purple-100/80 border-purple-200/50 dark:bg-purple-900/30 dark:border-purple-700/50' :
                categoryColors[goal.category]?.includes('orange') ? 'bg-orange-100/80 border-orange-200/50 dark:bg-orange-900/30 dark:border-orange-700/50' :
                categoryColors[goal.category]?.includes('pink') ? 'bg-pink-100/80 border-pink-200/50 dark:bg-pink-900/30 dark:border-pink-700/50' :
                categoryColors[goal.category]?.includes('green') ? 'bg-green-100/80 border-green-200/50 dark:bg-green-900/30 dark:border-green-700/50' :
                categoryColors[goal.category]?.includes('indigo') ? 'bg-indigo-100/80 border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-700/50' :
                'bg-gray-100/80 border-gray-200/50 dark:bg-gray-700/30 dark:border-gray-600/50'
              )}>
                <CategoryIcon className={cn(
                  "h-4 w-4",
                  categoryColors[goal.category]?.includes('emerald') ? 'text-emerald-600 dark:text-emerald-400' :
                  categoryColors[goal.category]?.includes('blue') ? 'text-blue-600 dark:text-blue-400' :
                  categoryColors[goal.category]?.includes('purple') ? 'text-purple-600 dark:text-purple-400' :
                  categoryColors[goal.category]?.includes('orange') ? 'text-orange-600 dark:text-orange-400' :
                  categoryColors[goal.category]?.includes('pink') ? 'text-pink-600 dark:text-pink-400' :
                  categoryColors[goal.category]?.includes('green') ? 'text-green-600 dark:text-green-400' :
                  categoryColors[goal.category]?.includes('indigo') ? 'text-indigo-600 dark:text-indigo-400' :
                  'text-gray-600 dark:text-gray-400'
                )} />
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-200">Tipo</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">
                  {goal.type?.replace('_', ' ') || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Preview */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="mt-5 bg-gradient-to-br from-white/40 via-white/30 to-white/20 dark:from-gray-800/40 dark:via-gray-800/30 dark:to-gray-800/20 backdrop-blur-sm rounded-xl p-5 border border-white/30 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100/80 border border-indigo-200/50 dark:bg-indigo-900/30 dark:border-indigo-700/50">
                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Marcos</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-indigo-100/60 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200/50">
                    {goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-3 text-xs font-medium bg-white/60 hover:bg-white/80 border border-white/40 backdrop-blur-sm shadow-sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? '▲ Menos' : '▼ Mais'}
                </Button>
              </div>
              
              <div className="space-y-3">
                {(isExpanded ? goal.milestones : goal.milestones.slice(0, 2)).map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-3 text-xs bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg p-3 border border-white/30 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 w-5 text-center">
                        {index + 1}
                      </div>
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        milestone.isCompleted 
                          ? "bg-green-500 border-green-500 shadow-sm" 
                          : "bg-transparent border-gray-400 dark:border-gray-500"
                      )}>
                        {milestone.isCompleted && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "flex-1 font-medium",
                      milestone.isCompleted 
                        ? "line-through text-gray-500 dark:text-gray-400" 
                        : "text-gray-700 dark:text-gray-200"
                    )}>
                      {milestone.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {formatValue(milestone.targetValue)}
                      </span>
                      {milestone.isCompleted && (
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Trophy className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!isExpanded && goal.milestones.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 bg-white/30 dark:bg-gray-700/30 rounded-lg border border-white/20">
                    <MoreHorizontal className="h-4 w-4 mx-auto mb-1" />
                    +{goal.milestones.length - 2} marcos adicionais
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {goal.tags && goal.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-100/80 border border-purple-200/50 dark:bg-purple-900/30 dark:border-purple-700/50">
                  <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {goal.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-3 py-1.5 font-medium backdrop-blur-sm border shadow-sm",
                      index === 0 ? "bg-blue-100/70 text-blue-700 border-blue-200/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50" :
                      index === 1 ? "bg-green-100/70 text-green-700 border-green-200/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50" :
                      "bg-purple-100/70 text-purple-700 border-purple-200/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50"
                    )}
                  >
                    #{tag}
                  </Badge>
                ))}
                {goal.tags.length > 3 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-3 py-1.5 bg-gray-100/70 text-gray-700 border-gray-200/50 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600/50 font-medium backdrop-blur-sm border shadow-sm"
                  >
                    +{goal.tags.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Achievement Badge for Completed Goals */}
        {goal.status === 'completed' && (
          <CardFooter className="pt-0 pb-4">
            <div className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 dark:from-green-900 dark:via-emerald-900 dark:to-green-900 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-sm">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-bold text-green-700 dark:text-green-300">
                Meta Concluída! 🎉
              </span>
            </div>
          </CardFooter>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <CardFooter className="pt-0 pb-4">
            <div className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-red-100 via-orange-100 to-red-100 dark:from-red-900 dark:via-orange-900 dark:to-red-900 rounded-xl border-2 border-red-200 dark:border-red-700 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-bold text-red-700 dark:text-red-300">
                Meta em Atraso ⚠️
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
    </TooltipProvider>
  )
}