import { SupabaseService } from './supabase-service'
import { db as firebaseDb } from './firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import type { Product, Dream, Bet, Goal, Transaction } from '@/types'

// Create admin service instance for migration
const supabaseAdminService = new SupabaseService(true)

export interface MigrationResult {
  success: boolean
  migratedUsers: number
  migratedProducts: number
  migratedDreams: number
  migratedBets: number
  migratedGoals: number
  migratedTransactions: number
  errors: string[]
}

export interface MigrationProgress {
  phase: string
  current: number
  total: number
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
}

/**
 * Firebase to Supabase Migration Service
 * Handles the complete migration of data from Firebase to Supabase
 */
export class FirebaseToSupabaseMigration {
  private onProgress?: (progress: MigrationProgress) => void
  private errors: string[] = []

  constructor(progressCallback?: (progress: MigrationProgress) => void) {
    this.onProgress = progressCallback
  }

  /**
   * Main migration function - migrates all data from Firebase to Supabase
   */
  async migrateAllData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedUsers: 0,
      migratedProducts: 0,
      migratedDreams: 0,
      migratedBets: 0,
      migratedGoals: 0,
      migratedTransactions: 0,
      errors: []
    }

    try {
      this.updateProgress('Iniciando migração', 0, 100, 'running')

      // Step 1: Get all Firebase users
      this.updateProgress('Buscando usuários do Firebase', 10, 100, 'running')
      const firebaseUsers = await this.getAllFirebaseUsers()
      
      if (firebaseUsers.length === 0) {
        this.updateProgress('Nenhum usuário encontrado no Firebase', 100, 100, 'completed')
        result.success = true
        return result
      }

      this.updateProgress(`Encontrados ${firebaseUsers.length} usuários`, 20, 100, 'running')

      // Step 2: Migrate users and their data
      let currentUser = 0
      for (const firebaseUser of firebaseUsers) {
        currentUser++
        const userProgress = Math.floor(20 + (currentUser / firebaseUsers.length) * 70)
        
        this.updateProgress(
          `Migrando usuário ${currentUser}/${firebaseUsers.length}: ${firebaseUser.email}`, 
          userProgress, 
          100, 
          'running'
        )

        try {
          await this.migrateUser(firebaseUser)
          result.migratedUsers++

          // Migrate user data
          const userData = await this.migrateUserData(firebaseUser.firebase_uid!)
          result.migratedProducts += userData.products
          result.migratedDreams += userData.dreams
          result.migratedBets += userData.bets
          result.migratedGoals += userData.goals
          result.migratedTransactions += userData.transactions

        } catch (error) {
          const errorMsg = `Erro ao migrar usuário ${firebaseUser.email}: ${error}`
          this.errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      this.updateProgress('Migração concluída', 100, 100, 'completed')
      result.success = true
      result.errors = this.errors

    } catch (error) {
      const errorMsg = `Erro geral na migração: ${error}`
      this.errors.push(errorMsg)
      this.updateProgress(errorMsg, 0, 100, 'error')
      result.errors = this.errors
    }

    return result
  }

  /**
   * Migrate a specific user by Firebase UID
   */
  async migrateSingleUser(firebaseUid: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedUsers: 0,
      migratedProducts: 0,
      migratedDreams: 0,
      migratedBets: 0,
      migratedGoals: 0,
      migratedTransactions: 0,
      errors: []
    }

    try {
      this.updateProgress(`Migrando usuário ${firebaseUid}`, 0, 100, 'running')

      // Get user from Firebase Auth (you might need to implement this)
      const firebaseUser = await this.getFirebaseUserByUid(firebaseUid)
      
      if (!firebaseUser) {
        throw new Error('Usuário não encontrado no Firebase')
      }

      // Migrate user
      await this.migrateUser(firebaseUser)
      result.migratedUsers = 1

      // Migrate user data
      const userData = await this.migrateUserData(firebaseUid)
      result.migratedProducts = userData.products
      result.migratedDreams = userData.dreams
      result.migratedBets = userData.bets
      result.migratedGoals = userData.goals
      result.migratedTransactions = userData.transactions

      this.updateProgress('Migração do usuário concluída', 100, 100, 'completed')
      result.success = true

    } catch (error) {
      const errorMsg = `Erro ao migrar usuário ${firebaseUid}: ${error}`
      this.errors.push(errorMsg)
      this.updateProgress(errorMsg, 0, 100, 'error')
      result.errors = this.errors
    }

    return result
  }

  /**
   * Get all users from Firebase user-data collection
   */
  private async getAllFirebaseUsers() {
    const usersCollection = collection(firebaseDb, 'user-data')
    const snapshot = await getDocs(usersCollection)
    
    const users = []
    for (const doc of snapshot.docs) {
      const userData = doc.data()
      users.push({
        firebase_uid: doc.id,
        email: userData.email || `user-${doc.id}@migrated.local`,
        name: userData.name || userData.displayName || null,
        avatar_url: userData.photoURL || userData.avatarUrl || null,
        account_type: userData.accountType || 'personal'
      })
    }

    return users
  }

  /**
   * Get specific Firebase user by UID
   */
  private async getFirebaseUserByUid(uid: string) {
    const userDoc = await getDoc(doc(firebaseDb, 'user-data', uid))
    
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    return {
      firebase_uid: uid,
      email: userData.email || `user-${uid}@migrated.local`,
      name: userData.name || userData.displayName || null,
      avatar_url: userData.photoURL || userData.avatarUrl || null,
      account_type: userData.accountType || 'personal'
    }
  }

  /**
   * Migrate a single user to Supabase
   */
  private async migrateUser(firebaseUser: any) {
    // Check if user already exists in Supabase
    const existingUser = await supabaseAdminService.getUserByFirebaseUid(firebaseUser.firebase_uid)
    
    if (existingUser) {
      console.log(`Usuário ${firebaseUser.email} já existe no Supabase, pulando...`)
      return existingUser
    }

    // Create user in Supabase
    return await supabaseAdminService.createUser(firebaseUser)
  }

  /**
   * Migrate all data for a specific user
   */
  private async migrateUserData(firebaseUid: string) {
    const result = {
      products: 0,
      dreams: 0,
      bets: 0,
      goals: 0,
      transactions: 0
    }

    // Get Supabase user
    const supabaseUser = await supabaseAdminService.getUserByFirebaseUid(firebaseUid)
    if (!supabaseUser) {
      throw new Error('Usuário não encontrado no Supabase')
    }

    // Get Firebase user data
    const userDocRef = doc(firebaseDb, 'user-data', firebaseUid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      console.log(`Nenhum dado encontrado para usuário ${firebaseUid}`)
      return result
    }

    const userData = userDocSnap.data()

    // Migrate Products
    if (userData.products && Array.isArray(userData.products)) {
      for (const product of userData.products) {
        try {
          await this.migrateProduct(supabaseUser.id, product)
          result.products++
        } catch (error) {
          this.errors.push(`Erro ao migrar produto ${product.id}: ${error}`)
        }
      }
    }

    // Migrate Dreams
    if (userData.dreams && Array.isArray(userData.dreams)) {
      for (const dream of userData.dreams) {
        try {
          await this.migrateDream(supabaseUser.id, dream)
          result.dreams++
        } catch (error) {
          this.errors.push(`Erro ao migrar sonho ${dream.id}: ${error}`)
        }
      }
    }

    // Migrate Bets
    if (userData.bets && Array.isArray(userData.bets)) {
      for (const bet of userData.bets) {
        try {
          await this.migrateBet(supabaseUser.id, bet)
          result.bets++
        } catch (error) {
          this.errors.push(`Erro ao migrar aposta ${bet.id}: ${error}`)
        }
      }
    }

    // Migrate Goals
    if (userData.goals && Array.isArray(userData.goals)) {
      for (const goal of userData.goals) {
        try {
          await this.migrateGoal(supabaseUser.id, goal)
          result.goals++
        } catch (error) {
          this.errors.push(`Erro ao migrar meta ${goal.id}: ${error}`)
        }
      }
    }

    // Migrate Transactions
    if (userData.transactions && Array.isArray(userData.transactions)) {
      for (const transaction of userData.transactions) {
        try {
          await this.migrateTransaction(supabaseUser.id, transaction)
          result.transactions++
        } catch (error) {
          this.errors.push(`Erro ao migrar transação ${transaction.id}: ${error}`)
        }
      }
    }

    return result
  }

  /**
   * Migrate a single product
   */
  private async migrateProduct(userId: string, product: any) {
    // Convert Firebase product to TypeScript Product type
    const productData: Omit<Product, 'id' | 'sales'> = {
      name: product.name || '',
      category: product.category || '',
      supplier: product.supplier || '',
      aliexpressLink: product.aliexpressLink || '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      notes: product.notes,
      trackingCode: product.trackingCode,
      purchaseEmail: product.purchaseEmail,
      purchasePrice: product.purchasePrice || 0,
      shippingCost: product.shippingCost || 0,
      importTaxes: product.importTaxes || 0,
      packagingCost: product.packagingCost || 0,
      marketingCost: product.marketingCost || 0,
      otherCosts: product.otherCosts || 0,
      totalCost: product.totalCost || 0,
      sellingPrice: product.sellingPrice || 0,
      expectedProfit: product.expectedProfit || 0,
      profitMargin: product.profitMargin || 0,
      quantity: product.quantity || 1,
      quantitySold: product.quantitySold || 0,
      status: product.status || 'purchased',
      purchaseDate: this.convertFirebaseDate(product.purchaseDate),
      roi: product.roi || 0,
      actualProfit: product.actualProfit || 0,
      daysToSell: product.daysToSell
    }

    const migratedProduct = await supabaseAdminService.createProduct(userId, productData)

    // Migrate sales for this product
    if (product.sales && Array.isArray(product.sales)) {
      for (const sale of product.sales) {
        try {
          await supabaseAdminService.createSale(userId, migratedProduct.id, {
            date: this.convertFirebaseDate(sale.date),
            quantity: sale.quantity || 1,
            buyerName: sale.buyerName,
            productId: migratedProduct.id
          })
        } catch (error) {
          this.errors.push(`Erro ao migrar venda ${sale.id}: ${error}`)
        }
      }
    }

    return migratedProduct
  }

  /**
   * Migrate a single dream
   */
  private async migrateDream(userId: string, dream: any) {
    const dreamData: Omit<Dream, 'id'> = {
      name: dream.name || '',
      type: dream.type || 'personal',
      targetAmount: dream.targetAmount || 0,
      currentAmount: dream.currentAmount || 0,
      status: dream.status || 'planning',
      notes: dream.notes,
      plan: dream.plan
    }

    return await supabaseAdminService.createDream(userId, dreamData)
  }

  /**
   * Migrate a single bet
   */
  private async migrateBet(userId: string, bet: any) {
    const betData: Omit<Bet, 'id'> = {
      type: bet.type || 'single',
      sport: bet.sport || '',
      event: bet.event || '',
      date: this.convertFirebaseDate(bet.date),
      status: bet.status || 'pending',
      notes: bet.notes,
      earnedFreebetValue: bet.earnedFreebetValue,
      betType: bet.betType,
      stake: bet.stake,
      odds: bet.odds,
      subBets: bet.subBets,
      totalStake: bet.totalStake,
      guaranteedProfit: bet.guaranteedProfit,
      profitPercentage: bet.profitPercentage,
      analysis: bet.analysis
    }

    return await supabaseAdminService.createBet(userId, betData)
  }

  /**
   * Migrate a single goal
   */
  private async migrateGoal(userId: string, goal: any) {
    const goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'> = {
      name: goal.name || '',
      description: goal.description,
      category: goal.category || 'financial',
      type: goal.type || 'savings',
      targetValue: goal.targetValue || 0,
      currentValue: goal.currentValue || 0,
      unit: goal.unit || 'BRL',
      deadline: this.convertFirebaseDate(goal.deadline),
      createdDate: this.convertFirebaseDate(goal.createdDate),
      priority: goal.priority || 'medium',
      status: goal.status || 'active',
      notes: goal.notes,
      tags: goal.tags,
      linkedEntities: goal.linkedEntities
    }

    return await supabaseAdminService.createGoal(userId, goalData)
  }

  /**
   * Migrate a single transaction
   */
  private async migrateTransaction(userId: string, transaction: any) {
    const transactionData: Omit<Transaction, 'id'> = {
      date: this.convertFirebaseDate(transaction.date),
      description: transaction.description || '',
      amount: transaction.amount || 0,
      type: transaction.type || 'expense',
      category: transaction.category || '',
      subcategory: transaction.subcategory,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status || 'completed',
      notes: transaction.notes,
      tags: transaction.tags
    }

    return await supabaseAdminService.createTransaction(userId, transactionData)
  }

  /**
   * Convert Firebase date to JavaScript Date
   */
  private convertFirebaseDate(firebaseDate: any): Date {
    if (!firebaseDate) {
      return new Date()
    }

    // If it's already a Date object
    if (firebaseDate instanceof Date) {
      return firebaseDate
    }

    // If it's a Firebase Timestamp
    if (firebaseDate.toDate && typeof firebaseDate.toDate === 'function') {
      return firebaseDate.toDate()
    }

    // If it's a string
    if (typeof firebaseDate === 'string') {
      return new Date(firebaseDate)
    }

    // If it's a number (Unix timestamp)
    if (typeof firebaseDate === 'number') {
      return new Date(firebaseDate * 1000)
    }

    // Fallback to current date
    return new Date()
  }

  /**
   * Update migration progress
   */
  private updateProgress(message: string, current: number, total: number, status: MigrationProgress['status']) {
    if (this.onProgress) {
      this.onProgress({
        phase: message,
        current,
        total,
        status,
        message
      })
    }
  }
}

// Convenience functions
export async function migrateAllUsers(progressCallback?: (progress: MigrationProgress) => void): Promise<MigrationResult> {
  const migration = new FirebaseToSupabaseMigration(progressCallback)
  return await migration.migrateAllData()
}

export async function migrateSingleUser(firebaseUid: string, progressCallback?: (progress: MigrationProgress) => void): Promise<MigrationResult> {
  const migration = new FirebaseToSupabaseMigration(progressCallback)
  return await migration.migrateSingleUser(firebaseUid)
}