"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Loader2, Target, Settings, FileText, TrendingUp, Calendar as CalendarLucide, Home, Car, GraduationCap, Heart, Plane, PiggyBank, CreditCard, Building, Gift, DollarSign, Flag } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const personalGoalSchema = z.object({
  title: z.string().min(3, { message: "O nome da meta deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  category: z.enum(['emergency_fund', 'house', 'car', 'education', 'health', 'travel', 'investment', 'retirement', 'debt_payoff', 'gift', 'other'], {
    required_error: "A categoria é obrigatória."
  }),
  target_amount: z.coerce.number().min(0.01, { message: "O valor da meta deve ser positivo." }),
  current_amount: z.coerce.number().min(0, { message: "O valor atual deve ser positivo." }),
  monthly_contribution: z.coerce.number().min(0, { message: "A contribuição mensal deve ser positiva." }).optional(),
  target_date: z.date({ required_error: "A data limite é obrigatória." }),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  notes: z.string().optional(),
}).refine(data => data.current_amount <= data.target_amount, {
  message: "O valor atual não pode ser maior que a meta.",
  path: ["current_amount"],
}).refine(data => data.target_date > new Date(), {
  message: "A data limite deve ser no futuro.",
  path: ["target_date"],
})

interface PersonalGoal {
  id?: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  target_date: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  monthly_contribution?: number;
  notes?: string;
  created_at?: string;
}

type PersonalGoalFormProps = {
  onSave: (goal: Omit<PersonalGoal, 'id' | 'created_at'>) => Promise<void>
  goalToEdit?: PersonalGoal
  onCancel?: () => void
}

const categoryOptions = {
  emergency_fund: { label: 'Reserva de Emergência', icon: PiggyBank },
  house: { label: 'Casa Própria', icon: Home },
  car: { label: 'Veículo', icon: Car },
  education: { label: 'Educação', icon: GraduationCap },
  health: { label: 'Saúde', icon: Heart },
  travel: { label: 'Viagem', icon: Plane },
  investment: { label: 'Investimento', icon: TrendingUp },
  retirement: { label: 'Aposentadoria', icon: Building },
  debt_payoff: { label: 'Quitação de Dívidas', icon: CreditCard },
  gift: { label: 'Presente/Evento', icon: Gift },
  other: { label: 'Outros', icon: Target }
}

const priorityOptions = {
  low: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' }
}

const statusOptions = {
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Concluída',
  cancelled: 'Cancelada'
}

// Sugestões baseadas na categoria
const categorySuggestions = {
  emergency_fund: {
    examples: ['6 meses de gastos', 'Reserva para imprevistos', 'Fundo de emergência familiar'],
    defaultAmount: 10000,
    tips: 'Recomenda-se ter de 3 a 6 meses de gastos mensais como reserva de emergência.'
  },
  house: {
    examples: ['Entrada do apartamento', 'Casa própria', 'Reforma da casa'],
    defaultAmount: 50000,
    tips: 'Considere custos adicionais como documentação, ITBI e taxas.'
  },
  car: {
    examples: ['Carro novo', 'Entrada do financiamento', 'Troca de veículo'],
    defaultAmount: 30000,
    tips: 'Lembre-se de incluir custos de documentação e seguro.'
  },
  education: {
    examples: ['Curso superior', 'Pós-graduação', 'Curso de idiomas'],
    defaultAmount: 15000,
    tips: 'Investir em educação é investir no seu futuro profissional.'
  },
  health: {
    examples: ['Plano de saúde', 'Tratamento dentário', 'Cirurgia'],
    defaultAmount: 8000,
    tips: 'Saúde é prioridade. Considere ter uma reserva específica para emergências médicas.'
  },
  travel: {
    examples: ['Viagem dos sonhos', 'Férias em família', 'Lua de mel'],
    defaultAmount: 12000,
    tips: 'Inclua passagens, hospedagem, alimentação e atividades no planejamento.'
  },
  investment: {
    examples: ['Ações', 'Fundos imobiliários', 'Tesouro Direto'],
    defaultAmount: 20000,
    tips: 'Diversifique seus investimentos e mantenha disciplina nos aportes.'
  },
  retirement: {
    examples: ['Previdência privada', 'Aposentadoria complementar', 'PGBL/VGBL'],
    defaultAmount: 100000,
    tips: 'Quanto antes começar, menor será o valor mensal necessário.'
  },
  debt_payoff: {
    examples: ['Cartão de crédito', 'Financiamento', 'Empréstimo pessoal'],
    defaultAmount: 5000,
    tips: 'Priorize quitar dívidas com juros altos primeiro.'
  },
  gift: {
    examples: ['Casamento', 'Formatura', 'Aniversário especial'],
    defaultAmount: 3000,
    tips: 'Planeje com antecedência para eventos especiais.'
  },
  other: {
    examples: ['Meta personalizada', 'Objetivo específico', 'Projeto pessoal'],
    defaultAmount: 5000,
    tips: 'Defina claramente o objetivo para manter a motivação.'
  }
}

