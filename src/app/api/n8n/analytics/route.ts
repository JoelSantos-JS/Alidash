import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { authenticateN8NRequest, hasPermission, N8N_PERMISSIONS } from '@/lib/n8n-auth'
import type { Product, Goal, Transaction, Dream, Bet } from '@/types'

/**
 * Interface para analytics consolidados
 */
interface AnalyticsData {
  userId: string
  period: {
    start: Date
    end: Date
  }
  products: {
    total: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    totalInvestment: number
    totalRevenue: number
    totalProfit: number
    averageROI: number
    topPerforming: Product[]
  }
  goals: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    byCategory: Record<string, number>
    completionRate: number
  }
  transactions: {
    totalRevenue: number
    totalExpenses: number
    netBalance: number
    transactionCount: number
    byCategory: Record<string, number>
  }
  dreams: {
    total: number
    totalTargetAmount: number
    totalCurrentAmount: number
    progressPercentage: number
    byType: Record<string, number>
  }
  bets: {
    total: number
    won: number
    lost: number
    pending: number
    totalStake: number
    totalReturn: number
    winRate: number
  }
  insights: {
    bestPerformingCategory: string
    worstPerformingCategory: string
    monthlyGrowth: number
    recommendations: string[]
  }
}

/**
 * GET - Obter analytics consolidados
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar requisição
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Verificar permissões
    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.ANALYTICS_READ)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const url = new URL(request.url)
    const userId = authResult.userId!
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const includeInsights = url.searchParams.get('insights') === 'true'

    // Validar datas se fornecidas
    let start: Date, end: Date
    try {
      end = endDate ? new Date(endDate) : new Date()
      start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Validar se as datas são válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Formato de data inválido. Use ISO 8601 (YYYY-MM-DD)' }, { status: 400 })
      }
      
      // Validar se start é anterior a end
      if (start > end) {
        return NextResponse.json({ error: 'Data de início deve ser anterior à data de fim' }, { status: 400 })
      }
      
      // Limitar período máximo a 2 anos
      const maxPeriod = 2 * 365 * 24 * 60 * 60 * 1000 // 2 anos em ms
      if (end.getTime() - start.getTime() > maxPeriod) {
        return NextResponse.json({ error: 'Período máximo permitido é de 2 anos' }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao processar datas fornecidas' }, { status: 400 })
    }

    // Buscar dados do usuário
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'Dados do usuário não encontrados' }, { status: 404 })
    }

    const userData = userDocSnap.data()
    const products: Product[] = userData.products || []
    const goals: Goal[] = userData.goals || []
    const transactions: Transaction[] = userData.transactions || []
    const dreams: Dream[] = userData.dreams || []
    const bets: Bet[] = userData.bets || []

    // Filtrar dados pelo período
    const filteredProducts = products.filter(p => {
      const purchaseDate = new Date(p.purchaseDate)
      return purchaseDate >= start && purchaseDate <= end
    })

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= start && transactionDate <= end
    })

    const filteredBets = bets.filter(b => {
      const betDate = new Date(b.date)
      return betDate >= start && betDate <= end
    })

    // Calcular analytics
    const analytics: AnalyticsData = {
      userId,
      period: { start, end },
      products: calculateProductAnalytics(filteredProducts),
      goals: calculateGoalAnalytics(goals),
      transactions: calculateTransactionAnalytics(filteredTransactions),
      dreams: calculateDreamAnalytics(dreams),
      bets: calculateBetAnalytics(filteredBets),
      insights: includeInsights ? generateInsights(products, goals, transactions, dreams, bets) : {
        bestPerformingCategory: '',
        worstPerformingCategory: '',
        monthlyGrowth: 0,
        recommendations: []
      }
    }

    return NextResponse.json({
      analytics,
      generatedAt: new Date().toISOString(),
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar analytics:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * POST - Gerar relatório customizado
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateN8NRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    if (!hasPermission(authResult.permissions!, N8N_PERMISSIONS.ANALYTICS_READ)) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const { reportType, filters, metrics } = await request.json()
    const userId = authResult.userId!

    // Buscar dados
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'Dados do usuário não encontrados' }, { status: 404 })
    }

    const userData = userDocSnap.data()
    let report: any = {}

    switch (reportType) {
      case 'product_performance':
        report = generateProductPerformanceReport(userData.products || [], filters)
        break

      case 'goal_progress':
        report = generateGoalProgressReport(userData.goals || [], filters)
        break

      case 'financial_summary':
        report = generateFinancialSummaryReport(userData, filters)
        break

      case 'roi_analysis':
        report = generateROIAnalysisReport(userData.products || [], filters)
        break

      case 'category_breakdown':
        report = generateCategoryBreakdownReport(userData, filters)
        break

      default:
        return NextResponse.json({ error: 'Tipo de relatório não suportado' }, { status: 400 })
    }

    return NextResponse.json({
      reportType,
      report,
      filters,
      generatedAt: new Date().toISOString(),
      userId
    })

  } catch (error) {
    console.error('Erro ao gerar relatório customizado:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * Funções auxiliares para cálculos
 */

