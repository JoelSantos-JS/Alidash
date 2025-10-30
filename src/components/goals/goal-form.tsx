"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Loader2, Target, Settings, FileText, TrendingUp, Calendar as CalendarLucide } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { Goal } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const goalSchema = z.object({
  name: z.string().min(3, { message: "O nome da meta deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  category: z.enum(['financial', 'business', 'personal', 'health', 'education', 'other'], {
    required_error: "A categoria é obrigatória."
  }),
  type: z.enum(['savings', 'revenue', 'profit', 'roi', 'quantity', 'percentage', 'custom'], {
    required_error: "O tipo de meta é obrigatório."
  }),
  targetValue: z.coerce.number().min(0.01, { message: "O valor da meta deve ser positivo." }),
  currentValue: z.coerce.number().min(0, { message: "O valor atual deve ser positivo." }),
  unit: z.enum(['BRL', 'USD', 'percentage', 'quantity', 'days', 'custom'], {
    required_error: "A unidade é obrigatória."
  }),
  deadline: z.date({ required_error: "A data limite é obrigatória." }),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['active', 'paused', 'completed', 'cancelled', 'overdue']),
  notes: z.string().optional(),
  tags: z.string().optional(),
}).refine(data => data.currentValue <= data.targetValue, {
  message: "O valor atual não pode ser maior que a meta.",
  path: ["currentValue"],
}).refine(data => data.deadline > new Date(), {
  message: "A data limite deve ser no futuro.",
  path: ["deadline"],
})

type GoalFormProps = {
  onSave: (goal: Omit<Goal, 'id' | 'createdDate' | 'milestones' | 'reminders' | 'linkedEntities'>) => Promise<void>
  goalToEdit?: Goal
  onCancel?: () => void
}

const categoryOptions: Record<Goal['category'], string> = {
  financial: 'Financeiro',
  business: 'Negócios',
  personal: 'Pessoal',
  health: 'Saúde',
  education: 'Educação',
  other: 'Outros'
}

const typeOptions: Record<Goal['type'], string> = {
  savings: 'Economia',
  revenue: 'Receita',
  profit: 'Lucro',
  roi: 'ROI',
  quantity: 'Quantidade',
  percentage: 'Porcentagem',
  custom: 'Personalizado'
}

const unitOptions: Record<Goal['unit'], string> = {
  BRL: 'Real (R$)',
  USD: 'Dólar ($)',
  percentage: 'Porcentagem (%)',
  quantity: 'Quantidade (un)',
  days: 'Dias',
  custom: 'Personalizado'
}

const priorityOptions: Record<Goal['priority'], { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-800' }
}

const statusOptions: Record<Goal['status'], string> = {
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  overdue: 'Atrasada'
}

// Suggested combinations based on category and type
// Tipos para as sugestões
type SuggestionUnit = Goal['unit']
type SuggestionType = Goal['type']
type SuggestionCategory = Goal['category']

type SuggestionData = {
  unit: SuggestionUnit
  examples: string[]
}

type SuggestedCombinations = {
  [K in SuggestionCategory]?: {
    [T in SuggestionType]?: SuggestionData
  }
}

const suggestedCombinations: SuggestedCombinations = {
  financial: {
    savings: { unit: 'BRL', examples: ['Reserva de emergência', 'Viagem dos sonhos'] },
    revenue: { unit: 'BRL', examples: ['Renda mensal', 'Vendas do trimestre'] },
    profit: { unit: 'BRL', examples: ['Lucro líquido', 'Margem de contribuição'] },
    roi: { unit: 'percentage', examples: ['ROI de investimentos', 'Retorno de aplicações'] }
  },
  business: {
    revenue: { unit: 'BRL', examples: ['Faturamento mensal', 'Vendas do produto'] },
    profit: { unit: 'BRL', examples: ['Lucro operacional', 'EBITDA'] },
    quantity: { unit: 'quantity', examples: ['Novos clientes', 'Produtos vendidos'] },
    percentage: { unit: 'percentage', examples: ['Market share', 'Taxa de conversão'] }
  },
  personal: {
    quantity: { unit: 'quantity', examples: ['Livros lidos', 'Exercícios por semana'] },
    custom: { unit: 'custom', examples: ['Habilidade específica', 'Hobby novo'] }
  },
  health: {
    quantity: { unit: 'quantity', examples: ['Peso perdido (kg)', 'Exercícios por semana'] },
    percentage: { unit: 'percentage', examples: ['Redução de gordura', 'Melhoria na resistência'] }
  },
  education: {
    quantity: { unit: 'quantity', examples: ['Cursos concluídos', 'Certificações'] },
    percentage: { unit: 'percentage', examples: ['Progresso no curso', 'Nota mínima'] }
  }
}

