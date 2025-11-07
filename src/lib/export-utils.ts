import type { Product } from '@/types'

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  includeSales?: boolean
  includeFinancials?: boolean
}

export function exportProductsToCSV(products: Product[], _options: ExportOptions = { format: 'csv' }): string {
  const headers = [
    'ID',
    'Nome',
    'Categoria',
    'Fornecedor',
    'Preço de Compra',
    'Preço de Venda',
    'Quantidade',
    'Quantidade Vendida',
    'Status',
    'Data de Compra',
    'Custo Total',
    'Lucro Esperado',
    'Margem de Lucro (%)',
    'ROI (%)',
    'Link AliExpress',
    'Descrição',
    'Notas'
  ]

  const rows = products.map(product => [
    product.id,
    product.name,
    product.category,
    product.supplier,
    product.purchasePrice,
    product.sellingPrice,
    product.quantity,
    product.quantitySold,
    product.status,
    product.purchaseDate.toLocaleDateString('pt-BR'),
    product.totalCost,
    product.expectedProfit,
    product.profitMargin.toFixed(2),
    product.roi.toFixed(2),
    product.aliexpressLink || '',
    product.description || '',
    product.notes || ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csvContent
}

export function exportProductsToJSON(products: Product[], _options: ExportOptions = { format: 'json' }): string {
  const exportData = products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    supplier: product.supplier,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    quantity: product.quantity,
    quantitySold: product.quantitySold,
    status: product.status,
    purchaseDate: product.purchaseDate.toISOString(),
    totalCost: product.totalCost,
    expectedProfit: product.expectedProfit,
    profitMargin: product.profitMargin,
    roi: product.roi,
    aliexpressLink: product.aliexpressLink,
    description: product.description,
    notes: product.notes,
    imageUrl: product.imageUrl,
    trackingCode: product.trackingCode
  }))

  return JSON.stringify(exportData, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateInventoryReport(products: Product[]) {
  const report = {
    summary: {
      totalProducts: products.length,
      totalInvestment: products.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0),
      totalInventoryValue: products.reduce((acc, p) => acc + (p.sellingPrice * (p.quantity - p.quantitySold)), 0),
      totalRevenue: products.reduce((acc, p) => acc + (p.sellingPrice * p.quantitySold), 0),
      totalProfit: products.reduce((acc, p) => acc + p.actualProfit, 0),
      avgROI: products.reduce((acc, p) => acc + p.roi, 0) / products.length,
      avgMargin: products.reduce((acc, p) => acc + p.profitMargin, 0) / products.length
    },
    categories: products.reduce((acc, product) => {
      const category = product.category
      if (!acc[category]) {
        acc[category] = { count: 0, totalValue: 0, avgMargin: 0 }
      }
      acc[category].count++
      acc[category].totalValue += product.sellingPrice * (product.quantity - product.quantitySold)
      acc[category].avgMargin += product.profitMargin
      return acc
    }, {} as Record<string, { count: number; totalValue: number; avgMargin: number }>),
    lowStock: products.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold'),
    highROI: products.filter(p => p.roi >= 50),
    statusBreakdown: products.reduce((acc, product) => {
      acc[product.status] = (acc[product.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Calcular médias por categoria
  Object.keys(report.categories).forEach(category => {
    report.categories[category].avgMargin /= report.categories[category].count
  })

  return report
}

export function generatePerformanceAnalysis(products: Product[]) {
  const analysis = {
    profitability: {
      excellent: products.filter(p => p.roi >= 100).length,
      good: products.filter(p => p.roi >= 50 && p.roi < 100).length,
      average: products.filter(p => p.roi >= 25 && p.roi < 50).length,
      poor: products.filter(p => p.roi < 25).length
    },
    marginAnalysis: {
      high: products.filter(p => p.profitMargin >= 80).length,
      good: products.filter(p => p.profitMargin >= 60 && p.profitMargin < 80).length,
      average: products.filter(p => p.profitMargin >= 40 && p.profitMargin < 60).length,
      low: products.filter(p => p.profitMargin < 40).length
    },
    topPerformers: products
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        roi: p.roi,
        margin: p.profitMargin,
        revenue: p.sellingPrice * p.quantitySold
      })),
    recommendations: [] as string[]
  }

  // Gerar recomendações baseadas na análise
  if (analysis.profitability.poor > analysis.profitability.excellent) {
    analysis.recommendations.push('Considere revisar preços de produtos com ROI baixo')
  }
  
  if (analysis.marginAnalysis.low > analysis.marginAnalysis.high) {
    analysis.recommendations.push('Analise custos para melhorar margens de lucro')
  }

  const lowStockCount = products.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold').length
  if (lowStockCount > 0) {
    analysis.recommendations.push(`${lowStockCount} produtos precisam de reposição de estoque`)
  }

  return analysis
}