function calculateProductAnalytics(products: Product[]) {
  const byStatus = products.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byCategory = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalInvestment = products.reduce((sum, p) => sum + (p.totalCost * p.quantity), 0)
  const totalRevenue = products.reduce((sum, p) => {
    return sum + (p.sales?.reduce((saleSum, sale) => saleSum + (sale.quantity * p.sellingPrice), 0) || 0)
  }, 0)
  const totalProfit = totalRevenue - totalInvestment
  const averageROI = products.length > 0 ? products.reduce((sum, p) => sum + p.roi, 0) / products.length : 0

  const topPerforming = products
    .filter(p => p.roi > 0)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)

  return {
    total: products.length,
    byStatus,
    byCategory,
    totalInvestment,
    totalRevenue,
    totalProfit,
    averageROI,
    topPerforming
  }
}

function calculateGoalAnalytics(goals: Goal[]) {
  const completed = goals.filter(g => g.status === 'completed').length
  const inProgress = goals.filter(g => g.status === 'active').length
  const overdue = goals.filter(g => g.status === 'overdue').length

  const byCategory = goals.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const completionRate = goals.length > 0 ? (completed / goals.length) * 100 : 0

  return {
    total: goals.length,
    completed,
    inProgress,
    overdue,
    byCategory,
    completionRate
  }
}

function calculateTransactionAnalytics(transactions: Transaction[]) {
  const revenues = transactions.filter(t => t.type === 'revenue')
  const expenses = transactions.filter(t => t.type === 'expense')

  const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalRevenue - totalExpenses

  const byCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  return {
    totalRevenue,
    totalExpenses,
    netBalance,
    transactionCount: transactions.length,
    byCategory
  }
}

function calculateDreamAnalytics(dreams: Dream[]) {
  const totalTargetAmount = dreams.reduce((sum, d) => sum + d.targetAmount, 0)
  const totalCurrentAmount = dreams.reduce((sum, d) => sum + d.currentAmount, 0)
  const progressPercentage = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

  const byType = dreams.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total: dreams.length,
    totalTargetAmount,
    totalCurrentAmount,
    progressPercentage,
    byType
  }
}

function calculateBetAnalytics(bets: Bet[]) {
  const won = bets.filter(b => b.status === 'won').length
  const lost = bets.filter(b => b.status === 'lost').length
  const pending = bets.filter(b => b.status === 'pending').length

  const totalStake = bets.reduce((sum, b) => {
    if (b.type === 'single') {
      return sum + (b.stake || 0)
    } else {
      return sum + (b.totalStake || 0)
    }
  }, 0)

  const totalReturn = bets
    .filter(b => b.status === 'won')
    .reduce((sum, b) => {
      if (b.type === 'single') {
        return sum + ((b.stake || 0) * (b.odds || 1))
      } else {
        return sum + (b.guaranteedProfit || 0)
      }
    }, 0)

  const winRate = bets.length > 0 ? (won / bets.length) * 100 : 0

  return {
    total: bets.length,
    won,
    lost,
    pending,
    totalStake,
    totalReturn,
    winRate
  }
}