export function GoalForm({ onSave, goalToEdit, onCancel }: GoalFormProps) {
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: goalToEdit ? {
      name: goalToEdit.name || "",
      description: goalToEdit.description || "",
      category: goalToEdit.category || "financial",
      type: goalToEdit.type || "savings",
      targetValue: goalToEdit.targetValue || 1000,
      currentValue: goalToEdit.currentValue || 0,
      unit: goalToEdit.unit || "BRL",
      deadline: new Date(goalToEdit.deadline),
      priority: goalToEdit.priority || 'medium',
      status: goalToEdit.status || 'active',
      notes: goalToEdit.notes || "",
      tags: goalToEdit.tags?.join(', ') || ""
    } : {
      name: "",
      description: "",
      category: "financial",
      type: "savings",
      targetValue: 1000,
      currentValue: 0,
      unit: "BRL",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: 'medium',
      status: 'active',
      notes: "",
      tags: ""
    },
  })

  const { formState: { isSubmitting }, watch } = form
  const selectedCategory = watch('category')
  const selectedType = watch('type')
  const selectedUnit = watch('unit')

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    try {
      const goalData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      }
      await onSave(goalData)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  const getSuggestions = () => {
    const categoryData = suggestedCombinations[selectedCategory]
    if (!categoryData) return null
    
    const typeData = categoryData[selectedType as keyof typeof categoryData]
    return typeData || null
  }

  const suggestions = getSuggestions()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goalToEdit ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
          <DialogDescription>
            {goalToEdit 
              ? 'Atualize as informações da sua meta.' 
              : 'Defina uma nova meta para acompanhar seu progresso.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Básico</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Detalhes</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Informações Básicas */}
          <TabsContent value="basic" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações da Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Meta *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Economizar para viagem" {...field} />
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
                              placeholder="Descreva sua meta em detalhes..."
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                                {Object.entries(categoryOptions).map(([key, value]) => (
                                  <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(typeOptions).map(([key, value]) => (
                                  <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Suggestions */}
                    {suggestions && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Sugestões para {categoryOptions[selectedCategory]} - {typeOptions[selectedType]}:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestions.examples.map((example: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={() => form.setValue('name', example)}
                            >
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="config" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valores e Unidades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(unitOptions).map(([key, value]) => (
                                <SelectItem key={key} value={key}>{value}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step={selectedUnit === 'BRL' || selectedUnit === 'USD' ? "0.01" : "1"}
                                placeholder="0"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Atual</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step={selectedUnit === 'BRL' || selectedUnit === 'USD' ? "0.01" : "1"}
                                placeholder="0"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prazo e Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data Limite *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
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
                    </div>

                    {/* Status (only for editing) */}
                    {goalToEdit && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
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
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Aba Detalhes */}
          <TabsContent value="details" className="space-y-6">
            <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Adicionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: importante, urgente, pessoal (separadas por vírgula)"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Use tags para organizar e filtrar suas metas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Adicione observações, estratégias ou lembretes..."
                              className="resize-none"
                              rows={6}
                              {...field}
                            />
                          </FormControl>
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {goalToEdit ? 'Atualizar Meta' : 'Criar Meta'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}