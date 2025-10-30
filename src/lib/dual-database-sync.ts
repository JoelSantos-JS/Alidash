import { SupabaseService, supabaseAdminService } from './supabase-service'
import type { Product, Dream, Bet, Goal, Transaction, Debt, Revenue, Expense } from '../types'

// Instância do serviço Supabase
const supabaseService = supabaseAdminService

export interface SyncResult {
  success: boolean
  supabaseSuccess: boolean
  errors: string[]
}

export interface SyncOptions {
  rollbackOnFailure?: boolean
}

/**
 * Serviço de Sincronização - Supabase
 * Gerencia todas as operações de banco de dados usando Supabase
 */
export class DatabaseSync {
  private userId: string
  private userEmail?: string
  private options: SyncOptions

  constructor(userId: string, options: SyncOptions = {}, userEmail?: string) {
    this.userId = userId
    this.userEmail = userEmail
    this.options = {
      rollbackOnFailure: true,
      ...options
    }
  }

  // =====================================
  // REVENUES (REVENUES)
  // =====================================

  async createRevenue(revenueData: Omit<Revenue, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createRevenue(this.userId, revenueData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async updateRevenue(revenueId: string, updates: Partial<Revenue>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.updateRevenue(this.userId, revenueId, updates)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async deleteRevenue(revenueId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.deleteRevenue(this.userId, revenueId)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // EXPENSES
  // =====================================

  async createExpense(expenseData: Omit<Expense, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createExpense(this.userId, expenseData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.updateExpense(this.userId, expenseId, updates)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async deleteExpense(expenseId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.deleteExpense(this.userId, expenseId)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // TRANSACTIONS
  // =====================================

  async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createTransaction(this.userId, transactionData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.updateTransaction(this.userId, transactionId, updates)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async deleteTransaction(transactionId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.deleteTransaction(this.userId, transactionId)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // PRODUCTS
  // =====================================

  async getProducts(): Promise<Product[]> {
    try {
      return await supabaseService.getProducts(this.userId)
    } catch (error) {
      console.error('Error getting products:', error)
      return []
    }
  }

  async createProduct(productData: Omit<Product, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createProduct(this.userId, productData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.updateProduct(this.userId, productId, updates)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async deleteProduct(productId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.deleteProduct(this.userId, productId)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // DREAMS
  // =====================================

  async createDream(dreamData: Omit<Dream, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createDream(this.userId, dreamData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async saveDreams(dreams: Dream[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // Para cada sonho, criar ou atualizar
      for (const dream of dreams) {
        if (dream.id) {
          // Se tem ID, é uma atualização (implementar quando necessário)
          console.log(`Atualizando sonho ${dream.id} (funcionalidade em desenvolvimento)`)
        } else {
          // Se não tem ID, é criação
          await supabaseService.createDream(this.userId, dream)
        }
      }
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // BETS
  // =====================================

  async createBet(betData: Omit<Bet, 'id'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createBet(this.userId, betData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  // =====================================
  // GOALS
  // =====================================

  async createGoal(goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      const supabaseResult = await supabaseService.createGoal(this.userId, goalData)
      result.supabaseSuccess = !!supabaseResult
      result.success = result.supabaseSuccess
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.updateGoal(this.userId, goalId, updates)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }

  async deleteGoal(goalId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      await supabaseService.deleteGoal(this.userId, goalId)
      result.supabaseSuccess = true
      result.success = true
    } catch (error) {
      result.errors.push(`Supabase error: ${error}`)
    }

    return result
  }
}

// Função de conveniência para criar uma instância
export function createSync(userId: string, options?: SyncOptions): DatabaseSync {
  return new DatabaseSync(userId, options)
}

// Presets simplificados
export const SyncPresets = {
  DEFAULT: {
    rollbackOnFailure: true
  } as SyncOptions,
  
  BEST_EFFORT: {
    rollbackOnFailure: false
  } as SyncOptions,
  
  FIREBASE_PRIORITY: {
    rollbackOnFailure: true
  } as SyncOptions,
  
  SUPABASE_PRIORITY: {
    rollbackOnFailure: true
  } as SyncOptions,
  
  STRICT_DUAL: {
    rollbackOnFailure: true
  } as SyncOptions
}

// Hook simplificado
export function useSync(userId: string, preset: keyof typeof SyncPresets = 'DEFAULT', userEmail?: string) {
  return new DatabaseSync(userId, SyncPresets[preset], userEmail)
}

// Manter compatibilidade com código existente
export const DualDatabaseSync = DatabaseSync
export const createDualSync = createSync
export const useDualSync = useSync
export type DualSyncResult = SyncResult
export type DualSyncOptions = SyncOptions
export const DualSyncPresets = SyncPresets