function generateInsights(products: Product[], goals: Goal[], transactions: Transaction[], dreams: Dream[], bets: Bet[]) {
  // Análise de categorias de produtos
  const categoryPerformance = products.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { totalROI: 0, count: 0 }
    }
    acc[p.category].totalROI += p.roi
    acc[p.category].count += 1
    return acc
  }, {} as Record<string, { totalROI: number, count: number }>)

  const categoryAverages = Object.entries(categoryPerformance).map(([category, data]) => ({
    category,
    averageROI: data.totalROI / data.count
  }))

  const bestPerformingCategory = categoryAverages.length > 0 
    ? categoryAverages.sort((a, b) => b.averageROI - a.averageROI)[0].category
    : ''

  const worstPerformingCategory = categoryAverages.length > 0
    ? categoryAverages.sort((a, b) => a.averageROI - b.averageROI)[0].category
    : ''

  // Calcular crescimento mensal (simplificado)
  const monthlyGrowth = products.length > 0 ? 
    products.reduce((sum, p) => sum + p.roi, 0) / products.length : 0

  // Gerar recomendações
  const recommendations: string[] = []
  
  if (categoryAverages.length > 0) {
    recommendations.push(`Foque mais na categoria "${bestPerformingCategory}" que tem o melhor ROI médio`)
    if (worstPerformingCategory !== bestPerformingCategory) {
      recommendations.push(`Revise a estratégia para a categoria "${worstPerformingCategory}" que tem ROI baixo`)
    }
  }

  const completedGoals = goals.filter(g => g.status === 'completed').length
  const totalGoals = goals.length
  if (totalGoals > 0 && (completedGoals / totalGoals) < 0.5) {
    recommendations.push('Considere revisar suas metas - menos de 50% foram concluídas')
  }

  return {
    bestPerformingCategory,
    worstPerformingCategory,
    monthlyGrowth,
    recommendations
  }
}

// Funções para relatórios customizados
function generateProductPerformanceReport(products: Product[], filters: any) {
  // Implementar lógica específica do relatório
  return {
    summary: 'Relatório de performance de produtos',
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      roi: p.roi,
      profit: p.actualProfit,
      status: p.status
    }))
  }
}

function generateGoalProgressReport(goals: Goal[], filters: any) {
  return {
    summary: 'Relatório de progresso de metas',
    data: goals.map(g => ({
      id: g.id,
      name: g.name,
      progress: g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0,
      status: g.status,
      deadline: g.deadline
    }))
  }
}

function generateFinancialSummaryReport(userData: any, filters: any) {
  const products = userData.products || []
  const transactions = userData.transactions || []
  
  return {
    summary: 'Resumo financeiro',
    totalInvestment: products.reduce((sum: number, p: Product) => sum + (p.totalCost * p.quantity), 0),
    totalRevenue: transactions.filter((t: Transaction) => t.type === 'revenue').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
    totalExpenses: transactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0)
  }
}

function generateROIAnalysisReport(products: Product[], filters: any) {
  return {
    summary: 'Análise de ROI',
    averageROI: products.length > 0 ? products.reduce((sum, p) => sum + p.roi, 0) / products.length : 0,
    topProducts: products.sort((a, b) => b.roi - a.roi).slice(0, 10),
    bottomProducts: products.sort((a, b) => a.roi - b.roi).slice(0, 5)
  }
}

function generateCategoryBreakdownReport(userData: any, filters: any) {
  const products = userData.products || []
  
  const breakdown = products.reduce((acc: any, p: Product) => {
    if (!acc[p.category]) {
      acc[p.category] = { count: 0, totalInvestment: 0, totalProfit: 0 }
    }
    acc[p.category].count += 1
    acc[p.category].totalInvestment += p.totalCost * p.quantity
    acc[p.category].totalProfit += p.actualProfit
    return acc
  }, {})
  
  return {
    summary: 'Breakdown por categoria',
    categories: breakdown
  }
}