"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { 
  Flag, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon,
  Gift,
  Target,
  Trophy,
  Clock,
  MoreVertical
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Goal, GoalMilestone } from "@/types"
import { cn } from "@/lib/utils"

interface GoalMilestonesProps {
  goal: Goal
  onUpdateMilestones: (milestones: GoalMilestone[]) => void
  className?: string
}

interface MilestoneFormData {
  name: string
  targetValue: number
  targetDate: Date
  reward?: string
  notes?: string
}

export function GoalMilestones({ goal, onUpdateMilestones, className }: GoalMilestonesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<GoalMilestone | undefined>()
  const [formData, setFormData] = useState<MilestoneFormData>({
    name: '',
    targetValue: 0,
    targetDate: new Date(),
    reward: '',
    notes: ''
  })

  const milestones = goal.milestones || []
  const sortedMilestones = [...milestones].sort((a, b) => a.targetValue - b.targetValue)
  
  const completedMilestones = milestones.filter(m => m.isCompleted).length
  const totalMilestones = milestones.length
  const milestonesProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

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
    const unitLabels = {
      BRL: 'R$',
      USD: '$',
      percentage: '%',
      quantity: 'un',
      days: 'dias',
      custom: ''
    }
    return `${value.toLocaleString('pt-BR')}${unitLabels[goal.unit] || ''}`
  }

  const openCreateForm = () => {
    setEditingMilestone(undefined)
    setFormData({
      name: '',
      targetValue: goal.currentValue,
      targetDate: new Date(),
      reward: '',
      notes: ''
    })
    setIsFormOpen(true)
  }

  const openEditForm = (milestone: GoalMilestone) => {
    setEditingMilestone(milestone)
    setFormData({
      name: milestone.name || '',
      targetValue: milestone.targetValue || 0,
      targetDate: new Date(milestone.targetDate),
      reward: milestone.reward || '',
      notes: milestone.notes || ''
    })
    setIsFormOpen(true)
  }

  const handleSaveMilestone = () => {
    if (!formData.name.trim() || formData.targetValue <= 0) return

    const newMilestone: GoalMilestone = {
      id: editingMilestone?.id || Date.now().toString(),
      goalId: goal.id,
      name: formData.name.trim(),
      targetValue: formData.targetValue,
      targetDate: formData.targetDate,
      isCompleted: editingMilestone?.isCompleted || false,
      completedDate: editingMilestone?.completedDate,
      reward: formData.reward?.trim() || undefined,
      notes: formData.notes?.trim() || undefined
    }

    let updatedMilestones
    if (editingMilestone) {
      updatedMilestones = milestones.map(m => 
        m.id === editingMilestone.id ? newMilestone : m
      )
    } else {
      updatedMilestones = [...milestones, newMilestone]
    }

    onUpdateMilestones(updatedMilestones)
    setIsFormOpen(false)
  }

  const handleDeleteMilestone = (milestone: GoalMilestone) => {
    if (confirm(`Tem certeza que deseja excluir o marco "${milestone.name}"?`)) {
      const updatedMilestones = milestones.filter(m => m.id !== milestone.id)
      onUpdateMilestones(updatedMilestones)
    }
  }

  const handleToggleComplete = (milestone: GoalMilestone) => {
    const updatedMilestone = {
      ...milestone,
      isCompleted: !milestone.isCompleted,
      completedDate: !milestone.isCompleted ? new Date() : undefined
    }
    
    const updatedMilestones = milestones.map(m => 
      m.id === milestone.id ? updatedMilestone : m
    )
    
    onUpdateMilestones(updatedMilestones)
  }

  const getNextMilestone = () => {
    return sortedMilestones.find(m => !m.isCompleted && m.targetValue > goal.currentValue)
  }

  const getCurrentMilestone = () => {
    return sortedMilestones.find(m => 
      !m.isCompleted && 
      m.targetValue >= goal.currentValue && 
      (goal.currentValue / m.targetValue) >= 0.1
    )
  }

  const nextMilestone = getNextMilestone()
  const currentMilestone = getCurrentMilestone()

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Marcos da Meta</h3>
          {totalMilestones > 0 && (
            <Badge variant="secondary">
              {completedMilestones}/{totalMilestones}
            </Badge>
          )}
        </div>
        <Button onClick={openCreateForm} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Marco
        </Button>
      </div>

      {/* Progress Summary */}
      {totalMilestones > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progresso dos Marcos</CardTitle>
              <span className="text-sm font-bold text-primary">
                {milestonesProgress.toFixed(0)}%
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={milestonesProgress} className="mb-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{completedMilestones}</div>
                <div className="text-xs text-muted-foreground">Concluídos</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {totalMilestones - completedMilestones}
                </div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{totalMilestones}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Milestone Highlight */}
      {nextMilestone && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Target className="h-4 w-4" />
              Próximo Marco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{nextMilestone.name}</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {formatValue(nextMilestone.targetValue)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">
                    {((goal.currentValue / nextMilestone.targetValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(goal.currentValue / nextMilestone.targetValue) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatValue(goal.currentValue)}</span>
                  <span>{formatValue(nextMilestone.targetValue)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(new Date(nextMilestone.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                {nextMilestone.reward && (
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {nextMilestone.reward}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      {totalMilestones === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">Nenhum marco criado</h4>
            <p className="text-muted-foreground mb-4">
              Crie marcos para dividir sua meta em etapas menores e mais gerenciáveis.
            </p>
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Marco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => {
            const isNext = milestone.id === nextMilestone?.id
            const progress = goal.currentValue >= milestone.targetValue ? 100 : 
                           (goal.currentValue / milestone.targetValue) * 100
            const daysUntil = Math.ceil(
              (new Date(milestone.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            const isOverdue = daysUntil < 0 && !milestone.isCompleted

            return (
              <Card 
                key={milestone.id} 
                className={cn(
                  "transition-all hover:shadow-md",
                  milestone.isCompleted && "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950",
                  isNext && !milestone.isCompleted && "border-blue-200 dark:border-blue-800",
                  isOverdue && "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mt-1"
                        onClick={() => handleToggleComplete(milestone)}
                      >
                        {milestone.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            milestone.isCompleted && "line-through text-muted-foreground"
                          )}>
                            {milestone.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatValue(milestone.targetValue)}
                          </Badge>
                          {isNext && (
                            <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Próximo
                            </Badge>
                          )}
                        </div>
                        
                        {!milestone.isCompleted && (
                          <div className="space-y-1">
                            <Progress value={progress} className="h-1" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{progress.toFixed(1)}% concluído</span>
                              <span>
                                {isOverdue ? (
                                  <span className="text-red-600 font-medium">
                                    {Math.abs(daysUntil)} dias em atraso
                                  </span>
                                ) : (
                                  `${daysUntil} dias restantes`
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(milestone.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          {milestone.reward && (
                            <div className="flex items-center gap-1">
                              <Gift className="h-3 w-3" />
                              {milestone.reward}
                            </div>
                          )}
                          {milestone.isCompleted && milestone.completedDate && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Trophy className="h-3 w-3" />
                              Concluído em {format(new Date(milestone.completedDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                        </div>
                        
                        {milestone.notes && (
                          <p className="text-xs text-muted-foreground">
                            {milestone.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(milestone)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleComplete(milestone)}
                        >
                          {milestone.isCompleted ? (
                            <>
                              <Circle className="h-4 w-4 mr-2" />
                              Marcar como Pendente
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Concluído
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMilestone(milestone)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Milestone Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Editar Marco' : 'Novo Marco'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Marco *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Primeiro terço da meta"
              />
            </div>
            
            <div>
              <Label htmlFor="targetValue">Valor Alvo *</Label>
              <Input
                id="targetValue"
                type="number"
                step={goal.unit === 'BRL' || goal.unit === 'USD' ? "0.01" : "1"}
                value={formData.targetValue}
                onChange={(e) => setFormData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label>Data Alvo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? (
                      format(formData.targetDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.targetDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, targetDate: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="reward">Recompensa</Label>
              <Input
                id="reward"
                value={formData.reward}
                onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
                placeholder="Ex: Jantar especial, presente"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre este marco..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMilestone}>
              {editingMilestone ? 'Atualizar' : 'Criar'} Marco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}