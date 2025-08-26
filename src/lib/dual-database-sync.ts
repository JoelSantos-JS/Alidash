import { SupabaseService } from './supabase-service'
import { db as firebaseDb } from './firebase'
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore'
import type { Product, Dream, Bet, Goal, Transaction, Debt, Revenue, Expense } from '@/types'

// Instância do serviço Supabase
const supabaseService = new SupabaseService()

export interface DualSyncResult {
  success: boolean
  firebaseSuccess: boolean
  supabaseSuccess: boolean
  errors: string[]
}

export interface DualSyncOptions {
  prioritizeFirebase?: boolean // Se true, falha no Firebase cancela operação
  prioritizeSupabase?: boolean // Se true, falha no Supabase cancela operação
  rollbackOnFailure?: boolean // Se true, desfaz operação bem-sucedida em caso de falha
}

/**
 * Serviço de Sincronização Dual - Firebase + Supabase
 * Permite gravar dados simultaneamente nos dois bancos
 */
export class DualDatabaseSync {
  private userId: string
  private options: DualSyncOptions

  constructor(userId: string, options: DualSyncOptions = {}) {
    this.userId = userId
    this.options = {
      prioritizeFirebase: false,
      prioritizeSupabase: false,
      rollbackOnFailure: true,
      ...options
    }
  }

  // =====================================
  // PRODUTOS
  // =====================================