export function PersonalGoalForm({ onSave, goalToEdit, onCancel }: PersonalGoalFormProps) {
  const form = useForm<z.infer<typeof personalGoalSchema>>({
    resolver: zodResolver(personalGoalSchema),
    defaultValues: goalToEdit ? {
      title: goalToEdit.title || "",
      description: goalToEdit.description || "",
      category: goalToEdit.category as any || "emergency_fund",
      target_amount: goalToEdit.target_amount || 1000,
      current_amount: goalToEdit.current_amount || 0,
      monthly_contribution: goalToEdit.monthly_contribution || 0,
      target_date: new Date(goalToEdit.target_date),
      priority: goalToEdit.priority || 'medium',
      status: goalToEdit.status || 'active',
      notes: goalToEdit.notes || ""
    } : {
      title: "",
      description: "",
      category: "emergency_fund",
      target_amount: 10000,
      current_amount: 0,
      monthly_contribution: 500,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      priority: 'medium',
      status: 'active',
      notes: ""
    },
  })

  const { formState: { isSubmitting }, watch } = form
  const selectedCategory = watch('category')
  const targetAmount = watch('target_amount')
  const monthlyContribution = watch('monthly_contribution')

  const onSubmit = async (values: z.infer<typeof personalGoalSchema>) => {
    try {
      const goalData = {
        ...values,
        target_date: values.target_date.toISOString()
      }
      await onSave(goalData)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  const getSuggestions = () => {
    return categorySuggestions[selectedCategory as keyof typeof categorySuggestions] || null
  }

  const calculateMonthsToGoal = () => {
    if (!monthlyContribution || monthlyContribution <= 0 || !targetAmount) return null
    const remaining = targetAmount - (form.getValues('current_amount') || 0)
    if (remaining <= 0) return 0
    return Math.ceil(remaining / monthlyContribution)
  }

  const suggestions = getSuggestions()
  const monthsToGoal = calculateMonthsToGoal()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="values" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Prazo
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Meta *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Reserva de emergência" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva sua meta pessoal em detalhes..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(categoryOptions).map(([key, { label, icon: Icon }]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Suggestions */}
                    {suggestions && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Sugestões para esta categoria:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestions.examples.map((example, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{suggestions.tips}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="values" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valores Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="target_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Meta *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="current_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Atual</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="monthly_contribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contribuição Mensal</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0,00"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Valor que você pretende contribuir mensalmente para esta meta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {monthsToGoal !== null && monthsToGoal > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <CalendarLucide className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Com essa contribuição mensal, você alcançará sua meta em aproximadamente {monthsToGoal} meses
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prazo e Cronograma</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="target_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data Limite *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configurações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(priorityOptions).map(([key, { label, color }]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", color.split(' ')[0])} />
                                      {label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(statusOptions).map(([key, value]) => (
                                  <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Adicione observações, estratégias ou lembretes sobre sua meta pessoal..."
                              className="resize-none"
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use este espaço para anotar estratégias, motivações ou qualquer informação relevante sobre sua meta
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {goalToEdit ? 'Atualizar Meta' : 'Criar Meta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}