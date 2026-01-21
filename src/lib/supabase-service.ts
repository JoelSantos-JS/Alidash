import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import type { 
  Product,
  Goal
} from '../types'

const isServer = typeof window === 'undefined'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!isServer && !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}
if (isServer && !supabaseAnonKey && !supabaseServiceKey) {
  throw new Error('Supabase key is required')
}

// Client-side Supabase client (SSR cookies) e fallback no server
export const supabase = isServer
  ? createClient(
      supabaseUrl,
      supabaseAnonKey || supabaseServiceKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  : createBrowserClient(
      supabaseUrl!,
      supabaseAnonKey!
    )

// Server-side Supabase admin client (ONLY create on server)
export const supabaseAdmin = isServer
  ? createClient(
      supabaseUrl,
      (supabaseServiceKey || supabaseAnonKey)!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : undefined as unknown as ReturnType<typeof createClient>

/**
 * Simplified Supabase Service Layer
 */
export class SupabaseService {
  private client: typeof supabase

  constructor(useAdmin = false) {
    // In the browser, always use the public client to avoid multiple GoTrue instances
    // On the server, allow the admin client
    if (useAdmin && isServer) {
      this.client = supabaseAdmin as unknown as typeof supabase
    } else {
      this.client = supabase
    }
  }

  public getClient() {
    return this.client
  }

  // =====================================
  // USER OPERATIONS
  // =====================================

  async createUser(userData: {
    id?: string
    email: string
    name?: string | null
    avatar_url?: string | null
    account_type?: string
    firebase_uid?: string
    plan_next_renewal_at?: string | null
    plan_started_at?: string | null
    plan_status?: string | null
    plan_price_brl?: number | null
  }) {
    let existing: any = null
    let existingError: any = null
    if (userData.firebase_uid) {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('firebase_uid', userData.firebase_uid)
        .single()
      existing = data
      existingError = error
    }
    if (!existing && !existingError) {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single()
      existing = data
      existingError = error
    }

    if (!existingError && existing) {
      const updateData: any = {}
      let needsUpdate = false

      if (userData.account_type && existing.account_type !== userData.account_type) {
        updateData.account_type = userData.account_type
        needsUpdate = true
      }
      if (userData.plan_status !== undefined && existing.plan_status !== userData.plan_status) {
        updateData.plan_status = userData.plan_status
        needsUpdate = true
      }
      if (userData.plan_price_brl !== undefined && existing.plan_price_brl !== userData.plan_price_brl) {
        updateData.plan_price_brl = userData.plan_price_brl
        needsUpdate = true
      }
      if (userData.plan_next_renewal_at !== undefined && existing.plan_next_renewal_at !== userData.plan_next_renewal_at) {
        updateData.plan_next_renewal_at = userData.plan_next_renewal_at
        needsUpdate = true
      }
      if (userData.plan_started_at !== undefined && !existing.plan_started_at && userData.plan_started_at) {
        updateData.plan_started_at = userData.plan_started_at
        needsUpdate = true
      }

      if (!needsUpdate) return existing

      updateData.updated_at = new Date().toISOString()
      const { data: updated } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()
      return updated || existing
    }

    const insertData: any = {
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url,
      account_type: userData.account_type || 'personal'
    }
    if (userData.plan_next_renewal_at !== undefined) insertData.plan_next_renewal_at = userData.plan_next_renewal_at
    if (userData.plan_started_at !== undefined) insertData.plan_started_at = userData.plan_started_at
    if (userData.plan_status !== undefined) insertData.plan_status = userData.plan_status
    if (userData.plan_price_brl !== undefined) insertData.plan_price_brl = userData.plan_price_brl
    if (userData.id) {
      insertData.id = userData.id
    }
    if (userData.firebase_uid) {
      insertData.firebase_uid = userData.firebase_uid
    }

    const { data, error } = await this.client
      .from('users')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      const msg = String(error.message || '')
      if (msg.includes('duplicate key value') || msg.includes('users_email_key')) {
        const { data: fetched } = await this.client
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single()
        if (fetched) {
          const updateData: any = {}
          let needsUpdate = false

          if (userData.account_type && fetched.account_type !== userData.account_type) {
            updateData.account_type = userData.account_type
            needsUpdate = true
          }
          if (userData.plan_status !== undefined && fetched.plan_status !== userData.plan_status) {
            updateData.plan_status = userData.plan_status
            needsUpdate = true
          }
          if (userData.plan_price_brl !== undefined && fetched.plan_price_brl !== userData.plan_price_brl) {
            updateData.plan_price_brl = userData.plan_price_brl
            needsUpdate = true
          }
          if (userData.plan_next_renewal_at !== undefined && fetched.plan_next_renewal_at !== userData.plan_next_renewal_at) {
            updateData.plan_next_renewal_at = userData.plan_next_renewal_at
            needsUpdate = true
          }
          if (userData.plan_started_at !== undefined && !fetched.plan_started_at && userData.plan_started_at) {
            updateData.plan_started_at = userData.plan_started_at
            needsUpdate = true
          }

          if (needsUpdate) {
            updateData.updated_at = new Date().toISOString()
            const { data: updated } = await this.client
              .from('users')
              .update(updateData)
              .eq('id', fetched.id)
              .select()
              .single()
            return updated || fetched
          }
        }
        return fetched
      }
      throw new Error(`Erro ao criar usuário: ${error.message}`)
    }
    return data
  }

  async getUserById(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('firebase_uid', firebaseUid)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return data
  }

  async updateUserLastLogin(userId: string) {
    const { error } = await this.client
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      throw error
    }
  }

  async updateUser(userId: string, updates: { name?: string | null; avatar_url?: string | null }) {
    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url
    const { data, error } = await this.client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`)
    }
    return data
  }

  async updateUserFirebaseUid(userId: string, firebaseUid: string) {
    const { data, error } = await this.client
      .from('users')
      .update({ firebase_uid: firebaseUid, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) {
      throw new Error(`Erro ao atualizar firebase_uid: ${error.message}`)
    }
    return data
  }

  async updateUserAccountType(
    userId: string,
    accountType: string,
    updates?: {
      plan_next_renewal_at?: string | null
      plan_started_at?: string | null
      plan_status?: string | null
      plan_price_brl?: number | null
    }
  ) {
    const updateData: any = { account_type: accountType, updated_at: new Date().toISOString() }
    if (updates?.plan_next_renewal_at !== undefined) updateData.plan_next_renewal_at = updates.plan_next_renewal_at
    if (updates?.plan_started_at !== undefined) updateData.plan_started_at = updates.plan_started_at
    if (updates?.plan_status !== undefined) updateData.plan_status = updates.plan_status
    if (updates?.plan_price_brl !== undefined) updateData.plan_price_brl = updates.plan_price_brl

    const { data, error } = await this.client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`)
    }

    return data
  }

  // =====================================
  // REVENUE OPERATIONS
  // =====================================

  async createRevenue(userId: string, revenueData: {
    description: string
    amount: number
    category: string
    source: string
    notes?: string
    product_id?: string | null
    date: Date
  }) {
    const insertData = {
      user_id: userId,
      description: revenueData.description,
      amount: revenueData.amount,
      category: revenueData.category,
      source: revenueData.source,
      notes: revenueData.notes || '',
      product_id: revenueData.product_id || null,
      date: revenueData.date.toISOString()
    }

    const { data, error } = await this.client
      .from('revenues')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar receita: ${error.message}`)
    }

    return data
  }

  async getRevenues(userId: string) {
    const { data, error } = await this.client
      .from('revenues')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar receitas: ${error.message}`)
    }

    return data || []
  }

  async updateRevenue(userId: string, revenueId: string, updates: {
    description?: string
    amount?: number
    category?: string
    source?: string
    notes?: string
    product_id?: string | null
    date?: Date
  }) {
    const updateData: Record<string, any> = {}
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.source !== undefined) updateData.source = updates.source
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.product_id !== undefined) updateData.product_id = updates.product_id
    if (updates.date !== undefined) updateData.date = updates.date.toISOString()

    const { data, error } = await this.client
      .from('revenues')
      .update(updateData)
      .eq('id', revenueId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar receita: ${error.message}`)
    }

    return data
  }

  async deleteRevenue(userId: string, revenueId: string) {
    const { error } = await this.client
      .from('revenues')
      .delete()
      .eq('id', revenueId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao deletar receita: ${error.message}`)
    }
  }

  // =====================================
  // TRANSACTION OPERATIONS
  // =====================================

  async createTransaction(userId: string, transactionData: {
    description: string
    amount: number
    type: 'revenue' | 'expense'
    category: string
    subcategory?: string
    paymentMethod?: string
    status?: string
    notes?: string
    tags?: string[]
    date: Date
    isInstallment?: boolean
    installmentInfo?: any
  }) {
    const insertData: Record<string, any> = {
      user_id: userId,
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      subcategory: transactionData.subcategory || null,
      payment_method: transactionData.paymentMethod || null,
      status: transactionData.status || 'completed',
      notes: transactionData.notes || '',
      tags: transactionData.tags || [],
      date: transactionData.date.toISOString()
    }

    const { data, error } = await this.client
      .from('transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`)
    }

    let final = data
    if (transactionData.isInstallment !== undefined || transactionData.installmentInfo !== undefined) {
      try {
        const updatePayload: Record<string, any> = {}
        if (transactionData.isInstallment !== undefined) updatePayload.is_installment = transactionData.isInstallment
        if (transactionData.installmentInfo !== undefined) updatePayload.installment_info = transactionData.installmentInfo
        if (Object.keys(updatePayload).length) {
          const { data: updated } = await this.client
            .from('transactions')
            .update(updatePayload)
            .eq('id', data.id)
            .eq('user_id', userId)
            .select()
            .single()
          if (updated) final = updated
        }
      } catch {}
    }

    return { success: true, transaction: final }
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
      .order('date', { ascending: false })

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

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao buscar transações: ${error.message}`)
    }

    return data || []
  }

  async updateTransaction(userId: string, transactionId: string, updates: {
    description?: string
    amount?: number
    type?: 'revenue' | 'expense'
    category?: string
    subcategory?: string
    paymentMethod?: string
    status?: string
    notes?: string
    tags?: string[]
    date?: Date
    isInstallment?: boolean
    installmentInfo?: any
  }) {
    const updateData: Record<string, any> = {}
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.date !== undefined) updateData.date = updates.date.toISOString()
    if (updates.isInstallment !== undefined) updateData.is_installment = updates.isInstallment
    if (updates.installmentInfo !== undefined) updateData.installment_info = updates.installmentInfo

    const { data, error } = await this.client
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar transação: ${error.message}`)
    }

    return data
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao deletar transação: ${error.message}`)
    }
  }

  // =====================================
  // EXPENSE OPERATIONS
  // =====================================

  async createExpense(userId: string, expenseData: {
    description: string
    amount: number
    category: string
    type: string
    supplier?: string
    notes?: string
    product_id?: string | null
    date: Date
  }) {
    const insertData = {
      user_id: userId,
      description: expenseData.description,
      amount: expenseData.amount,
      category: expenseData.category,
      type: expenseData.type,
      supplier: expenseData.supplier || '',
      notes: expenseData.notes || '',
      product_id: expenseData.product_id || null,
      date: expenseData.date.toISOString()
    }

    const { data, error } = await this.client
      .from('expenses')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar despesa: ${error.message}`)
    }

    return data
  }

  async getExpenses(userId: string) {
    const { data, error } = await this.client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar despesas: ${error.message}`)
    }

    return data || []
  }

  async updateExpense(userId: string, expenseId: string, updates: {
    description?: string
    amount?: number
    category?: string
    type?: string
    supplier?: string
    notes?: string
    product_id?: string | null
    date?: Date
  }) {
    const updateData: Record<string, any> = {}
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.supplier !== undefined) updateData.supplier = updates.supplier
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.product_id !== undefined) updateData.product_id = updates.product_id
    if (updates.date !== undefined) updateData.date = updates.date.toISOString()

    const { data, error } = await this.client
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar despesa: ${error.message}`)
    }

    return data
  }

  async deleteExpense(userId: string, expenseId: string) {
    const { error } = await this.client
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao deletar despesa: ${error.message}`)
    }
  }

  // =====================================
  // PRODUCT OPERATIONS
  // =====================================

  async createProduct(userId: string, productData: Omit<Product, 'id'>) {

    const insertData = {
      user_id: userId,
      name: productData.name,
      category: productData.category,
      supplier: productData.supplier || '',
      aliexpress_link: productData.aliexpressLink || '',
      image_url: productData.imageUrl || '',
      description: productData.description || '',
      notes: productData.notes || '',
      tracking_code: productData.trackingCode || '',
      purchase_email: productData.purchaseEmail || '',
      purchase_price: productData.purchasePrice || 0,
      shipping_cost: productData.shippingCost || 0,
      import_taxes: productData.importTaxes || 0,
      packaging_cost: productData.packagingCost || 0,
      marketing_cost: productData.marketingCost || 0,
      other_costs: productData.otherCosts || 0,
      selling_price: productData.sellingPrice || 0,
      expected_profit: productData.expectedProfit || 0,
      profit_margin: productData.profitMargin || 0,
      quantity: productData.quantity || 1,
      quantity_sold: productData.quantitySold || 0,
      status: productData.status || 'purchased',
      purchase_date: productData.purchaseDate instanceof Date ? productData.purchaseDate.toISOString() : new Date().toISOString(),
      roi: productData.roi || 0,
      actual_profit: productData.actualProfit || 0,
      days_to_sell: productData.daysToSell || null
    }

    const { data, error } = await this.client
      .from('products')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar produto: ${error.message}`)
    }

    return data
  }

  async getProducts(userId: string) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar produtos: ${error.message}`)
    }

    return data || []
  }

  async updateProduct(userId: string, productId: string, updates: Partial<Product>) {
    const updateData: any = {}
    
    // Mapear campos do Product para campos do banco
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.supplier !== undefined) updateData.supplier = updates.supplier
    if (updates.aliexpressLink !== undefined) updateData.aliexpress_link = updates.aliexpressLink
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.trackingCode !== undefined) updateData.tracking_code = updates.trackingCode
    if (updates.purchaseEmail !== undefined) updateData.purchase_email = updates.purchaseEmail
    if (updates.purchasePrice !== undefined) updateData.purchase_price = updates.purchasePrice
    if (updates.shippingCost !== undefined) updateData.shipping_cost = updates.shippingCost
    if (updates.importTaxes !== undefined) updateData.import_taxes = updates.importTaxes
    if (updates.packagingCost !== undefined) updateData.packaging_cost = updates.packagingCost
    if (updates.marketingCost !== undefined) updateData.marketing_cost = updates.marketingCost
    if (updates.otherCosts !== undefined) updateData.other_costs = updates.otherCosts
    if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice
    // expected_profit e profit_margin são calculados por trigger no banco
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity
    if (updates.quantitySold !== undefined) updateData.quantity_sold = updates.quantitySold
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.purchaseDate !== undefined) {
      updateData.purchase_date = updates.purchaseDate instanceof Date 
        ? updates.purchaseDate.toISOString() 
        : new Date(updates.purchaseDate).toISOString()
    }
    if (updates.roi !== undefined) updateData.roi = updates.roi
    if (updates.actualProfit !== undefined) updateData.actual_profit = updates.actualProfit
    if (updates.daysToSell !== undefined) updateData.days_to_sell = updates.daysToSell

    const { data, error } = await this.client
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar produto: ${error.message}`)
    }

    return data
  }

  async deleteProduct(userId: string, productId: string) {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao deletar produto: ${error.message}`)
    }
  }

  async createSale(userId: string, productId: string, saleData: {
    quantity: number
    unitPrice: number
    totalAmount: number
    date: Date | string
    buyerName?: string
    notes?: string
    productId: string
  }) {
    const safeQuantity = Number.isFinite(saleData.quantity) ? Math.max(1, Math.floor(Number(saleData.quantity))) : 1
    let safeUnit = Number(saleData.unitPrice)
    if (!Number.isFinite(safeUnit) || safeUnit < 0) safeUnit = 0
    safeUnit = Math.min(999999.99, Number(safeUnit.toFixed(2)))
    const insertData = {
      user_id: userId,
      product_id: productId,
      quantity: safeQuantity,
      unit_price: safeUnit,
      date: (saleData.date instanceof Date ? saleData.date : new Date(saleData.date)).toISOString(),
      buyer_name: saleData.buyerName || null
    }

    const { data, error } = await this.client
      .from('sales')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (String(error.message || '').toLowerCase().includes('numeric field overflow')) {
        const retryUnit = Math.min(safeUnit, 999999.99)
        const retryData = {
          user_id: userId,
          product_id: productId,
          quantity: safeQuantity,
          unit_price: retryUnit,
          date: (saleData.date instanceof Date ? saleData.date : new Date(saleData.date)).toISOString(),
          buyer_name: saleData.buyerName || null
        }
        const retry = await this.client
          .from('sales')
          .insert(retryData)
          .select()
          .single()
        if (retry.error) {
          throw new Error('Erro ao criar venda: valores excedem limites permitidos')
        }
        return retry.data
      }
      if (String(error.message || '').toLowerCase().includes('cannot insert a non-default value into column')) {
        throw new Error('Erro ao criar venda: coluna gerada não aceita valor manual')
      }
      throw new Error(`Erro ao criar venda: ${error.message}`)
    }

    return data
  }

  // =====================================
  // GOAL OPERATIONS
  // =====================================

  async createGoal(userId: string, goalData: Omit<Goal, 'id' | 'milestones' | 'reminders'>) {
    const insertData = {
      user_id: userId,
      name: goalData.name,
      description: goalData.description,
      category: goalData.category,
      type: goalData.type,
      target_value: goalData.targetValue,
      current_value: goalData.currentValue || 0,
      unit: goalData.unit,
      deadline: goalData.deadline ? new Date(goalData.deadline).toISOString() : null,
      priority: goalData.priority || 'medium',
      status: goalData.status || 'active',
      notes: goalData.notes || '',
      tags: goalData.tags || [],
      linked_product_ids: goalData.linkedEntities?.products || [],
      linked_dream_ids: goalData.linkedEntities?.dreams || [],
      linked_transaction_ids: goalData.linkedEntities?.transactions || [],
      created_date: goalData.createdDate ? new Date(goalData.createdDate).toISOString() : new Date().toISOString()
    }

    const { data, error } = await this.client
      .from('goals')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar meta: ${error.message}`)
    }

    return data
  }

  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar metas: ${error.message}`)
    }

    // Mapear campos do banco para o tipo Goal
    return (data || []).map(goal => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      category: goal.category,
      type: goal.type,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      unit: goal.unit,
      deadline: goal.deadline,
      createdDate: goal.created_date,
      priority: goal.priority,
      status: goal.status,
      notes: goal.notes,
      tags: goal.tags || [],
      linkedEntities: {
        products: goal.linked_product_ids || [],
        dreams: goal.linked_dream_ids || [],
        transactions: goal.linked_transaction_ids || []
      },
      milestones: [], // Será implementado quando necessário
      reminders: []   // Será implementado quando necessário
    }))
  }

  async updateGoal(userId: string, goalId: string, updates: Partial<Goal>) {
    const updateData: any = {}
    
    // Mapear campos do Goal para campos do banco
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.targetValue !== undefined) updateData.target_value = updates.targetValue
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue
    if (updates.unit !== undefined) updateData.unit = updates.unit
    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline ? new Date(updates.deadline).toISOString() : null
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.linkedEntities?.products !== undefined) updateData.linked_product_ids = updates.linkedEntities.products
    if (updates.linkedEntities?.dreams !== undefined) updateData.linked_dream_ids = updates.linkedEntities.dreams
    if (updates.linkedEntities?.transactions !== undefined) updateData.linked_transaction_ids = updates.linkedEntities.transactions

    const { data, error } = await this.client
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar meta: ${error.message}`)
    }

    return data
  }

  async deleteGoal(userId: string, goalId: string) {
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao deletar meta: ${error.message}`)
    }
  }
}

export const supabaseService = new SupabaseService(false)
// Only create the admin service on the server to prevent browser-side duplication
export const supabaseAdminService = isServer
  ? new SupabaseService(true)
  : (undefined as unknown as SupabaseService)
