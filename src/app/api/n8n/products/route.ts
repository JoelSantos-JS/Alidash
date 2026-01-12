import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'
import { authenticateN8NRequest, hasPermission, N8N_PERMISSIONS } from '@/lib/n8n-auth'
import type { Product } from '@/types'

/**
 * Interface para dados do N8N
 */
interface N8NProductData {
  userId: string
  dataType: 'product'
  action: 'create' | 'update' | 'delete' | 'sync'
  data: Partial<Product> | Product[]
  timestamp: Date
  source: 'n8n'
  metadata?: {
    batchId?: string
    syncType?: 'full' | 'incremental'
    externalId?: string
  }
}

function normalizeProductInput(input: Partial<Product>): Partial<Product> {
  const out: Partial<Product> = { ...input }
  const purchaseDate: unknown = (input as any).purchaseDate
  if (typeof purchaseDate === 'string') {
    const d = new Date(purchaseDate)
    out.purchaseDate = isNaN(d.getTime()) ? undefined : d
  }
  return out
}

function normalizeProductsInput(input: Product[]): Product[] {
  return input.map(p => {
    const normalized = normalizeProductInput(p) as Product
    if (!normalized.sales) normalized.sales = []
    normalized.sales = (normalized.sales || []).map(s => ({
      ...s,
      date: typeof (s as any).date === 'string' ? new Date((s as any).date) : s.date
    }))
    return normalized
  })
}

function toApiProduct(row: any): Product {
  const purchaseDate = row.purchase_date ? new Date(row.purchase_date) : new Date()
  return {
    id: String(row.id),
    name: String(row.name || ''),
    category: String(row.category || ''),
    supplier: String(row.supplier || ''),
    aliexpressLink: String(row.aliexpress_link || ''),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    images: Array.isArray(row.images) ? row.images : undefined,
    description: String(row.description || ''),
    notes: row.notes ? String(row.notes) : undefined,
    trackingCode: row.tracking_code ? String(row.tracking_code) : undefined,
    purchaseEmail: row.purchase_email ? String(row.purchase_email) : undefined,
    isPublic: row.is_public ?? undefined,
    purchasePrice: Number(row.purchase_price || 0),
    shippingCost: Number(row.shipping_cost || 0),
    importTaxes: Number(row.import_taxes || 0),
    packagingCost: Number(row.packaging_cost || 0),
    marketingCost: Number(row.marketing_cost || 0),
    otherCosts: Number(row.other_costs || 0),
    totalCost: Number(row.total_cost || 0),
    sellingPrice: Number(row.selling_price || 0),
    expectedProfit: Number(row.expected_profit || 0),
    profitMargin: Number(row.profit_margin || 0),
    sales: [],
    quantity: Number(row.quantity || 0),
    quantitySold: Number(row.quantity_sold || 0),
    status: (row.status || 'purchased') as Product['status'],
    purchaseDate: isNaN(purchaseDate.getTime()) ? new Date() : purchaseDate,
    roi: Number(row.roi || 0),
    actualProfit: Number(row.actual_profit || 0),
    daysToSell: row.days_to_sell ?? undefined
  }
}

