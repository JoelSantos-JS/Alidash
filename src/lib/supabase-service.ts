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
} from '../types'

// Environment variables validation
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
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Simplified Supabase Service Layer
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
    id?: string
    email: string
    name?: string | null
    avatar_url?: string | null
    account_type?: string
  }) {
    const insertData: any = {
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url,
      account_type: userData.account_type || 'personal'
    }
    
    if (userData.id) {
      insertData.id = userData.id
    }
    
    const { data, error } = await this.client
      .from('users')
      .insert(insertData)
      .select()
      .single()

    if (error) {
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
    const insertData = {
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
      date: transactionData.date.toISOString(),
      is_installment: transactionData.isInstallment || false,
      installment_info: transactionData.installmentInfo || null
    }

    const { data, error } = await this.client
      .from('transactions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`)
    }

    return { success: true, transaction: data }
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
    // Calcular total_cost se não fornecido
    const totalCost = productData.totalCost || 
      (productData.purchasePrice || 0) + 
      (productData.shippingCost || 0) + 
      (productData.importTaxes || 0) + 
      (productData.packagingCost || 0) + 
      (productData.marketingCost || 0) + 
      (productData.otherCosts || 0);

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
    if (updates.totalCost !== undefined) updateData.total_cost = updates.totalCost
    if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice
    if (updates.expectedProfit !== undefined) updateData.expected_profit = updates.expectedProfit
    if (updates.profitMargin !== undefined) updateData.profit_margin = updates.profitMargin
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
    date: Date
    notes?: string
    productId: string
  }) {
    const insertData = {
      user_id: userId,
      product_id: productId,
      quantity: saleData.quantity,
      unit_price: saleData.unitPrice,
      total_amount: saleData.totalAmount,
      date: saleData.date.toISOString(),
      notes: saleData.notes || ''
    }

    const { data, error } = await this.client
      .from('sales')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar venda: ${error.message}`)
    }

    return data
  }
}

export const supabaseService = new SupabaseService(false)
export const supabaseAdminService = new SupabaseService(true)