"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  TrendingUp, 
  Home,
  Plane,
  Shield,
  DollarSign
} from "lucide-react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip
} from "recharts"

interface GoalProgress {
  id: string
  name: string
  currentValue: number
  targetValue: number
  progress: number
  color: string
  icon?: React.ComponentType<any>
}

interface CircularProgressChartProps {
  goals: GoalProgress[]
  title?: string
  description?: string
  className?: string
}

const goalIcons = {
  'reforma': Home,
  'viagem': Plane,
  'reserva': Shield,
  'investimento': DollarSign,
  'default': Target
}

export function CircularProgressChart({ 
  goals, 
  title = "Progresso das Metas",
  description = "Acompanhe o progresso de suas principais metas financeiras",
  className 
}: CircularProgressChartProps) {
  
  const chartData = useMemo(() => {
    return goals.map(goal => ({
      name: goal.name,
      value: goal.progress,
      color: goal.color,
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      remaining: goal.targetValue - goal.currentValue
    }))
  }, [goals])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Progresso: {data.value.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            R$ {data.currentValue.toLocaleString('pt-BR')} / R$ {data.targetValue.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground">
            Restante: R$ {data.remaining.toLocaleString('pt-BR')}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => {
            const Icon = goal.icon || goalIcons.default
            const progress = goal.progress
            const isComplete = progress >= 100
            
            return (
              <div key={goal.id} className="flex flex-col items-center space-y-4">
                {/* Gráfico Circular */}
                <div className="relative w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'progress', value: progress, color: goal.color },
                          { name: 'remaining', value: 100 - progress, color: '#f3f4f6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill={goal.color} />
                        <Cell fill="#f3f4f6" />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Valor central */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-foreground">
                      {progress.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {isComplete ? 'Concluído!' : 'Em andamento'}
                    </div>
                  </div>
                </div>

                {/* Informações da meta */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">{goal.name}</h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      R$ {goal.currentValue.toLocaleString('pt-BR')} / R$ {goal.targetValue.toLocaleString('pt-BR')}
                    </div>
                    
                    {!isComplete && (
                      <div className="text-xs text-muted-foreground">
                        Restante: R$ {(goal.targetValue - goal.currentValue).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <Badge 
                    variant={isComplete ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {isComplete ? 'Concluído' : `${progress.toFixed(1)}%`}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {/* Resumo geral */}
        {goals.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {goals.length}
                </div>
                <div className="text-xs text-muted-foreground">Total de Metas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {goals.filter(g => g.progress >= 100).length}
                </div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {goals.filter(g => g.progress > 0 && g.progress < 100).length}
                </div>
                <div className="text-xs text-muted-foreground">Em Andamento</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {goals.filter(g => g.progress === 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Não Iniciadas</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 