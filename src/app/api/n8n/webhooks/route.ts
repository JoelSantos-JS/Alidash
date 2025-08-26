import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import { authenticateN8NRequest, hasPermission, N8N_PERMISSIONS } from '@/lib/n8n-auth'

/**
 * Interface para configuração de webhook
 */
interface WebhookConfig {
  id: string
  userId: string
  url: string
  events: string[]
  isActive: boolean
  secret?: string
  headers?: Record<string, string>
  retryConfig?: {
    maxRetries: number
    retryDelay: number
  }
  createdAt: Date
  lastTriggered?: Date
}

/**
 * Interface para evento de webhook
 */
interface WebhookEvent {
  id: string
  userId: string
  eventType: string
  data: any
  timestamp: Date
  source: 'alidash' | 'n8n'
  webhookId?: string
  status?: 'pending' | 'sent' | 'failed' | 'retry'
}

/**
 * POST - Receber dados do N8N via webhook
 */
export async function POST(request: NextRequest) {
  let authResult: any = { success: false }
  
  try {
    // Autenticar requisição
    authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar permissões
    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.WEBHOOKS_MANAGE)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const webhookData = await request.json()
    const userId = authResult.userId!

    // Validar dados do webhook
    if (!webhookData.eventType || !webhookData.data) {
      return NextResponse.json({ error: 'eventType e data são obrigatórios' }, { status: 400 })
    }

    // Processar diferentes tipos de eventos
    let result: any = { success: true }

    switch (webhookData.eventType) {
      case 'product.aliexpress.update':
        result = await handleAliExpressProductUpdate(userId, webhookData.data)
        break

      case 'product.tracking.update':
        result = await handleTrackingUpdate(userId, webhookData.data)
        break

      case 'goal.progress.update':
        result = await handleGoalProgressUpdate(userId, webhookData.data)
        break

      case 'analytics.report':
        result = await handleAnalyticsReport(userId, webhookData.data)
        break

      case 'automation.trigger':
        result = await handleAutomationTrigger(userId, webhookData.data)
        break

      default:
        return NextResponse.json({ error: 'Tipo de evento não suportado' }, { status: 400 })
    }

    // Registrar evento
    const event: WebhookEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      eventType: webhookData.eventType,
      data: webhookData.data,
      timestamp: new Date(),
      source: 'n8n',
      status: result.success ? 'sent' : 'failed'
    }

    await addDoc(collection(db, 'webhook-events'), event)

    return NextResponse.json({
      ...result,
      eventId: event.id,
      timestamp: event.timestamp.toISOString()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao processar webhook do N8N:', {
      error: errorMessage,
      userId: authResult?.userId || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}

/**
 * GET - Configurar webhooks para envio
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.WEBHOOKS_MANAGE)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const userId = authResult.userId!
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'list') {
      // Listar webhooks configurados
      const webhooksDoc = await getDoc(doc(db, 'user-webhooks', userId))
      const webhooks = webhooksDoc.exists() ? webhooksDoc.data().webhooks || [] : []
      
      return NextResponse.json({ webhooks })
    }

    return NextResponse.json({ error: 'Ação não especificada' }, { status: 400 })

  } catch (error) {
    console.error('Erro ao obter configurações de webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PUT - Configurar webhook para envio de eventos
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.WEBHOOKS_MANAGE)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const { url, events, secret, headers, retryConfig } = await request.json()
    const userId = authResult.userId!

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'url e events são obrigatórios' }, { status: 400 })
    }

    // Validar eventos suportados
    const supportedEvents = [
      'product.created',
      'product.updated',
      'product.sold',
      'goal.created',
      'goal.completed',
      'transaction.created',
      'dream.created',
      'bet.placed',
      'bet.won'
    ]

    const invalidEvents = events.filter((e: string) => !supportedEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Eventos não suportados: ${invalidEvents.join(', ')}` 
      }, { status: 400 })
    }

    const webhookConfig: WebhookConfig = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      url,
      events,
      isActive: true,
      secret,
      headers,
      retryConfig: retryConfig || { maxRetries: 3, retryDelay: 1000 },
      createdAt: new Date()
    }

    // Salvar configuração
    const webhooksDocRef = doc(db, 'user-webhooks', userId)
    const webhooksDoc = await getDoc(webhooksDocRef)
    const existingData = webhooksDoc.exists() ? webhooksDoc.data() : {}
    const webhooks = existingData.webhooks || []
    
    webhooks.push(webhookConfig)
    
    await setDoc(webhooksDocRef, { webhooks }, { merge: true })

    return NextResponse.json({
      success: true,
      webhookId: webhookConfig.id,
      supportedEvents
    })

  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * Handlers para diferentes tipos de eventos
 */

async function handleAliExpressProductUpdate(userId: string, data: any) {
  try {
    const { productId, updates } = data
    
    // Buscar produto atual
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    
    if (!userDocSnap.exists()) {
      return { success: false, error: 'Usuário não encontrado' }
    }
    
    const userData = userDocSnap.data()
    const products = userData.products || []
    const productIndex = products.findIndex((p: any) => p.id === productId)
    
    if (productIndex === -1) {
      return { success: false, error: 'Produto não encontrado' }
    }
    
    // Atualizar produto com dados do AliExpress
    products[productIndex] = { ...products[productIndex], ...updates }
    
    await setDoc(userDocRef, { ...userData, products }, { merge: true })
    
    return { success: true, updated: productId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

async function handleTrackingUpdate(userId: string, data: any) {
  try {
    const { trackingCode, status, location, estimatedDelivery } = data
    
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    
    if (!userDocSnap.exists()) {
      return { success: false, error: 'Usuário não encontrado' }
    }
    
    const userData = userDocSnap.data()
    const products = userData.products || []
    const productIndex = products.findIndex((p: any) => p.trackingCode === trackingCode)
    
    if (productIndex === -1) {
      return { success: false, error: 'Produto com tracking não encontrado' }
    }
    
    // Atualizar status do produto baseado no tracking
    if (status === 'delivered') {
      products[productIndex].status = 'received'
    } else if (status === 'in_transit') {
      products[productIndex].status = 'shipping'
    }
    
    // Adicionar informações de tracking
    products[productIndex].trackingInfo = {
      status,
      location,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      lastUpdate: new Date()
    }
    
    await setDoc(userDocRef, { ...userData, products }, { merge: true })
    
    return { success: true, updated: trackingCode }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

async function handleGoalProgressUpdate(userId: string, data: any) {
  try {
    const { goalId, newValue, milestone } = data
    
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    
    if (!userDocSnap.exists()) {
      return { success: false, error: 'Usuário não encontrado' }
    }
    
    const userData = userDocSnap.data()
    const goals = userData.goals || []
    const goalIndex = goals.findIndex((g: any) => g.id === goalId)
    
    if (goalIndex === -1) {
      return { success: false, error: 'Meta não encontrada' }
    }
    
    // Atualizar progresso da meta
    goals[goalIndex].currentValue = newValue
    
    if (milestone) {
      goals[goalIndex].milestones = goals[goalIndex].milestones || []
      goals[goalIndex].milestones.push({
        ...milestone,
        completedDate: new Date()
      })
    }
    
    await setDoc(userDocRef, { ...userData, goals }, { merge: true })
    
    return { success: true, updated: goalId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

async function handleAnalyticsReport(userId: string, data: any) {
  try {
    // Salvar relatório de analytics
    const reportDoc = {
      userId,
      reportType: data.type,
      data: data.report,
      generatedAt: new Date(),
      source: 'n8n'
    }
    
    await addDoc(collection(db, 'analytics-reports'), reportDoc)
    
    return { success: true, reportSaved: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

async function handleAutomationTrigger(userId: string, data: any) {
  try {
    // Processar trigger de automação
    const { triggerType, payload } = data
    
    // Log do trigger
    await addDoc(collection(db, 'automation-logs'), {
      userId,
      triggerType,
      payload,
      timestamp: new Date(),
      source: 'n8n'
    })
    
    return { success: true, triggered: triggerType }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}