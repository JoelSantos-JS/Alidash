import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * Interface para eventos que serão enviados para N8N
 */
export interface N8NEvent {
  eventType: string
  userId: string
  data: Record<string, unknown>
  timestamp: Date
  source: 'voxcash'
  metadata?: {
    userAgent?: string
    ip?: string
    sessionId?: string
  }
}

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
}

/**
 * Tipos de eventos suportados
 */
export const EVENT_TYPES = {
  // Produtos
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_SOLD: 'product.sold',
  PRODUCT_STATUS_CHANGED: 'product.status_changed',
  
  // Metas
  GOAL_CREATED: 'goal.created',
  GOAL_UPDATED: 'goal.updated',
  GOAL_COMPLETED: 'goal.completed',
  GOAL_MILESTONE_REACHED: 'goal.milestone_reached',
  
  // Transações
  TRANSACTION_CREATED: 'transaction.created',
  REVENUE_ADDED: 'revenue.added',
  EXPENSE_ADDED: 'expense.added',
  
  // Sonhos
  DREAM_CREATED: 'dream.created',
  DREAM_UPDATED: 'dream.updated',
  DREAM_PROGRESS_UPDATED: 'dream.progress_updated',
  
  // Apostas
  BET_PLACED: 'bet.placed',
  BET_WON: 'bet.won',
  BET_LOST: 'bet.lost',
  SUREBET_FOUND: 'surebet.found',
  
  // Sistema
  USER_REGISTERED: 'user.registered',
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',
  BACKUP_COMPLETED: 'backup.completed'
} as const

/**
 * Enviar evento para N8N
 */
export async function sendN8NEvent(eventType: string, userId: string, data: Record<string, unknown>, metadata?: Record<string, unknown>) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    // Buscar configurações de webhook do usuário
    const { data: webhookData, error } = await supabase
      .from('user_webhooks')
      .select('webhooks')
      .eq('user_id', userId)
      .single()
    
    if (error || !webhookData) {
      console.log(`Nenhum webhook configurado para usuário ${userId}`)
      return
    }
    
    const webhooks: WebhookConfig[] = webhookData.webhooks || []
    const activeWebhooks = webhooks.filter(wh => wh.isActive && wh.events.includes(eventType))
    
    if (activeWebhooks.length === 0) {
      console.log(`Nenhum webhook ativo para evento ${eventType} do usuário ${userId}`)
      return
    }
    
    // Criar evento
    const event: N8NEvent = {
      eventType,
      userId,
      data,
      timestamp: new Date(),
      source: 'voxcash',
      metadata
    }
    
    // Enviar para cada webhook configurado
    const promises = activeWebhooks.map(webhook => sendWebhook(supabase, webhook, event))
    await Promise.allSettled(promises)
    
    // Log do evento
    await supabase.from('webhook_events').insert({
      event_type: event.eventType,
      user_id: event.userId,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      source: event.source,
      metadata: event.metadata,
      webhooks_sent: activeWebhooks.length,
      status: 'sent'
    })
    
    console.log(`Evento ${eventType} enviado para ${activeWebhooks.length} webhook(s)`)
    
  } catch (error) {
    console.error('Erro ao enviar evento N8N:', error)
    
    // Log do erro
    const errorMessage = error instanceof Error ? error.message : String(error)
    await supabase.from('webhook_events').insert({
      event_type: eventType,
      user_id: userId,
      data,
      timestamp: new Date().toISOString(),
      source: 'voxcash',
      status: 'failed',
      error: errorMessage
    })
  }
}

/**
 * Enviar webhook para uma URL específica
 */
async function sendWebhook(supabase: ReturnType<typeof createClient>, webhook: WebhookConfig, event: N8NEvent) {
  const maxRetries = webhook.retryConfig?.maxRetries || 3
  const retryDelay = webhook.retryConfig?.retryDelay || 1000
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'VoxCash-Webhook/1.0',
        'X-VoxCash-Event': event.eventType,
        'X-VoxCash-Timestamp': event.timestamp.toISOString(),
        'X-VoxCash-Signature': generateSignature(event, webhook.secret),
        ...webhook.headers
      }
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      })
      
      if (response.ok) {
        console.log(`Webhook enviado com sucesso para ${webhook.url} (tentativa ${attempt})`)
        return
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error(`Erro ao enviar webhook para ${webhook.url} (tentativa ${attempt}):`, error)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      } else {
        // Log do erro final
        const errorMessage = error instanceof Error ? error.message : String(error)
        await supabase.from('webhook_failures').insert({
          webhook_id: webhook.id,
          url: webhook.url,
          event,
          error: errorMessage,
          attempts: maxRetries,
          timestamp: new Date().toISOString()
        })
      }
    }
  }
}

/**
 * Gerar assinatura para validação do webhook
 */
function generateSignature(event: N8NEvent, secret?: string): string {
  if (!secret) return ''
  
  const payload = JSON.stringify(event)
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Funções auxiliares para eventos específicos
 */

export async function notifyGoalCreated(userId: string, goal: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.GOAL_CREATED, userId, {
    goalId: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline,
    category: goal.category,
    priority: goal.priority
  })
}

export async function notifyGoalUpdated(userId: string, goal: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.GOAL_UPDATED, userId, {
    goalId: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline,
    category: goal.category,
    priority: goal.priority,
    progress: goal.currentAmount && goal.targetAmount ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0
  })
}

export async function notifyProductCreated(userId: string, product: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.PRODUCT_CREATED, userId, {
    product: {
      id: product.id,
      name: product.name,
      category: product.category,
      totalCost: product.totalCost,
      sellingPrice: product.sellingPrice,
      expectedProfit: product.expectedProfit,
      status: product.status
    }
  })
}

