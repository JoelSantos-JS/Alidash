import { SupabaseService, supabaseAdminService } from './supabase-service'
import { db as firebaseDb } from './firebase'
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDoc } from 'firebase/firestore'
import type { Product, Dream, Bet, Goal, Transaction, Debt, Revenue, Expense } from '@/types'

// Instância do serviço Supabase
const supabaseService = supabaseAdminService

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
  // REVENUES (REVENUES)
  // =====================================

  async createRevenue(revenueData: Omit<Revenue, 'id'>): Promise<DualSyncResult> {
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
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        const currentData = docSnap.exists() ? docSnap.data() : {}
        const currentRevenues = currentData.revenues || []
        
        const newRevenue = {
          ...revenueData,
          id: new Date().getTime().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(firebaseRef, {
          ...currentData,
          revenues: [newRevenue, ...currentRevenues]
        }, { merge: true })
        
        firebaseId = newRevenue.id
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita criada no Firebase:', firebaseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
        if (this.options.prioritizeFirebase) {
          throw new Error('Falha prioritária no Firebase')
        }
      }

      // 2. Tentar criar no Supabase
      try {
        // Verificar se o usuário existe no Supabase primeiro
        let supabaseUser = await supabaseAdminService.getUserByFirebaseUid(this.userId)
        
        if (!supabaseUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Usuário não encontrado no Supabase durante criação de receita')
          }
          // Se não encontrar, usar o Firebase UID diretamente (fallback)
          const supabaseRevenue = await supabaseAdminService.createRevenue(this.userId, revenueData)
          supabaseId = supabaseRevenue.id
        } else {
          const supabaseRevenue = await supabaseAdminService.createRevenue(supabaseUser.id, revenueData)
          supabaseId = supabaseRevenue.id
        }
        
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita criada no Supabase:', supabaseId)
        }
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
        console.error('Erro detalhado do Supabase:', error)
        if (this.options.prioritizeSupabase) {
          throw new Error('Falha prioritária no Supabase')
        }
      }

      // 3. Verificar se pelo menos um foi bem-sucedido
      result.success = result.firebaseSuccess || result.supabaseSuccess

      // 4. Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackRevenueCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackRevenueCreation(firebaseId, supabaseId)
      return result
    }
  }

  async updateRevenue(revenueId: string, updates: Partial<Revenue>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Tentar atualizar no Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentRevenues = currentData.revenues || []
          const updatedRevenues = currentRevenues.map((r: any) => 
            r.id === revenueId ? { ...r, ...updates, updatedAt: new Date() } : r
          )
          
          await setDoc(firebaseRef, {
            ...currentData,
            revenues: updatedRevenues
          }, { merge: true })
        }
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita atualizada no Firebase:', revenueId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Tentar atualizar no Supabase
      try {
        await supabaseAdminService.updateRevenue(revenueId, updates)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita atualizada no Supabase:', revenueId)
        }
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

  async deleteRevenue(revenueId: string): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Tentar deletar do Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentRevenues = currentData.revenues || []
          const filteredRevenues = currentRevenues.filter((r: any) => r.id !== revenueId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            revenues: filteredRevenues
          }, { merge: true })
        }
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita removida do Firebase:', revenueId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Tentar deletar do Supabase
      try {
        await supabaseAdminService.deleteRevenue(revenueId)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Receita removida do Supabase:', revenueId)
        }
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
  // DESPESAS (EXPENSES)
  // =====================================

  async createExpense(expenseData: Omit<Expense, 'id'>): Promise<DualSyncResult> {
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
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        const currentData = docSnap.exists() ? docSnap.data() : {}
        const currentExpenses = currentData.expenses || []
        
        const newExpense = {
          ...expenseData,
          id: new Date().getTime().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(firebaseRef, {
          ...currentData,
          expenses: [newExpense, ...currentExpenses]
        }, { merge: true })
        
        firebaseId = newExpense.id
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa criada no Firebase:', firebaseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
        if (this.options.prioritizeFirebase) {
          throw new Error('Falha prioritária no Firebase')
        }
      }

      // 2. Tentar criar no Supabase
      try {
        // Verificar se o usuário existe no Supabase primeiro
        let supabaseUser = await supabaseAdminService.getUserByFirebaseUid(this.userId)
        
        if (!supabaseUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 Usuário não encontrado no Supabase durante criação de despesa')
          }
          // Se não encontrar, usar o Firebase UID diretamente (fallback)
          const supabaseExpense = await supabaseAdminService.createExpense(this.userId, expenseData)
          supabaseId = supabaseExpense.id
        } else {
          const supabaseExpense = await supabaseAdminService.createExpense(supabaseUser.id, expenseData)
          supabaseId = supabaseExpense.id
        }
        
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa criada no Supabase:', supabaseId)
        }
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
        console.error('Erro detalhado do Supabase:', error)
        if (this.options.prioritizeSupabase) {
          throw new Error('Falha prioritária no Supabase')
        }
      }

      // 3. Verificar se pelo menos um foi bem-sucedido
      result.success = result.firebaseSuccess || result.supabaseSuccess

      // 4. Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackExpenseCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackExpenseCreation(firebaseId, supabaseId)
      return result
    }
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Tentar atualizar no Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentExpenses = currentData.expenses || []
          const updatedExpenses = currentExpenses.map((e: any) => 
            e.id === expenseId ? { ...e, ...updates, updatedAt: new Date() } : e
          )
          
          await setDoc(firebaseRef, {
            ...currentData,
            expenses: updatedExpenses
          }, { merge: true })
        }
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa atualizada no Firebase:', expenseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Tentar atualizar no Supabase
      try {
        await supabaseAdminService.updateExpense(expenseId, updates)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa atualizada no Supabase:', expenseId)
        }
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

  async deleteExpense(expenseId: string): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // 1. Tentar deletar do Firebase
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentExpenses = currentData.expenses || []
          const filteredExpenses = currentExpenses.filter((e: any) => e.id !== expenseId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            expenses: filteredExpenses
          }, { merge: true })
        }
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa removida do Firebase:', expenseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Tentar deletar do Supabase
      try {
        await supabaseAdminService.deleteExpense(expenseId)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Despesa removida do Supabase:', expenseId)
        }
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
  // PRODUTOS
  // =====================================

  async getProducts(): Promise<Product[]> {
    try {
      // Tentar buscar do Firebase primeiro (fonte primária)
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        
        if (docSnap.exists()) {
          const userData = docSnap.data()
          const products = userData.products || []
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ ${products.length} produtos encontrados no Firebase`)
          }
          return products.map((product: any) => ({
            ...product,
            purchaseDate: product.purchaseDate?.toDate?.() || new Date(product.purchaseDate) || new Date(),
            sales: product.sales?.map((sale: any) => ({
              ...sale,
              date: sale.date?.toDate?.() || new Date(sale.date) || new Date()
            })) || []
          }))
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Nenhum produto encontrado no Firebase')
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Erro ao buscar produtos do Firebase, tentando Supabase:', error)
        }
      }

      // Fallback para Supabase
      try {
        const supabaseProducts = await supabaseService.getProducts(this.userId)
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${supabaseProducts.length} produtos encontrados no Supabase (fallback)`)
        }
        return supabaseProducts
      } catch (error) {
        console.error('❌ Erro ao buscar produtos do Supabase:', error)
        return []
      }
    } catch (error) {
      console.error('❌ Erro geral ao buscar produtos:', error)
      return []
    }
  }

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
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        const currentData = docSnap.exists() ? docSnap.data() : {}
        const currentProducts = currentData.products || []
        
        // Calcular campos financeiros se não estiverem presentes
        const totalCost = productData.totalCost || (productData.purchasePrice + productData.shippingCost + productData.importTaxes + productData.packagingCost + productData.marketingCost + productData.otherCosts)
        const expectedProfit = productData.expectedProfit || (productData.sellingPrice - totalCost)
        const profitMargin = productData.profitMargin || (productData.sellingPrice > 0 ? (expectedProfit / productData.sellingPrice) * 100 : 0)
        const roi = productData.roi || (totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0)
        const actualProfit = productData.actualProfit || (expectedProfit * productData.quantitySold)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('💰 Calculando campos financeiros para Firebase:', {
            name: productData.name,
            totalCost,
            expectedProfit,
            profitMargin,
            roi,
            actualProfit
          })
        }
        
        const newProduct = {
          ...productData,
          totalCost,
          expectedProfit,
          profitMargin,
          roi,
          actualProfit,
          id: new Date().getTime().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await setDoc(firebaseRef, {
          ...currentData,
          products: [newProduct, ...currentProducts]
        }, { merge: true })
        
        firebaseId = newProduct.id
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Produto criado no Firebase:', firebaseId)
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Produto criado no Supabase:', supabaseId)
        }
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
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentProducts = currentData.products || []
          
          // Encontrar e atualizar o produto específico
          const productIndex = currentProducts.findIndex((p: Product) => p.id === productId)
          
          if (productIndex !== -1) {
            const updatedProduct = {
              ...currentProducts[productIndex],
              ...updates,
              updatedAt: new Date()
            }
            
            // Recalcular campos financeiros se necessário
            if (updates.purchasePrice !== undefined || updates.shippingCost !== undefined || 
                updates.importTaxes !== undefined || updates.packagingCost !== undefined ||
                updates.marketingCost !== undefined || updates.otherCosts !== undefined ||
                updates.sellingPrice !== undefined) {
              
              const totalCost = updatedProduct.purchasePrice + updatedProduct.shippingCost + 
                              updatedProduct.importTaxes + updatedProduct.packagingCost + 
                              updatedProduct.marketingCost + updatedProduct.otherCosts
              const expectedProfit = updatedProduct.sellingPrice - totalCost
              const profitMargin = updatedProduct.sellingPrice > 0 ? (expectedProfit / updatedProduct.sellingPrice) * 100 : 0
              const roi = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0
              const actualProfit = expectedProfit * updatedProduct.quantitySold
              
              updatedProduct.totalCost = totalCost
              updatedProduct.expectedProfit = expectedProfit
              updatedProduct.profitMargin = profitMargin
              updatedProduct.roi = roi
              updatedProduct.actualProfit = actualProfit
            }
            
            currentProducts[productIndex] = updatedProduct
            
            await setDoc(firebaseRef, {
              ...currentData,
              products: currentProducts
            }, { merge: true })
            
            result.firebaseSuccess = true
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Produto atualizado no Firebase')
            }
          } else {
            result.errors.push('Firebase: Produto não encontrado')
          }
        } else {
          result.errors.push('Firebase: Documento do usuário não encontrado')
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Atualizar no Supabase
      try {
        await supabaseService.updateProduct(productId, updates)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Produto atualizado no Supabase')
        }
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
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentProducts = currentData.products || []
          
          // Filtrar o produto a ser deletado
          const updatedProducts = currentProducts.filter((p: Product) => p.id !== productId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            products: updatedProducts
          }, { merge: true })
          
          result.firebaseSuccess = true
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Produto deletado do Firebase')
          }
        } else {
          result.errors.push('Firebase: Documento do usuário não encontrado')
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Deletar do Supabase
      try {
        await supabaseService.deleteProduct(productId)
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Produto deletado do Supabase')
        }
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
      // Gerar ID único para a transação
      const transactionId = new Date().getTime().toString();
      const transactionWithId = {
        ...transactionData,
        id: transactionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 1. Criar no Firebase
      try {
        const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'transactions')
        const firebaseDoc = await addDoc(firebaseRef, transactionWithId)
        firebaseId = firebaseDoc.id
        result.firebaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Transação criada no Firebase:', firebaseId, 'com ID interno:', transactionId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
        console.error('❌ Erro ao criar transação no Firebase:', error)
      }

      // 2. Criar no Supabase
      try {
        const supabaseTransaction = await supabaseService.createTransaction(this.userId, transactionData)
        supabaseId = supabaseTransaction.id
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Transação criada no Supabase:', supabaseId)
        }
      } catch (error) {
        result.errors.push(`Supabase: ${error}`)
        console.error('❌ Erro ao criar transação no Supabase:', error)
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Sonho criado no Firebase:', firebaseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Criar no Supabase
      try {
        const supabaseDream = await supabaseService.createDream(this.userId, dreamData)
        supabaseId = supabaseDream.id
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Sonho criado no Supabase:', supabaseId)
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Aposta criada no Firebase:', firebaseId)
        }
      } catch (error) {
        result.errors.push(`Firebase: ${error}`)
      }

      // 2. Criar no Supabase
      try {
        const supabaseBet = await supabaseService.createBet(this.userId, betData)
        supabaseId = supabaseBet.id
        result.supabaseSuccess = true
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Aposta criada no Supabase:', supabaseId)
        }
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
  // METAS (GOALS)
  // =====================================

  async createGoal(goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    let firebaseId: string | null = null
    let supabaseId: string | null = null

    try {
      // Verificar se estamos no browser ou servidor
      const isBrowser = typeof window !== 'undefined'
      
      if (isBrowser) {
        // No browser, fazer sincronização dual via Firebase + API
        
        // 1. Criar no Firebase primeiro
        try {
          // Filtrar campos undefined para Firebase
          const firebaseData = {
            name: goalData.name,
            description: goalData.description,
            category: goalData.category,
            type: goalData.type,
            targetValue: goalData.targetValue,
            currentValue: goalData.currentValue,
            unit: goalData.unit,
            deadline: goalData.deadline,
            priority: goalData.priority,
            status: goalData.status,
            notes: goalData.notes || '',
            tags: goalData.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'goals')
          const firebaseDoc = await addDoc(firebaseRef, firebaseData)
          firebaseId = firebaseDoc.id
          result.firebaseSuccess = true
        } catch (error) {
          result.errors.push(`Firebase: ${error}`)
        }

        // 2. Criar no Supabase via API
        try {
          const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebase_uid: this.userId,
              goalData
            })
          })
          
          const responseData = await response.json()
          
          if (!response.ok) {
            throw new Error(responseData.error || 'Erro na API')
          }
          
          supabaseId = responseData.goal?.id
          result.supabaseSuccess = true
          
        } catch (error) {
          result.errors.push(`API: ${error}`)
        }
        
      } else {
        // No servidor, usar acesso direto aos dois bancos
        
        // 1. Criar no Firebase
        try {
          // Filtrar campos undefined para Firebase
          const firebaseData = {
            name: goalData.name,
            description: goalData.description,
            category: goalData.category,
            type: goalData.type,
            targetValue: goalData.targetValue,
            currentValue: goalData.currentValue,
            unit: goalData.unit,
            deadline: goalData.deadline,
            priority: goalData.priority,
            status: goalData.status,
            notes: goalData.notes || '',
            tags: goalData.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          const firebaseRef = collection(firebaseDb, 'user-data', this.userId, 'goals')
          const firebaseDoc = await addDoc(firebaseRef, firebaseData)
          firebaseId = firebaseDoc.id
          result.firebaseSuccess = true
        } catch (error) {
          result.errors.push(`Firebase: ${error}`)
        }

        // 2. Criar no Supabase
        try {
          let supabaseUser = await supabaseService.getUserByFirebaseUid(this.userId)
          
          if (!supabaseUser) {
            throw new Error(`Usuário não encontrado no Supabase para firebase_uid: ${this.userId}`)
          }
          
          const supabaseGoal = await supabaseAdminService.createGoal(supabaseUser.id, goalData)
          supabaseId = supabaseGoal.id
          result.supabaseSuccess = true
          
        } catch (error) {
          result.errors.push(`Supabase: ${error}`)
        }
      }

      result.success = result.firebaseSuccess || result.supabaseSuccess

      // Rollback se necessário
      if (!result.success || (this.options.rollbackOnFailure && (!result.firebaseSuccess || !result.supabaseSuccess))) {
        await this.rollbackGoalCreation(firebaseId, supabaseId)
        result.success = false
      }

      return result

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      await this.rollbackGoalCreation(firebaseId, supabaseId)
      return result
    }
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // Verificar se estamos no browser ou servidor
      const isBrowser = typeof window !== 'undefined'
      
      if (isBrowser) {
        // No browser, usar API route
        try {
          const response = await fetch('/api/goals', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              goalId,
              updates
            })
          })
          
          const responseData = await response.json()
          
          if (!response.ok) {
            throw new Error(responseData.error || 'Erro na API')
          }
          
          result.supabaseSuccess = true
          result.success = true
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Meta atualizada via API:', goalId)
          }
          
          return result
          
        } catch (error) {
          result.errors.push(`API: ${error}`)
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro ao atualizar meta via API:', error)
          }
          return result
        }
      } else {
        // No servidor, usar acesso direto
        try {
          await supabaseAdminService.updateGoal(goalId, updates)
          
          result.supabaseSuccess = true
          result.success = true
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Meta atualizada no Supabase (servidor):', goalId)
          }
          
          return result
          
        } catch (error) {
          result.errors.push(`Supabase: ${error}`)
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro ao atualizar meta no Supabase:', error)
          }
          return result
        }
      }

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`)
      return result
    }
  }

  async deleteGoal(goalId: string): Promise<DualSyncResult> {
    const result: DualSyncResult = {
      success: false,
      firebaseSuccess: false,
      supabaseSuccess: false,
      errors: []
    }

    try {
      // Usar apenas Supabase como banco principal para metas
      await supabaseAdminService.deleteGoal(goalId)
      
      result.supabaseSuccess = true
      result.success = true
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Meta removida do Supabase (banco principal):', goalId)
      }
      
      return result

    } catch (error) {
      result.errors.push(`Supabase: ${error instanceof Error ? error.message : String(error)}`)
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro ao remover meta do Supabase:', error)
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Produto removido do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteProduct(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Produto removido do Supabase')
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Transação removida do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteTransaction(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Transação removida do Supabase')
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Sonho removido do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteDream(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Sonho removido do Supabase')
        }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Aposta removida do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseService.deleteBet(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Aposta removida do Supabase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackGoalCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentGoals = currentData.goals || []
          const filteredGoals = currentGoals.filter((g: any) => g.id !== firebaseId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            goals: filteredGoals
          }, { merge: true })
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Meta removida do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseAdminService.deleteGoal(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Meta removida do Supabase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackRevenueCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentRevenues = currentData.revenues || []
          const filteredRevenues = currentRevenues.filter((r: any) => r.id !== firebaseId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            revenues: filteredRevenues
          }, { merge: true })
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Receita removida do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseAdminService.deleteRevenue(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Receita removida do Supabase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Supabase:', error)
      }
    }
  }

  private async rollbackExpenseCreation(firebaseId: string | null, supabaseId: string | null) {
    if (firebaseId) {
      try {
        const firebaseRef = doc(firebaseDb, 'user-data', this.userId)
        const docSnap = await getDoc(firebaseRef)
        if (docSnap.exists()) {
          const currentData = docSnap.data()
          const currentExpenses = currentData.expenses || []
          const filteredExpenses = currentExpenses.filter((e: any) => e.id !== firebaseId)
          
          await setDoc(firebaseRef, {
            ...currentData,
            expenses: filteredExpenses
          }, { merge: true })
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Despesa removida do Firebase')
        }
      } catch (error) {
        console.error('❌ Erro no rollback Firebase:', error)
      }
    }

    if (supabaseId) {
      try {
        await supabaseAdminService.deleteExpense(supabaseId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Rollback: Despesa removida do Supabase')
        }
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
    createBet: (data: Omit<Bet, 'id'>) => dualSync.createBet(data),
    createGoal: (data: Omit<Goal, 'id' | 'milestones' | 'reminders'>) => dualSync.createGoal(data),
    updateGoal: (id: string, data: Partial<Goal>) => dualSync.updateGoal(id, data),
    deleteGoal: (id: string) => dualSync.deleteGoal(id),
    createRevenue: (data: Omit<Revenue, 'id'>) => dualSync.createRevenue(data),
    updateRevenue: (id: string, data: Partial<Revenue>) => dualSync.updateRevenue(id, data),
    deleteRevenue: (id: string) => dualSync.deleteRevenue(id),
    createExpense: (data: Omit<Expense, 'id'>) => dualSync.createExpense(data),
    updateExpense: (id: string, data: Partial<Expense>) => dualSync.updateExpense(id, data),
    deleteExpense: (id: string) => dualSync.deleteExpense(id)
  }
}