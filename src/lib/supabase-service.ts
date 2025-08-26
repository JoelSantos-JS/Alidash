import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { 
  Product, 
  Sale, 
  Transaction, 
  Debt, 
  DebtPayment, 
  Goal, 
  GoalMilestone, 
  GoalReminder, 
  Dream, 
  Bet, 
  Revenue, 
  Expense 
} from '@/types'

// Client-side Supabase client
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Supabase Service Layer - Replace Firebase operations
 */
export class SupabaseService {
  private client: typeof supabase

  constructor(useAdmin = false) {
    this.client = useAdmin ? supabaseAdmin : supabase
  }

  // =====================================
  // USER OPERATIONS
  // =====================================

  async createUser(userData: {
    firebase_uid?: string
    email: string
    name?: string | null
    avatar_url?: string | null
    account_type?: string
  }) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData as any)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserByFirebaseUid(firebase_uid: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('firebase_uid', firebase_uid)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async getUserById(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateUserLastLogin(userId: string) {
    const { error } = await this.client
      .from('users')
      .update({ last_login: new Date().toISOString() } as any)
      .eq('id', userId)

    if (error) throw error
  }

  // =====================================
  // PRODUCT OPERATIONS
  // =====================================

  async createProduct(userId: string, productData: Omit<Product, 'id' | 'sales'>) {
    // Convert Date objects to ISO strings
    const supabaseProductData = {
      user_id: userId,
      name: productData.name,
      category: productData.category,
      supplier: productData.supplier,
      aliexpress_link: productData.aliexpressLink,
      image_url: productData.imageUrl,
      description: productData.description,
      notes: productData.notes,
      tracking_code: productData.trackingCode,
      purchase_email: productData.purchaseEmail,
      purchase_price: productData.purchasePrice,
      shipping_cost: productData.shippingCost,
      import_taxes: productData.importTaxes,
      packaging_cost: productData.packagingCost,
      marketing_cost: productData.marketingCost,
      other_costs: productData.otherCosts,
      selling_price: productData.sellingPrice,
      quantity: productData.quantity,
      quantity_sold: productData.quantitySold,
      status: productData.status,
      purchase_date: productData.purchaseDate.toISOString(),
      roi: productData.roi,
      actual_profit: productData.actualProfit,
      days_to_sell: productData.daysToSell
    }

    const { data, error } = await this.client
      .from('products')
      .insert(supabaseProductData as any)
      .select()
      .single()

    if (error) throw error
    return this.convertProductFromSupabase(data)
  }

  async getProducts(userId: string): Promise<Product[]> {
    const { data: products, error } = await this.client
      .from('products')
      .select(`
        *,
        sales (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return products.map(product => this.convertProductFromSupabase(product))
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select(`
        *,
        sales (*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    return this.convertProductFromSupabase(data)
  }

  async updateProduct(id: string, updates: Partial<Product>) {
    const supabaseUpdates: any = {}
    
    if (updates.name) supabaseUpdates.name = updates.name
    if (updates.category) supabaseUpdates.category = updates.category
    if (updates.supplier) supabaseUpdates.supplier = updates.supplier
    if (updates.aliexpressLink) supabaseUpdates.aliexpress_link = updates.aliexpressLink
    if (updates.imageUrl) supabaseUpdates.image_url = updates.imageUrl
    if (updates.description) supabaseUpdates.description = updates.description
    if (updates.notes) supabaseUpdates.notes = updates.notes
    if (updates.trackingCode) supabaseUpdates.tracking_code = updates.trackingCode
    if (updates.purchaseEmail) supabaseUpdates.purchase_email = updates.purchaseEmail
    if (updates.purchasePrice !== undefined) supabaseUpdates.purchase_price = updates.purchasePrice
    if (updates.shippingCost !== undefined) supabaseUpdates.shipping_cost = updates.shippingCost
    if (updates.importTaxes !== undefined) supabaseUpdates.import_taxes = updates.importTaxes
    if (updates.packagingCost !== undefined) supabaseUpdates.packaging_cost = updates.packagingCost
    if (updates.marketingCost !== undefined) supabaseUpdates.marketing_cost = updates.marketingCost
    if (updates.otherCosts !== undefined) supabaseUpdates.other_costs = updates.otherCosts
    if (updates.sellingPrice !== undefined) supabaseUpdates.selling_price = updates.sellingPrice
    if (updates.quantity !== undefined) supabaseUpdates.quantity = updates.quantity
    if (updates.quantitySold !== undefined) supabaseUpdates.quantity_sold = updates.quantitySold
    if (updates.status) supabaseUpdates.status = updates.status
    if (updates.purchaseDate) supabaseUpdates.purchase_date = updates.purchaseDate.toISOString()
    if (updates.roi !== undefined) supabaseUpdates.roi = updates.roi
    if (updates.actualProfit !== undefined) supabaseUpdates.actual_profit = updates.actualProfit
    if (updates.daysToSell !== undefined) supabaseUpdates.days_to_sell = updates.daysToSell

    const { data, error } = await this.client
      .from('products')
      .update(supabaseUpdates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.convertProductFromSupabase(data)
  }

  async deleteProduct(id: string) {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =====================================
  // SALES OPERATIONS
  // =====================================

  async createSale(userId: string, productId: string, saleData: Omit<Sale, 'id'>) {
    const { data, error } = await this.client
      .from('sales')
      .insert({
        user_id: userId,
        product_id: productId,
        date: saleData.date.toISOString(),
        quantity: saleData.quantity,
        buyer_name: saleData.buyerName,
        unit_price: 0 // This will be calculated from product selling price
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.convertSaleFromSupabase(data)
  }

  async getSales(userId: string, productId?: string) {
    let query = this.client
      .from('sales')
      .select('*')
      .eq('user_id', userId)

    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error
    return data.map(sale => this.convertSaleFromSupabase(sale))
  }

  // =====================================
  // TRANSACTION OPERATIONS
  // =====================================

  async createTransaction(userId: string, transactionData: Omit<Transaction, 'id'>) {
    const { data, error } = await this.client
      .from('transactions')
      .insert({
        user_id: userId,
        date: transactionData.date.toISOString(),
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        subcategory: transactionData.subcategory,
        payment_method: transactionData.paymentMethod,
        status: transactionData.status,
        notes: transactionData.notes,
        tags: transactionData.tags
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.convertTransactionFromSupabase(data)
  }

  async getTransactions(userId: string, filters?: {
    type?: 'revenue' | 'expense'
    category?: string
    startDate?: Date
    endDate?: Date
  }) {
    let query = this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString())
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error
    return data.map(transaction => this.convertTransactionFromSupabase(transaction))
  }

  // =====================================
  // GOAL OPERATIONS
  // =====================================

  async createGoal(userId: string, goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'>) {
    const { data, error } = await this.client
      .from('goals')
      .insert({
        user_id: userId,
        name: goalData.name,
        description: goalData.description,
        category: goalData.category,
        type: goalData.type,
        target_value: goalData.targetValue,
        current_value: goalData.currentValue,
        unit: goalData.unit,
        deadline: goalData.deadline.toISOString(),
        created_date: goalData.createdDate.toISOString(),
        priority: goalData.priority,
        status: goalData.status,
        notes: goalData.notes,
        tags: goalData.tags,
        linked_product_ids: goalData.linkedEntities?.products,
        linked_dream_ids: goalData.linkedEntities?.dreams,
        linked_transaction_ids: goalData.linkedEntities?.transactions
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.convertGoalFromSupabase(data)
  }

  async getGoals(userId: string) {
    const { data, error } = await this.client
      .from('goals')
      .select(`
        *,
        goal_milestones (*),
        goal_reminders (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(goal => this.convertGoalFromSupabase(goal))
  }

  // =====================================
  // DREAM OPERATIONS
  // =====================================

  async createDream(userId: string, dreamData: Omit<Dream, 'id'>) {
    const { data, error } = await this.client
      .from('dreams')
      .insert({
        user_id: userId,
        name: dreamData.name,
        type: dreamData.type,
        target_amount: dreamData.targetAmount,
        current_amount: dreamData.currentAmount,
        status: dreamData.status,
        notes: dreamData.notes,
        plan: dreamData.plan
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.convertDreamFromSupabase(data)
  }

  async getDreams(userId: string) {
    const { data, error } = await this.client
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(dream => this.convertDreamFromSupabase(dream))
  }

  // =====================================
  // BET OPERATIONS
  // =====================================

  async createBet(userId: string, betData: Omit<Bet, 'id'>) {
    const { data, error } = await this.client
      .from('bets')
      .insert({
        user_id: userId,
        type: betData.type,
        sport: betData.sport,
        event: betData.event,
        date: betData.date.toISOString(),
        status: betData.status,
        notes: betData.notes,
        earned_freebet_value: betData.earnedFreebetValue,
        bet_type_single: betData.betType,
        stake: betData.stake,
        odds: betData.odds,
        sub_bets: betData.subBets,
        total_stake: betData.totalStake,
        guaranteed_profit: betData.guaranteedProfit,
        profit_percentage: betData.profitPercentage,
        analysis: betData.analysis
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.convertBetFromSupabase(data)
  }

  async getBets(userId: string) {
    const { data, error } = await this.client
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data.map(bet => this.convertBetFromSupabase(bet))
  }

  // =====================================
  // CONVERSION HELPERS
  // =====================================

  private convertProductFromSupabase(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      supplier: data.supplier || '',
      aliexpressLink: data.aliexpress_link || '',
      imageUrl: data.image_url || '',
      description: data.description || '',
      notes: data.notes,
      trackingCode: data.tracking_code,
      purchaseEmail: data.purchase_email,
      purchasePrice: data.purchase_price,
      shippingCost: data.shipping_cost,
      importTaxes: data.import_taxes,
      packagingCost: data.packaging_cost,
      marketingCost: data.marketing_cost,
      otherCosts: data.other_costs,
      totalCost: data.total_cost,
      sellingPrice: data.selling_price,
      expectedProfit: data.expected_profit,
      profitMargin: data.profit_margin,
      sales: data.sales ? data.sales.map((sale: any) => this.convertSaleFromSupabase(sale)) : [],
      quantity: data.quantity,
      quantitySold: data.quantity_sold,
      status: data.status,
      purchaseDate: new Date(data.purchase_date),
      roi: data.roi,
      actualProfit: data.actual_profit,
      daysToSell: data.days_to_sell
    }
  }

  private convertSaleFromSupabase(data: any): Sale {
    return {
      id: data.id,
      date: new Date(data.date),
      quantity: data.quantity,
      buyerName: data.buyer_name,
      productId: data.product_id
    }
  }

  private convertTransactionFromSupabase(data: any): Transaction {
    return {
      id: data.id,
      date: new Date(data.date),
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      paymentMethod: data.payment_method,
      status: data.status,
      notes: data.notes,
      tags: data.tags
    }
  }

  private convertGoalFromSupabase(data: any): Goal {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      type: data.type,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      deadline: new Date(data.deadline),
      createdDate: new Date(data.created_date),
      priority: data.priority,
      status: data.status,
      milestones: data.goal_milestones?.map((m: any) => ({
        id: m.id,
        goalId: m.goal_id,
        name: m.name,
        targetValue: m.target_value,
        targetDate: new Date(m.target_date),
        isCompleted: m.is_completed,
        completedDate: m.completed_date ? new Date(m.completed_date) : undefined,
        reward: m.reward,
        notes: m.notes
      })),
      reminders: data.goal_reminders?.map((r: any) => ({
        id: r.id,
        goalId: r.goal_id,
        type: r.type,
        frequency: r.frequency,
        message: r.message,
        isActive: r.is_active,
        lastSent: r.last_sent ? new Date(r.last_sent) : undefined,
        nextSend: new Date(r.next_send)
      })),
      notes: data.notes,
      tags: data.tags,
      linkedEntities: {
        products: data.linked_product_ids,
        dreams: data.linked_dream_ids,
        transactions: data.linked_transaction_ids
      }
    }
  }

  private convertDreamFromSupabase(data: any): Dream {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      status: data.status,
      notes: data.notes,
      plan: data.plan
    }
  }

  private convertBetFromSupabase(data: any): Bet {
    return {
      id: data.id,
      type: data.type,
      sport: data.sport,
      event: data.event,
      date: new Date(data.date),
      status: data.status,
      notes: data.notes,
      earnedFreebetValue: data.earned_freebet_value,
      betType: data.bet_type_single,
      stake: data.stake,
      odds: data.odds,
      subBets: data.sub_bets,
      totalStake: data.total_stake,
      guaranteedProfit: data.guaranteed_profit,
      profitPercentage: data.profit_percentage,
      analysis: data.analysis
    }
  }

  // =====================================
  // ANALYTICS OPERATIONS
  // =====================================

  async getAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    // Implement comprehensive analytics queries
    const products = await this.getProducts(userId)
    const transactions = await this.getTransactions(userId, { startDate, endDate })
    const goals = await this.getGoals(userId)
    const dreams = await this.getDreams(userId)
    const bets = await this.getBets(userId)

    return {
      products,
      transactions,
      goals,
      dreams,
      bets
    }
  }
}

// Export singleton instances
export const supabaseService = new SupabaseService(false)
export const supabaseAdminService = new SupabaseService(true)