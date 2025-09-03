"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { generatePerformanceAnalysis } from "@/lib/export-utils"
import type { Product } from "@/types"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock
} from "lucide-react"

interface PerformanceAnalysisProps {
  products: Product[]
  onClose: () => void
}

export function PerformanceAnalysis({ products, onClose }: PerformanceAnalysisProps) {
  const analysis = generatePerformanceAnalysis(products)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Análise de Performance
        </h2>
        <Badge variant="secondary" className="text-sm">
          {new Date().toLocaleDateString('pt-BR')}
        </Badge>
      </div>

      {/* Resumo de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Excelente ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysis.profitability.excellent}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI ≥ 100%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bom ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.profitability.good}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI 50-99%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.profitability.average}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI 25-49%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ROI Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analysis.profitability.poor}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI &lt; 25%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Margem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise de Margem de Lucro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analysis.marginAnalysis.high}
              </div>
              <div className="text-sm font-medium">Alta Margem</div>
              <div className="text-xs text-muted-foreground">≥ 80%</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {analysis.marginAnalysis.good}
              </div>
              <div className="text-sm font-medium">Boa Margem</div>
              <div className="text-xs text-muted-foreground">60-79%</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {analysis.marginAnalysis.average}
              </div>
              <div className="text-sm font-medium">Margem Média</div>
              <div className="text-xs text-muted-foreground">40-59%</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-2">
                {analysis.marginAnalysis.low}
              </div>
              <div className="text-sm font-medium">Baixa Margem</div>
              <div className="text-xs text-muted-foreground">&lt; 40%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top 5 Produtos por ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.topPerformers.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Margem: {product.margin.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {product.roi.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.revenue.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendações de Melhoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recommendations.length > 0 ? (
              analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="font-medium">Excelente performance!</p>
                <p className="text-sm">Seus produtos estão com métricas muito boas.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição de ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Excelente (≥100%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.profitability.excellent / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.profitability.excellent}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Bom (50-99%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.profitability.good / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.profitability.good}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Médio (25-49%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.profitability.average / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.profitability.average}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Baixo (&lt;25%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.profitability.poor / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.profitability.poor}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição de Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Alta (≥80%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.marginAnalysis.high / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.marginAnalysis.high}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Boa (60-79%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.marginAnalysis.good / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.marginAnalysis.good}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Média (40-59%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.marginAnalysis.average / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.marginAnalysis.average}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Baixa (&lt;40%)</span>
                <div className="flex items-center gap-2">
                  <Progress value={(analysis.marginAnalysis.low / products.length) * 100} className="w-20 h-2" />
                  <span className="text-sm font-medium">{analysis.marginAnalysis.low}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 