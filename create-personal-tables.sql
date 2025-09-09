import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

// Client-side Supabase client
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
)

// =====================================
// TIPOS CORRIGIDOS PARA ENUMS DO POSTGRES
// =====================================

// Tipos exatos que correspondem aos ENUMs do PostgreSQL
export type PersonalIncomeCategory = 
  | 'salary' | 'freelance' | 'investment' | 'rental' | 'bonus' 
  | 'gift' | 'pension' | 'benefit' | 'other'

export type PersonalExpenseCategory = 
  | 'housing' | 'food' | 'transportation' | 'healthcare' | 'education' 
  | 'entertainment' | 'clothing' | 'utilities' | 'insurance' | 'personal_care' 
  | 'gifts' | 'pets' | 'charity' | 'taxes' | 'debt_payment' | 'savings' | 'other'

export type PersonalPaymentMethod = 
  | 'cash' | 'debit_card' | 'credit_card' | 'pix' | 'bank_transfer' | 'automatic_debit'

export type PersonalGoalType = 
  | 'emergency_fund' | 'savings' | 'debt_payoff' | 'investment' | 'purchase' 
  | 'vacation' | 'retirement' | 'education' | 'home_purchase' | 'wedding' | 'other'

export type PersonalGoalStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type PersonalPriority = 'low' | 'medium' | 'high' | 'critical'
export type BudgetStatus = 'active' | 'completed' | 'exceeded'

// Interfaces corrigidas
export interface PersonalIncome {
  id?: string
  user_id?: string
  date: string
  description: string
  amount: number
  category: PersonalIncomeCategory
  source: string
  is_recurring?: boolean
  recurring_info?: any
  is_taxable?: boolean
  tax_withheld?: number
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface PersonalExpense {
  id?: string
  user_id?: string
  date: string
  description: string
  amount: number
  category: PersonalExpenseCategory
  subcategory?: string
  payment_method: PersonalPaymentMethod
  is_essential?: boolean
  is_recurring?: boolean
  recurring_info?: any
  location?: string
  merchant?: string
  receipt_url?: string
  is_tax_deductible?: boolean
  notes?: string
  tags?: string[]
  is_installment?: boolean
  installment_info?: any
  created_at?: string
  updated_at?: string
}

export interface PersonalBudget {
  id?: string
  user_id?: string
  name: string
  month: number
  year: number
  categories: any
  total_budget: number
  total_spent?: number
  total_remaining?: number
  status?: BudgetStatus
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface PersonalGoal {
  id?: string
  user_id?: string
  name: string
  description?: string
  type: PersonalGoalType
  target_amount: number
  current_amount?: number
  deadline: string
  priority?: PersonalPriority
  status?: PersonalGoalStatus
  monthly_contribution?: number
  auto_contribution?: any
  milestones?: any
  progress_percentage?: number
  estimated_completion_date?: string
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
  completed_date?: string
}

/**
 * Serviço específico para tabelas pessoais do Supabase
 * VERSÃO CORRIGIDA - compatível com ENUMs do PostgreSQL
 */
export class SupabasePersonalService {
  private client: typeof supabase

  constructor(useAdmin = false) {
    this.client = useAdmin ? supabaseAdmin : supabase
  }

  // =====================================
  // RECEITAS PESSOAIS (PERSONAL_INCOMES)
  // =====================================

