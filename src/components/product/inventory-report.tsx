"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { generateInventoryReport } from "@/lib/export-utils"
import type { Product } from "@/types"
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  BarChart3,
  CheckCircle2,
  Clock,
  ShoppingCart
} from "lucide-react"

interface InventoryReportProps {
  products: Product[]
  onClose: () => void
}

export function InventoryReport({ products, onClose }: InventoryReportProps) {
  const report = generateInventoryReport(products)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Relatório de Estoque
        </h2>
        <Badge variant="secondary" className="text-sm">
          {new Date().toLocaleDateString('pt-BR')}
        </Badge>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos no inventário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {report.summary.totalInvestment.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Capital investido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {report.summary.totalInventoryValue.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor potencial de venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {report.summary.totalRevenue.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendas realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Análise por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(report.categories).map(([category, stats]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{stats.count} produtos</span>
                    <span className="text-muted-foreground">
                      {stats.avgMargin.toFixed(1)}% margem
                    </span>
                    <span className="font-medium">
                      {stats.totalValue.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      })}
                    </span>
                  </div>
                </div>
                <Progress value={stats.avgMargin} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status do Estoque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Status dos Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(report.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status === 'purchased' && <Package className="h-4 w-4 text-blue-600" />}
                    {status === 'shipping' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {status === 'received' && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                    {status === 'selling' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {status === 'sold' && <ShoppingCart className="h-4 w-4 text-gray-600" />}
                    <span className="capitalize">{status}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.lowStock.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Estoque Baixo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {report.lowStock.length} produto(s) precisam de reposição
                  </div>
                  <div className="space-y-1">
                    {report.lowStock.slice(0, 3).map(product => (
                      <div key={product.id} className="text-xs bg-orange-50 dark:bg-orange-950 p-2 rounded">
                        {product.name} - {product.quantity - product.quantitySold} unidade(s)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.highROI.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Alto ROI</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {report.highROI.length} produto(s) com ROI ≥ 50%
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">ROI Médio</h4>
                <div className="text-3xl font-bold text-green-600">
                  {report.summary.avgROI.toFixed(1)}%
                </div>
                <Progress value={Math.min(100, report.summary.avgROI)} className="h-2 mt-2" />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Margem Média</h4>
                <div className="text-3xl font-bold text-blue-600">
                  {report.summary.avgMargin.toFixed(1)}%
                </div>
                <Progress value={Math.min(100, report.summary.avgMargin)} className="h-2 mt-2" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Eficiência de Venda</h4>
                <div className="text-3xl font-bold text-purple-600">
                  {report.summary.totalProducts > 0 
                    ? ((report.summary.totalRevenue / report.summary.totalInventoryValue) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita / Valor em Estoque
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lucro Total</h4>
                <div className="text-3xl font-bold text-green-600">
                  {report.summary.totalProfit.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lucro acumulado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 