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

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Só mostrar logs em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuração Supabase:', {
    url: supabaseUrl ? 'Definida' : 'Não definida',
    anonKey: supabaseAnonKey ? 'Definida' : 'Não definida',
    serviceKey: supabaseServiceKey ? 'Definida' : 'Não definida'
  })
}

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
  supabaseServiceKey || supabaseAnonKey // Fallback para anon key se service key não estiver disponível
)

if (process.env.NODE_ENV === 'development') {
  console.log('✅ Clientes Supabase criados com sucesso');
}

/**
 * Supabase Service Layer - Replace Firebase operations
 */
export class SupabaseService {
  private client: typeof supabase

  constructor(useAdmin = false) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Criando SupabaseService:', { useAdmin });
    }
    this.client = useAdmin ? supabaseAdmin : supabase
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SupabaseService criado com sucesso');
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Criando usuário no Supabase com dados:', JSON.stringify(userData, null, 2))
    }
    
    const { data, error } = await this.client
      .from('users')
      .insert(userData as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar usuário no Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userData
      })
      throw error
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Usuário criado no Supabase:', data)
    }
    
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
    // Calcular campos financeiros se não estiverem presentes
    const totalCost = productData.totalCost || (productData.purchasePrice + productData.shippingCost + productData.importTaxes + productData.packagingCost + productData.marketingCost + productData.otherCosts)
    const expectedProfit = productData.expectedProfit || (productData.sellingPrice - totalCost)
    const profitMargin = productData.profitMargin || (productData.sellingPrice > 0 ? (expectedProfit / productData.sellingPrice) * 100 : 0)
    const roi = productData.roi || (totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0)
    const actualProfit = productData.actualProfit || (expectedProfit * productData.quantitySold)
    
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
      total_cost: totalCost,
      selling_price: productData.sellingPrice,
      expected_profit: expectedProfit,
      profit_margin: profitMargin,
      quantity: productData.quantity,
      quantity_sold: productData.quantitySold,
      status: productData.status,
      purchase_date: productData.purchaseDate instanceof Date ? productData.purchaseDate.toISOString() : new Date(productData.purchaseDate).toISOString(),
      roi: roi,
      actual_profit: actualProfit,
      days_to_sell: productData.daysToSell
    }

    // Preparar dados de imagens
    let imagesData = [];
    if (productData.images && productData.images.length > 0) {
      imagesData = productData.images;
    } else if (productData.imageUrl && productData.imageUrl.trim() !== '') {
      // Criar objeto de imagem a partir do imageUrl se não houver images
      imagesData = [{
        id: `img_new_${Date.now()}`,
        url: productData.imageUrl,
        type: 'main',
        alt: productData.name || 'Imagem do produto',
        created_at: new Date().toISOString(),
        order: 1
      }];
    }

    // Adicionar campo images aos dados
    supabaseProductData.images = imagesData;

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
    if (updates.images !== undefined) supabaseUpdates.images = updates.images
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
    if (updates.purchaseDate) {
      // Garantir que purchaseDate seja um objeto Date válido
      const date = updates.purchaseDate instanceof Date ? updates.purchaseDate : new Date(updates.purchaseDate)
      supabaseUpdates.purchase_date = date.toISOString()
    }
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
    // Preparar dados para inserção
    const insertData = {
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
      tags: transactionData.tags,
      // Campos para compras parceladas
      is_installment: transactionData.isInstallment || false,
      installment_info: transactionData.installmentInfo ? JSON.stringify(transactionData.installmentInfo) : null
    };

    const { data, error } = await this.client
      .from('transactions')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar transação:', error);
      throw error;
    }

    return this.convertTransactionFromSupabase(data)
  }

  async deleteTransaction(id: string) {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getTransactions(userId: string, filters?: {
    type?: 'revenue' | 'expense'
    category?: string
    startDate?: Date
    endDate?: Date
  }) {
    // Explicitly select all fields including JSONB fields
    let query = this.client
      .from('transactions')
      .select(`
        id,
        user_id,
        date,
        description,
        amount,
        type,
        category,
        subcategory,
        payment_method,
        status,
        notes,
        tags,
        product_id,
        is_installment,
        installment_info,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)

    // Now continue with normal filtered query
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

    if (error) {
      console.error('❌ [DEBUG] Query error:', error);
      throw error;
    }
    
    return data.map(transaction => this.convertTransactionFromSupabase(transaction))
  }

  // =====================================
  // GOAL OPERATIONS
  // =====================================

  async createGoal(userId: string, goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 createGoal chamado com:', { userId, goalData: { name: goalData.name, category: goalData.category } })
    }
    
    // Função auxiliar para converter data
    const ensureDate = (date: any): string => {
      if (!date) return new Date().toISOString()
      if (date instanceof Date) return date.toISOString()
      if (typeof date === 'string') return new Date(date).toISOString()
      return new Date().toISOString()
    }

    const insertData = {
      user_id: userId,
      name: goalData.name,
      description: goalData.description,
      category: goalData.category,
      type: goalData.type,
      target_value: goalData.targetValue,
      current_value: goalData.currentValue,
      unit: goalData.unit,
      deadline: ensureDate(goalData.deadline),
      created_date: ensureDate(goalData.createdDate),
      priority: goalData.priority,
      status: goalData.status,
      notes: goalData.notes,
      tags: goalData.tags || [],
      linked_product_ids: goalData.linkedEntities?.products || [],
      linked_dream_ids: goalData.linkedEntities?.dreams || [],
      linked_transaction_ids: goalData.linkedEntities?.transactions || []
    }



    const { data, error } = await this.client
      .from('goals')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      // Forçar extração das propriedades do erro para evitar serialização vazia
      const errorDetails = {
        code: error?.code || 'NO_CODE',
        message: error?.message || 'NO_MESSAGE', 
        details: error?.details || 'NO_DETAILS',
        hint: error?.hint || 'NO_HINT',
        name: error?.name || 'NO_NAME',
        stack: error?.stack || 'NO_STACK',
        fullError: String(error),
        insertData
      }
      
      console.error('❌ Erro detalhado ao criar meta:')
      console.error('📋 Code:', errorDetails.code)
      console.error('💬 Message:', errorDetails.message)
      console.error('🔍 Details:', errorDetails.details)
      console.error('💡 Hint:', errorDetails.hint)
      console.error('📝 Full Error:', errorDetails.fullError)
      console.error('📊 Insert Data:', errorDetails.insertData)
      
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Meta criada com sucesso:', data)
    }

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

  async updateGoal(id: string, updates: Partial<Goal>) {
    // Função auxiliar para converter data
    const ensureDate = (date: any): string => {
      if (!date) return new Date().toISOString()
      if (date instanceof Date) return date.toISOString()
      if (typeof date === 'string') return new Date(date).toISOString()
      return new Date().toISOString()
    }

    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue
    if (updates.unit !== undefined) updateData.unit = updates.unit
    if (updates.deadline !== undefined) updateData.deadline = ensureDate(updates.deadline)
    if (updates.priority !== undefined) updateData.priority = updates.priority
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.linkedEntities?.products !== undefined) updateData.linked_product_ids = updates.linkedEntities.products
    if (updates.linkedEntities?.dreams !== undefined) updateData.linked_dream_ids = updates.linkedEntities.dreams
    if (updates.linkedEntities?.transactions !== undefined) updateData.linked_transaction_ids = updates.linkedEntities.transactions
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        goal_milestones (*),
        goal_reminders (*)
      `)
      .single()

    if (error) throw error
    return this.convertGoalFromSupabase(data)
  }

  async deleteGoal(id: string) {
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =====================================
  // REVENUE OPERATIONS
  // =====================================

  async createRevenue(userId: string, revenueData: Omit<Revenue, 'id'>) {
    
    const insertData = {
      user_id: userId,
      date: revenueData.date.toISOString(),
      description: revenueData.description,
      amount: revenueData.amount,
      category: revenueData.category,
      source: revenueData.source,
      notes: revenueData.notes,
      product_id: revenueData.productId
    }
    
    const { data, error } = await this.client
      .from('revenues')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao inserir receita:', error)
      throw error
    }
    
    return this.convertRevenueFromSupabase(data)
  }

  async getRevenues(userId: string, filters?: {
    category?: string
    source?: string
    startDate?: Date
    endDate?: Date
  }) {
    let query = this.client
      .from('revenues')
      .select('*')
      .eq('user_id', userId)

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.source) {
      query = query.eq('source', filters.source)
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString())
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error
    return data.map(revenue => this.convertRevenueFromSupabase(revenue))
  }

  async updateRevenue(id: string, updates: Partial<Revenue>) {
    const updateData: any = {}
    
    if (updates.date) updateData.date = updates.date.toISOString()
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.source !== undefined) updateData.source = updates.source
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.productId !== undefined) updateData.product_id = updates.productId

    const { data, error } = await this.client
      .from('revenues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.convertRevenueFromSupabase(data)
  }

  async deleteRevenue(id: string) {
    const { error } = await this.client
      .from('revenues')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =====================================
  // EXPENSE OPERATIONS
  // =====================================

  async createExpense(userId: string, expenseData: Omit<Expense, 'id'>) {
    
    const insertData = {
      user_id: userId,
      date: expenseData.date.toISOString(),
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      type: expenseData.type || 'other',
      supplier: expenseData.supplier,
      notes: expenseData.notes,
      product_id: expenseData.productId
    }
    
    const { data, error } = await this.client
      .from('expenses')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao inserir despesa:', error)
      throw error
    }
    
    return this.convertExpenseFromSupabase(data)
  }

  async getExpenses(userId: string, filters?: {
    category?: string
    type?: string
    supplier?: string
    startDate?: Date
    endDate?: Date
  }) {
    let query = this.client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.supplier) {
      query = query.eq('supplier', filters.supplier)
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString())
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error
    return data.map(expense => this.convertExpenseFromSupabase(expense))
  }

  async updateExpense(id: string, updates: Partial<Expense>) {
    const updateData: any = {}
    
    if (updates.date) updateData.date = updates.date.toISOString()
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.supplier !== undefined) updateData.supplier = updates.supplier
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.productId !== undefined) updateData.product_id = updates.productId

    const { data, error } = await this.client
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.convertExpenseFromSupabase(data)
  }

  async deleteExpense(id: string) {
    const { error } = await this.client
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
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

  async deleteDream(id: string) {
    const { error } = await this.client
      .from('dreams')
      .delete()
      .eq('id', id)

    if (error) throw error
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

  async deleteBet(id: string) {
    const { error } = await this.client
      .from('bets')
      .delete()
      .eq('id', id)

    if (error) throw error
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
    // Calcular campos financeiros se estiverem zerados ou ausentes
    const totalCost = data.total_cost || 0
    const sellingPrice = data.selling_price || 0
    const expectedProfit = data.expected_profit || (sellingPrice - totalCost)
    const profitMargin = data.profit_margin || (sellingPrice > 0 ? (expectedProfit / sellingPrice) * 100 : 0)
    const roi = data.roi || (totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0)
    const actualProfit = data.actual_profit || (expectedProfit * (data.quantity_sold || 0))
    
    // Processar imagens - usar novo campo images ou fallback para image_url
    let images = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      images = data.images;
    } else if (data.image_url && data.image_url.trim() !== '') {
      // Fallback: criar objeto de imagem a partir do image_url para compatibilidade
      images = [{
        id: `img_fallback_${data.id}`,
        url: data.image_url,
        type: 'main',
        alt: data.name || 'Imagem do produto',
        created_at: data.created_at || new Date().toISOString()
      }];
    }
    
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      supplier: data.supplier || '',
      aliexpressLink: data.aliexpress_link || '',
      imageUrl: data.image_url || '', // Mantido para compatibilidade
      images: images, // Novo sistema de múltiplas imagens
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
      totalCost: totalCost,
      sellingPrice: sellingPrice,
      expectedProfit: expectedProfit,
      profitMargin: profitMargin,
      sales: data.sales ? data.sales.map((sale: any) => this.convertSaleFromSupabase(sale)) : [],
      quantity: data.quantity,
      quantitySold: data.quantity_sold,
      status: data.status,
      purchaseDate: new Date(data.purchase_date),
      roi: roi,
      actualProfit: actualProfit,
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
    // Tratar campos de parcelamento com segurança
    let installmentInfo = null;
    
    // Processar installment_info com múltiplas estratégias
    if (data.installment_info !== null && data.installment_info !== undefined) {
      try {
        // Estratégia 1: Se já é um objeto (JSONB nativo), usar diretamente
        if (typeof data.installment_info === 'object' && data.installment_info !== null) {
          installmentInfo = data.installment_info;
        } 
        // Estratégia 2: Se é string, fazer parse JSON
        else if (typeof data.installment_info === 'string' && data.installment_info.trim() !== '') {
          installmentInfo = JSON.parse(data.installment_info);
        }
        // Estratégia 3: Tentar converter de qualquer outro tipo
        else {
          console.warn('⚠️ Tipo inesperado para installment_info, tentando conversão:', {
            type: typeof data.installment_info,
            value: data.installment_info
          });
          installmentInfo = data.installment_info;
        }
      } catch (error) {
        console.error('❌ Erro ao processar installment_info:', {
          error: error instanceof Error ? error.message : error,
          raw_data: data.installment_info,
          type: typeof data.installment_info
        });
        installmentInfo = null;
      }
    } else {
      console.log('⚠️ installment_info é null ou undefined - isso pode indicar problema de RLS ou query');
    }

    const convertedTransaction = {
      id: data.id,
      date: new Date(data.date),
      description: data.description,
      amount: parseFloat(data.amount) || 0,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      paymentMethod: data.payment_method,
      status: data.status,
      notes: data.notes,
      tags: data.tags || [],
      // Campos para compras parceladas
      isInstallment: Boolean(data.is_installment),
      installmentInfo
    };

    return convertedTransaction;
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

  private convertRevenueFromSupabase(data: any): Revenue {
    const date = new Date(data.date);
    return {
      id: data.id,
      date: date,
      time: date.toTimeString().slice(0, 5), // Extrai HH:MM do timestamp
      description: data.description,
      amount: data.amount,
      category: data.category,
      source: data.source,
      notes: data.notes,
      productId: data.product_id
    }
  }

  private convertExpenseFromSupabase(data: any): Expense {
    const date = new Date(data.date);
    return {
      id: data.id,
      date: date,
      time: date.toTimeString().slice(0, 5), // Extrai HH:MM do timestamp
      description: data.description,
      amount: data.amount,
      category: data.category,
      type: data.type,
      supplier: data.supplier,
      notes: data.notes,
      productId: data.product_id
    }
  }

  // =====================================
  // ANALYTICS OPERATIONS
  // =====================================

  async getExpensesByCategory(userId: string, month?: number, year?: number) {
    try {
      console.log('🔍 Debug - Buscando gastos por categoria para usuário:', userId)
      
      const currentDate = new Date()
      const targetMonth = month || currentDate.getMonth() + 1
      const targetYear = year || currentDate.getFullYear()
      
      const startDate = new Date(targetYear, targetMonth - 1, 1)
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

      console.log('🔍 Debug - Período de busca:', { startDate, endDate })

      const { data, error } = await this.client
        .from('expenses')
        .select('category, amount')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())

      console.log('🔍 Debug - Resultado gastos por categoria:', { 
        hasData: !!data, 
        dataLength: data?.length || 0, 
        hasError: !!error,
        errorMessage: error?.message 
      })

      if (error) {
        console.error('Erro ao buscar gastos por categoria:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
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
      console.error('Erro inesperado ao buscar gastos por categoria:', {
        error,
        userId,
        month,
        year,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      throw error
    }
  }

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