  async createPersonalIncome(userId: string, incomeData: Omit<PersonalIncome, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.client
        .from('personal_incomes')
        .insert({
          ...incomeData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar receita pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao criar receita pessoal:', error)
      throw error
    }
  }

  async getPersonalIncomes(userId: string, filters?: {
    category?: PersonalIncomeCategory
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = this.client
        .from('personal_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar receitas pessoais:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro inesperado ao buscar receitas pessoais:', error)
      throw error
    }
  }

  async updatePersonalIncome(id: string, updates: Partial<PersonalIncome>) {
    try {
      const { data, error } = await this.client
        .from('personal_incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar receita pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao atualizar receita pessoal:', error)
      throw error
    }
  }

  async deletePersonalIncome(id: string) {
    try {
      const { error } = await this.client
        .from('personal_incomes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar receita pessoal:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar receita pessoal:', error)
      throw error
    }
  }

  // =====================================
  // GASTOS PESSOAIS (PERSONAL_EXPENSES)
  // =====================================

  async createPersonalExpense(userId: string, expenseData: Omit<PersonalExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.client
        .from('personal_expenses')
        .insert({
          ...expenseData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar gasto pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao criar gasto pessoal:', error)
      throw error
    }
  }

  async getPersonalExpenses(userId: string, filters?: {
    category?: PersonalExpenseCategory
    is_essential?: boolean
    startDate?: string
    endDate?: string
  }) {
    try {
      console.log('Debug - Buscando gastos pessoais para usuário:', userId)
      
      let query = this.client
        .from('personal_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.is_essential !== undefined) {
        query = query.eq('is_essential', filters.is_essential)
      }

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar gastos pessoais:', error)
        throw error
      }

      console.log('Debug - Gastos encontrados:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Erro inesperado ao buscar gastos pessoais:', error)
      throw error
    }
  }

  async updatePersonalExpense(id: string, updates: Partial<PersonalExpense>) {
    try {
      const { data, error } = await this.client
        .from('personal_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar gasto pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao atualizar gasto pessoal:', error)
      throw error
    }
  }

  async deletePersonalExpense(id: string) {
    try {
      const { error } = await this.client
        .from('personal_expenses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar gasto pessoal:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar gasto pessoal:', error)
      throw error
    }
  }

  // =====================================
  // ORÇAMENTOS PESSOAIS (PERSONAL_BUDGETS)
  // =====================================

  async createPersonalBudget(userId: string, budgetData: Omit<PersonalBudget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.client
        .from('personal_budgets')
        .insert({
          ...budgetData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar orçamento pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao criar orçamento pessoal:', error)
      throw error
    }
  }

  async getPersonalBudgets(userId: string, filters?: {
    month?: number
    year?: number
    status?: BudgetStatus
  }) {
    try {
      console.log('🔍 Debug - Buscando orçamentos para usuário:', userId)
      console.log('🔍 Debug - Filtros aplicados:', filters)
      
      // Verificar se o usuário existe e está autenticado
      const { data: { user } } = await this.client.auth.getUser()
      console.log('🔍 Debug - Usuário autenticado:', !!user, user?.id)
      
      let query = this.client
        .from('personal_budgets')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (filters?.month) {
        query = query.eq('month', filters.month)
      }

      if (filters?.year) {
        query = query.eq('year', filters.year)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      console.log('🔍 Debug - Executando query na tabela personal_budgets...')
      const { data, error } = await query
      
      console.log('🔍 Debug - Resultado:', { 
        hasData: !!data, 
        dataLength: data?.length || 0, 
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint
      })

      if (error) {
        console.error('Erro ao buscar orçamentos pessoais:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro inesperado ao buscar orçamentos pessoais:', error)
      throw error
    }
  }

  async updatePersonalBudget(id: string, updates: Partial<PersonalBudget>) {
    try {
      const { data, error } = await this.client
        .from('personal_budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar orçamento pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao atualizar orçamento pessoal:', error)
      throw error
    }
  }

  async deletePersonalBudget(id: string) {
    try {
      const { error } = await this.client
        .from('personal_budgets')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar orçamento pessoal:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar orçamento pessoal:', error)
      throw error
    }
  }

  // =====================================
  // METAS PESSOAIS (PERSONAL_GOALS)
  // =====================================

  async createPersonalGoal(userId: string, goalData: Omit<PersonalGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await this.client
        .from('personal_goals')
        .insert({
          ...goalData,
          user_id: userId
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar meta pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao criar meta pessoal:', error)
      throw error
    }
  }

  async getPersonalGoals(userId: string, filters?: {
    type?: PersonalGoalType
    status?: PersonalGoalStatus
    priority?: PersonalPriority
  }) {
    try {
      let query = this.client
        .from('personal_goals')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar metas pessoais:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro inesperado ao buscar metas pessoais:', error)
      throw error
    }
  }

  async updatePersonalGoal(id: string, updates: Partial<PersonalGoal>) {
    try {
      const { data, error } = await this.client
        .from('personal_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar meta pessoal:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro inesperado ao atualizar meta pessoal:', error)
      throw error
    }
  }

  async deletePersonalGoal(id: string) {
    try {
      const { error } = await this.client
        .from('personal_goals')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar meta pessoal:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar meta pessoal:', error)
      throw error
    }
  }

  // =====================================
  // ANÁLISES E RESUMOS PESSOAIS
  // =====================================

  async getPersonalSummary(userId: string, month?: number, year?: number) {
    try {
      const currentDate = new Date()
      const targetMonth = month || currentDate.getMonth() + 1
      const targetYear = year || currentDate.getFullYear()
      
      const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
      const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`

      // Buscar receitas do mês
      const { data: incomes } = await this.client
        .from('personal_incomes')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      // Buscar gastos do mês
      const { data: expenses } = await this.client
        .from('personal_expenses')
        .select('amount, is_essential')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      // Calcular totais
      const totalIncome = incomes?.reduce((sum, income) => sum + Number(income.amount), 0) || 0
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0
      const essentialExpenses = expenses?.filter(e => e.is_essential).reduce((sum, expense) => sum + Number(expense.amount), 0) || 0
      const nonEssentialExpenses = totalExpenses - essentialExpenses
      const balance = totalIncome - totalExpenses
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

      return {
        month: targetMonth,
        year: targetYear,
        totalIncome,
        totalExpenses,
        essentialExpenses,
        nonEssentialExpenses,
        balance,
        savingsRate: Math.round(savingsRate * 100) / 100
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar resumo pessoal:', error)
      throw error
    }
  }

  async getExpensesByCategory(userId: string, month?: number, year?: number) {
    try {
      console.log('🔍 Debug - Buscando gastos por categoria para usuário:', userId)
      
      const currentDate = new Date()
      const targetMonth = month || currentDate.getMonth() + 1
      const targetYear = year || currentDate.getFullYear()
      
      const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
      const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`

      console.log('🔍 Debug - Período de busca:', { startDate, endDate })

      const { data, error } = await this.client
        .from('personal_expenses')
        .select('category, amount')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      console.log('🔍 Debug - Resultado gastos por categoria:', { 
        hasData: !!data, 
        dataLength: data?.length || 0, 
        hasError: !!error,
        errorMessage: error?.message 
      })

      if (error) {
        console.error('Erro ao buscar gastos por categoria:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('🔍 Debug - Nenhum gasto encontrado no período')
        return []
      }

      // Agrupar por categoria
      const categoryTotals: Record<string, number> = {}
      data.forEach(expense => {
        if (expense.category && expense.amount !== null) {
          const category = expense.category
          categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount)
        }
      })

      console.log('🔍 Debug - Categorias agrupadas:', categoryTotals)

      return Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: 0
      }))
      
    } catch (error) {
      console.error('Erro inesperado ao buscar gastos por categoria:', error)
      throw error
    }
  }
}

// Instâncias do serviço
export const supabasePersonalService = new SupabasePersonalService(false)
export const supabasePersonalAdminService = new SupabasePersonalService(true)