export async function notifyProductUpdated(userId: string, product: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.PRODUCT_UPDATED, userId, {
    productId: product.id,
    name: product.name,
    category: product.category,
    supplier: product.supplier,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    expectedProfit: product.expectedProfit,
    profitMargin: product.profitMargin,
    quantity: product.quantity,
    status: product.status
  })
}

export async function notifyProductSold(userId: string, product: Record<string, unknown>, sale: Record<string, unknown>) {
  const quantity = Number(sale.quantity) || 0
  const sellingPrice = Number(product.sellingPrice) || 0
  const totalCost = Number(product.totalCost) || 0
  await sendN8NEvent(EVENT_TYPES.PRODUCT_SOLD, userId, {
    product: {
      id: product.id,
      name: product.name,
      category: product.category
    },
    sale: {
      id: sale.id,
      quantity: sale.quantity,
      date: sale.date,
      buyerName: sale.buyerName,
      revenue: quantity * sellingPrice,
      profit: (quantity * sellingPrice) - (quantity * totalCost)
    }
  })
}

export async function notifyGoalCompleted(userId: string, goal: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.GOAL_COMPLETED, userId, {
    goal: {
      id: goal.id,
      name: goal.name,
      category: goal.category,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      completedDate: new Date(),
      daysToComplete: Math.floor((new Date().getTime() - new Date(String(goal.createdDate)).getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

export async function notifyGoalAchieved(userId: string, goal: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.GOAL_COMPLETED, userId, {
    goalId: goal.id,
    title: goal.title,
    targetAmount: goal.targetAmount,
    achievedAmount: goal.currentAmount,
    achievedDate: new Date().toISOString(),
    category: goal.category,
    timeTaken: goal.deadline ? Math.floor((new Date().getTime() - new Date(String(goal.createdAt)).getTime()) / (1000 * 60 * 60 * 24)) : null
  })
}

export async function notifyGoalMilestoneReached(userId: string, goal: Record<string, unknown>, milestone: Record<string, unknown>) {
  await sendN8NEvent(EVENT_TYPES.GOAL_MILESTONE_REACHED, userId, {
    goalId: goal.id,
    goalTitle: goal.title,
    milestoneId: milestone.id,
    milestoneTitle: milestone.title,
    milestoneAmount: milestone.amount,
    currentProgress: goal.currentAmount,
    totalTarget: goal.targetAmount,
    progressPercentage: goal.currentAmount && goal.targetAmount ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0
  })
}

export async function notifyTransactionCreated(userId: string, transaction: any) {
  await sendN8NEvent(EVENT_TYPES.TRANSACTION_CREATED, userId, {
    transaction: {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date
    }
  })
}

export async function notifyDreamProgressUpdated(userId: string, dream: any, previousAmount: number) {
  const progressIncrease = dream.currentAmount - previousAmount
  const progressPercentage = (dream.currentAmount / dream.targetAmount) * 100
  
  await sendN8NEvent(EVENT_TYPES.DREAM_PROGRESS_UPDATED, userId, {
    dream: {
      id: dream.id,
      name: dream.name,
      type: dream.type,
      targetAmount: dream.targetAmount,
      currentAmount: dream.currentAmount,
      progressPercentage,
      progressIncrease
    }
  })
}

export async function notifyBetPlaced(userId: string, bet: any) {
  await sendN8NEvent(EVENT_TYPES.BET_PLACED, userId, {
    bet: {
      id: bet.id,
      type: bet.type,
      sport: bet.sport,
      event: bet.event,
      stake: bet.type === 'single' ? bet.stake : bet.totalStake,
      potentialReturn: bet.type === 'single' ? (bet.stake * bet.odds) : bet.guaranteedProfit,
      date: bet.date
    }
  })
}

export async function notifyBetWon(userId: string, bet: any) {
  const winAmount = bet.type === 'single' ? (bet.stake * bet.odds) : bet.guaranteedProfit
  
  await sendN8NEvent(EVENT_TYPES.BET_WON, userId, {
    bet: {
      id: bet.id,
      type: bet.type,
      sport: bet.sport,
      event: bet.event,
      stake: bet.type === 'single' ? bet.stake : bet.totalStake,
      winAmount,
      profit: winAmount - (bet.type === 'single' ? bet.stake : bet.totalStake)
    }
  })
}

export async function notifySurebetFound(userId: string, surebetData: any) {
  await sendN8NEvent(EVENT_TYPES.SUREBET_FOUND, userId, {
    surebet: {
      sport: surebetData.sport,
      event: surebetData.event,
      guaranteedProfit: surebetData.guaranteedProfit,
      profitPercentage: surebetData.profitPercentage,
      bookmakers: surebetData.bookmakers,
      expiresAt: surebetData.expiresAt
    }
  })
}

export async function notifyUserRegistered(userId: string, userData: any) {
  await sendN8NEvent(EVENT_TYPES.USER_REGISTERED, userId, {
    user: {
      id: userId,
      email: userData.email,
      accountType: userData.accountType || 'personal',
      registeredAt: new Date()
    }
  })
}

export async function notifySubscriptionUpgraded(userId: string, subscriptionData: any) {
  await sendN8NEvent(EVENT_TYPES.SUBSCRIPTION_UPGRADED, userId, {
    subscription: {
      plan: subscriptionData.plan,
      startedAt: subscriptionData.startedAt,
      expiresAt: subscriptionData.expiresAt,
      upgradedAt: new Date()
    }
  })
}

export async function notifyBackupCompleted(userId: string, backupData: any) {
  await sendN8NEvent(EVENT_TYPES.BACKUP_COMPLETED, userId, {
    backup: {
      itemCounts: backupData.itemCounts,
      lastSync: backupData.lastSync,
      success: backupData.success
    }
  })
}