/**
 * GET - Obter produtos para N8N
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar requisição
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar permissões
    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.PRODUCTS_READ)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = authResult.userId!
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const lastSync = url.searchParams.get('lastSync')

    // Get user from Supabase
    const user = await supabaseAdminService.getUserByFirebaseUid(userId)
    if (!user) {
      return NextResponse.json({ products: [], total: 0, lastSync: new Date().toISOString() })
    }

    const admin = supabaseAdminService.getClient()
    let query = admin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (lastSync) query = query.gte('updated_at', lastSync)

    const { data, error, count } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const apiProducts = (data || []).map(toApiProduct)
    const n8nProducts = apiProducts.map(product => ({
      ...product,
      purchaseDate: product.purchaseDate.toISOString(),
      sales: (product.sales || []).map(sale => ({
        ...sale,
        date: sale.date.toISOString()
      }))
    }))

    return NextResponse.json({
      products: n8nProducts,
      total: count || n8nProducts.length,
      returned: n8nProducts.length,
      lastSync: new Date().toISOString(),
      filters: { status, category, lastSync }
    })

  } catch (error) {
    console.error('Erro ao obter produtos para N8N:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * POST - Criar/Atualizar produtos via N8N
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar requisição
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar permissões
    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.PRODUCTS_WRITE)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const requestData: N8NProductData = await request.json()
    const userId = authResult.userId!

    // Validar dados
    if (!requestData.action || !requestData.data) {
      return NextResponse.json({ error: 'action e data são obrigatórios' }, { status: 400 })
    }

    const user = await supabaseAdminService.getUserByFirebaseUid(userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const adminUserId = user.id as string
    let result: any = { success: true }

    switch (requestData.action) {
      case 'create':
        const createInput = normalizeProductInput(requestData.data as Partial<Product>)
        const toCreate = {
          name: createInput.name || '',
          category: createInput.category || '',
          supplier: createInput.supplier || '',
          aliexpressLink: createInput.aliexpressLink || '',
          imageUrl: createInput.imageUrl,
          images: createInput.images,
          description: createInput.description || '',
          notes: createInput.notes,
          trackingCode: createInput.trackingCode,
          purchaseEmail: createInput.purchaseEmail,
          isPublic: createInput.isPublic,
          purchasePrice: createInput.purchasePrice || 0,
          shippingCost: createInput.shippingCost || 0,
          importTaxes: createInput.importTaxes || 0,
          packagingCost: createInput.packagingCost || 0,
          marketingCost: createInput.marketingCost || 0,
          otherCosts: createInput.otherCosts || 0,
          totalCost: createInput.totalCost || 0,
          sellingPrice: createInput.sellingPrice || 0,
          expectedProfit: createInput.expectedProfit || 0,
          profitMargin: createInput.profitMargin || 0,
          sales: [],
          quantity: createInput.quantity || 0,
          quantitySold: createInput.quantitySold || 0,
          status: (createInput.status || 'purchased') as Product['status'],
          purchaseDate: createInput.purchaseDate instanceof Date ? createInput.purchaseDate : new Date(),
          roi: createInput.roi || 0,
          actualProfit: createInput.actualProfit || 0,
          daysToSell: createInput.daysToSell
        } as Omit<Product, 'id'>
        const created = await supabaseAdminService.createProduct(adminUserId, toCreate)
        result.created = created?.id || null
        break

      case 'update':
        const updateInput = normalizeProductInput(requestData.data as Partial<Product>)
        const productId = String((updateInput as any).id || '')
        if (!productId) {
          return NextResponse.json({ error: 'id do produto é obrigatório' }, { status: 400 })
        }
        await supabaseAdminService.updateProduct(adminUserId, productId, updateInput)
        result.updated = productId
        break

      case 'sync':
        {
          const syncProducts = normalizeProductsInput(requestData.data as Product[])
          let created = 0
          let updated = 0
          for (const p of syncProducts) {
            const id = String((p as any).id || '')
            if (id) {
              await supabaseAdminService.updateProduct(adminUserId, id, p)
              updated++
            } else {
              const createdRow = await supabaseAdminService.createProduct(adminUserId, p as any)
              if (createdRow?.id) created++
            }
          }
          result.synced = syncProducts.length
          result.created = created
          result.updated = updated
        }
        break

      case 'delete':
        {
          const deleteId = String((requestData.data as any)?.id || '')
          if (!deleteId) {
            return NextResponse.json({ error: 'id do produto é obrigatório' }, { status: 400 })
          }
          await supabaseAdminService.deleteProduct(adminUserId, deleteId)
          result.deleted = deleteId
        }
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    // Log da operação
    console.log(`N8N ${requestData.action} operation for user ${userId}:`, result)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      totalProducts: undefined
    })

  } catch (error) {
    console.error('Erro ao processar produtos via N8N:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PUT - Sincronização em lote
 */
export async function PUT(request: NextRequest) {
  try {
    // Autenticar requisição
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar permissões
    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.PRODUCTS_WRITE)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const { products, syncType = 'incremental' } = await request.json()
    const userId = authResult.userId!

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'products deve ser um array' }, { status: 400 })
    }

    const user = await supabaseAdminService.getUserByFirebaseUid(userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    const adminUserId = user.id as string

    let created = 0
    let updated = 0
    let skipped = 0

    for (const product of products) {
      const p = normalizeProductInput(product as Partial<Product>)
      const id = String((p as any).id || '')
      if (id) {
        if (syncType === 'incremental') {
          await supabaseAdminService.updateProduct(adminUserId, id, p)
          updated++
        } else {
          skipped++
        }
      } else {
        await supabaseAdminService.createProduct(adminUserId, p as any)
        created++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      total: created + updated + skipped,
      syncType,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na sincronização em lote:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
