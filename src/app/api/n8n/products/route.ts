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

    // Get products with filters
    const filters: any = {}
    if (lastSync) {
      const lastSyncDate = new Date(lastSync)
      filters.startDate = lastSyncDate
    }

    let products = await supabaseAdminService.getProducts(user.id)

    // Apply additional filters
    if (status) {
      products = products.filter(p => p.status === status)
    }
    if (category) {
      products = products.filter(p => p.category === category)
    }

    // Apply limit
    const limitedProducts = products.slice(0, limit)

    // Formatar dados para N8N
    const n8nProducts = limitedProducts.map(product => ({
      ...product,
      purchaseDate: product.purchaseDate instanceof Date 
        ? product.purchaseDate.toISOString() 
        : (product.purchaseDate as any).toDate().toISOString(),
      sales: product.sales.map(sale => ({
        ...sale,
        date: sale.date instanceof Date 
          ? sale.date.toISOString() 
          : (sale.date as any).toDate().toISOString()
      }))
    }))

    return NextResponse.json({
      products: n8nProducts,
      total: products.length,
      returned: limitedProducts.length,
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

    // Buscar dados atuais do usuário
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    const userData = userDocSnap.exists() ? userDocSnap.data() : {}
    let products: Product[] = userData.products || []

    let result: any = { success: true }

    switch (requestData.action) {
      case 'create':
        const newProduct = requestData.data as Product
        // Converter datas string para Date objects
        newProduct.purchaseDate = typeof newProduct.purchaseDate === 'string' 
          ? new Date(newProduct.purchaseDate) 
          : newProduct.purchaseDate
        newProduct.sales = newProduct.sales?.map(sale => ({
          ...sale,
          date: typeof sale.date === 'string' ? new Date(sale.date) : sale.date
        })) || []
        
        products.push(newProduct)
        result.created = newProduct.id
        break

      case 'update':
        const updateProduct = requestData.data as Product
        const updateIndex = products.findIndex(p => p.id === updateProduct.id)
        
        if (updateIndex === -1) {
          return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }
        
        // Converter datas
        updateProduct.purchaseDate = typeof updateProduct.purchaseDate === 'string' 
          ? new Date(updateProduct.purchaseDate) 
          : updateProduct.purchaseDate
        updateProduct.sales = updateProduct.sales?.map(sale => ({
          ...sale,
          date: typeof sale.date === 'string' ? new Date(sale.date) : sale.date
        })) || []
        
        products[updateIndex] = updateProduct
        result.updated = updateProduct.id
        break

      case 'sync':
        const syncProducts = requestData.data as Product[]
        // Sincronização completa - substituir todos os produtos
        products = syncProducts.map(product => ({
          ...product,
          purchaseDate: typeof product.purchaseDate === 'string' 
            ? new Date(product.purchaseDate) 
            : product.purchaseDate,
          sales: product.sales?.map(sale => ({
            ...sale,
            date: typeof sale.date === 'string' ? new Date(sale.date) : sale.date
          })) || []
        }))
        result.synced = products.length
        break

      case 'delete':
        const deleteId = (requestData.data as any).id
        const deleteIndex = products.findIndex(p => p.id === deleteId)
        
        if (deleteIndex === -1) {
          return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
        }
        
        products.splice(deleteIndex, 1)
        result.deleted = deleteId
        break

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    // Salvar dados atualizados
    await setDoc(userDocRef, {
      ...userData,
      products,
      lastUpdated: new Date(),
      lastN8NSync: new Date()
    }, { merge: true })

    // Log da operação
    console.log(`N8N ${requestData.action} operation for user ${userId}:`, result)

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      totalProducts: products.length
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

    // Buscar dados atuais
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    const userData = userDocSnap.exists() ? userDocSnap.data() : {}
    let currentProducts: Product[] = userData.products || []

    let created = 0
    let updated = 0
    let skipped = 0

    for (const product of products) {
      // Converter datas
      product.purchaseDate = typeof product.purchaseDate === 'string' 
        ? new Date(product.purchaseDate) 
        : product.purchaseDate
      product.sales = product.sales?.map((sale: any) => ({
        ...sale,
        date: typeof sale.date === 'string' ? new Date(sale.date) : sale.date
      })) || []

      const existingIndex = currentProducts.findIndex(p => p.id === product.id)
      
      if (existingIndex >= 0) {
        if (syncType === 'incremental') {
          // Verificar se precisa atualizar (comparar timestamps ou versões)
          currentProducts[existingIndex] = product
          updated++
        } else {
          skipped++
        }
      } else {
        currentProducts.push(product)
        created++
      }
    }

    // Salvar dados
    await setDoc(userDocRef, {
      ...userData,
      products: currentProducts,
      lastUpdated: new Date(),
      lastN8NSync: new Date()
    }, { merge: true })

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      total: currentProducts.length,
      syncType,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na sincronização em lote:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}