  async createProduct(productData: Omit<Product, 'id'>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    let firebaseId: string | null = null
    let supabaseId: string | null = null

    try {
      // 1. Tentar criar no Firebase
      try {
        const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'products')
        const firebaseDoc = await addDoc(firebaseRef, {
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        firebaseId = firebaseDoc.id
        result.firebaseSuccess = true
        console.log('✅ Produto criado no Firebase:', firebaseId)
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
        if (this.options.prioritizeFirebase) {
          throw new Error('Falha prioritária no Firebase')
        }
      }

      // 2. Tentar criar no Supabase
      try {
        const supabaseProduct = await supabaseService.createProduct(this.userId, productData)
        supabaseId = supabaseProduct.id
        result.supabaseSuccess = true
        console.log('✅ Produto criado no Supabase:', supabaseId)
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
        if (this.options.prioritizeSupabase) {
          throw new Error('Falha prioritária no Supabase')
        }
      }

      // 3. Verificar se pelo menos um foi bem-sucedido
      result.success = result.firebaseSuccess || result.supabaseSuccess

      // 4. Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackProductCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackProductCreation(firebaseId, supabaseId)
      return result
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Atualizar no Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'products', productId)
        await updateDoc(firebaseRef, {
          ...updates,
          updatedAt: new Date()
        })
        result.firebaseSuccess = true
        console.log('✅ Produto atualizado no Firebase')
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Atualizar no Supabase
      try {
        await supabaseService.updateProduct(productId, updates)
        result.supabaseSuccess = true
        console.log('✅ Produto atualizado no Supabase')
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess
      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      return result
    }
  }

  async deleteProduct(productId: string): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Deletar do Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'products', productId)
        await deleteDoc(firebaseRef)
        result.firebaseSuccess = true
        console.log('✅ Produto deletado do Firebase')
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Deletar do Supabase
      try {
        await supabaseService.deleteProduct(productId)
        result.supabaseSuccess = true
        console.log('✅ Produto deletado do Supabase')
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess
      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      return result
    }
  }

  // =====================================
  // TRANSAÇÕES
  // =====================================

  async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    let firebaseId: string | null = null
    let supabaseId: string | null = null

    try {
      // 1. Criar no Firebase
      try {
        const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'transactions')
        const firebaseDoc = await addDoc(firebaseRef, {
          ...transactionData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        firebaseId = firebaseDoc.id
        result.firebaseSuccess = true
        console.log('✅ Transação criada no Firebase:', firebaseId)
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Criar no Supabase
      try {
        const supabaseTransaction = await supabaseService.createTransaction(this.userId, transactionData)
        supabaseId = supabaseTransaction.id
        result.supabaseSuccess = true
        console.log('✅ Transação criada no Supabase:', supabaseId)
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess

      // Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackTransactionCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackTransactionCreation(firebaseId, supabaseId)
      return result
    }
  }

  // =====================================
  // SONHOS
  // =====================================

  async createDream(dreamData: Omit<Dream, 'id'>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    let firebaseId: string | null = null
    let supabaseId: string | null = null

    try {
      // 1. Criar no Firebase
      try {
        const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'dreams')
        const firebaseDoc = await addDoc(firebaseRef, {
          ...dreamData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        firebaseId = firebaseDoc.id
        result.firebaseSuccess = true
        console.log('✅ Sonho criado no Firebase:', firebaseId)
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Criar no Supabase
      try {
        const supabaseDream = await supabaseService.createDream(this.userId, dreamData)
        supabaseId = supabaseDream.id
        result.supabaseSuccess = true
        console.log('✅ Sonho criado no Supabase:', supabaseId)
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess

      // Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackDreamCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackDreamCreation(firebaseId, supabaseId)
      return result
    }
  }

  // =====================================
  // APOSTAS
  // =====================================

  async createBet(betData: Omit<Bet, 'id'>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    let firebaseId: string | null = null
    let supabaseId: string | null = null

    try {
      // 1. Criar no Firebase
      try {
        const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'bets')
        const firebaseDoc = await addDoc(firebaseRef, {
          ...betData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        firebaseId = firebaseDoc.id
        result.firebaseSuccess = true
        console.log('✅ Aposta criada no Firebase:', firebaseId)
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Criar no Supabase
      try {
        const supabaseBet = await supabaseService.createBet(this.userId, betData)
        supabaseId = supabaseBet.id
        result.supabaseSuccess = true
        console.log('✅ Aposta criada no Supabase:', supabaseId)
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess

      // Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackBetCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackBetCreation(firebaseId, supabaseId)
      return result
    }
  }

  // =====================================
  // MÉTODOS DE ROLLBACK
  // =====================================

  private async rollbackProductCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'products', firebaseId)
        await deleteDoc(firebaseRef)
        console.log('🔄 Rollback: Produto removido do Firebase')
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteProduct(supabaseId)
        console.log('🔄 Rollback: Produto removido do Supabase')
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackTransactionCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'transactions', firebaseId)
        await deleteDoc(firebaseRef)
        console.log('🔄 Rollback: Transação removida do Firebase')
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteTransaction(supabaseId)
        console.log('🔄 Rollback: Transação removida do Supabase')
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackDreamCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'dreams', firebaseId)
        await deleteDoc(firebaseRef)
        console.log('🔄 Rollback: Sonho removido do Firebase')
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteDream(supabaseId)
        console.log('🔄 Rollback: Sonho removido do Supabase')
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackBetCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId, 'bets', firebaseId)
        await deleteDoc(firebaseRef)
        console.log('🔄 Rollback: Aposta removida do Firebase')
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteBet(supabaseId)
        console.log('🔄 Rollback: Aposta removida do Supabase')
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }
}

// =====================================
// FUNÇÕES DE CONVENIÊNCIA
// =====================================

/**
 * Cria uma instância do DualDatabaseSync com configurações padrão
 */
export function createDualSync(userId: string, options?: DualSyncOptions): DualDatabaseSync {
  return new DualDatabaseSync(userId, options)
}

/**
 * Configurações pré-definidas para diferentes cenários
 */
export const DualSyncPresets = {
  // Prioriza Firebase, falha se Firebase falhar
  FIREBASE_PRIORITY: {
    prioritizeFirebase: true,
    rollbackOnFailure: true
  } as DualSyncOptions,

  // Prioriza Supabase, falha se Supabase falhar
  SUPABASE_PRIORITY: {
    prioritizeSupabase: true,
    rollbackOnFailure: true
  } as DualSyncOptions,

  // Permite falha parcial, mantém dados onde conseguir gravar
  BEST_EFFORT: {
    prioritizeFirebase: false,
    prioritizeSupabase: false,
    rollbackOnFailure: false
  } as DualSyncOptions,

  // Exige sucesso em ambos, faz rollback se algum falhar
  STRICT_DUAL: {
    prioritizeFirebase: false,
    prioritizeSupabase: false,
    rollbackOnFailure: true
  } as DualSyncOptions
}

/**
 * Hook para usar sincronização dual em componentes React
 */
export function useDualSync(userId: string, preset: keyof typeof DualSyncPresets = 'BEST_EFFORT') {
  const dualSync = new DualDatabaseSync(userId, DualSyncPresets[preset])
  
  return {
    createProduct: (data: Omit<Product, 'id'>) => dualSync.createProduct(data),
    updateProduct: (id: string, data: Partial<Product>) => dualSync.updateProduct(id, data),
    deleteProduct: (id: string) => dualSync.deleteProduct(id),
    createTransaction: (data: Omit<Transaction, 'id'>) => dualSync.createTransaction(data),
    createDream: (data: Omit<Dream, 'id'>) => dualSync.createDream(data),
    createBet: (data: Omit<Bet, 'id'>) => dualSync.createBet(data)
  }
}