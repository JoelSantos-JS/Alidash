"use client"

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ComposedChart,
  Line
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Percent, TrendingUp, AlertTriangle, Target } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type ProfitMarginAnalysisChartProps = {
  data: Product[];
  isLoading?: boolean;
}

export function ProfitMarginAnalysisChart({ data, isLoading }: ProfitMarginAnalysisChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { marginData: [], scatterData: [], categoryMargins: [] };
    
    // Análise detalhada de margem por produto
    const marginData = data.map(product => {
      const revenue = product.sellingPrice * Math.max(product.quantitySold, 1); // Pelo menos 1 para cálculo
      const costs = product.totalCost * Math.max(product.quantitySold, 1);
      const profit = revenue - costs;
      const marginPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Breakdown dos custos
      const costBreakdown = {
        purchase: product.purchasePrice,
        shipping: product.shippingCost,
        taxes: product.importTaxes,
        packaging: product.packagingCost,
        marketing: product.marketingCost,
        other: product.otherCosts
      };

      // Classificação da margem
      let marginClassification = 'Ruim';
      let marginColor = 'hsl(var(--destructive))';
      
      if (marginPercentage >= 40) {
        marginClassification = 'Excelente';
        marginColor = 'hsl(var(--chart-1))';
      } else if (marginPercentage >= 25) {
        marginClassification = 'Boa';
        marginColor = 'hsl(var(--chart-2))';
      } else if (marginPercentage >= 15) {
        marginClassification = 'Regular';
        marginColor = 'hsl(var(--chart-3))';
      }

      return {
        name: product.name.split(" ").slice(0, 2).join(" "),
        fullName: product.name,
        margem: marginPercentage,
        margemValor: profit,
        receita: revenue,
        custoTotal: costs,
        categoria: product.category,
        vendidos: product.quantitySold,
        status: product.status,
        classification: marginClassification,
        color: marginColor,
        costBreakdown,
        roi: product.roi
      };
    }).sort((a, b) => b.margem - a.margem);

    // Dados para scatter plot (Margem vs Volume de Vendas)
    const scatterData = marginData.map(item => ({
      x: item.vendidos, // Volume de vendas
      y: item.margem, // Margem
      z: item.margemValor, // Valor da margem (para tamanho da bolha)
      name: item.name,
      fullName: item.fullName,
      categoria: item.categoria,
      classification: item.classification,
      color: item.color
    }));

    // Análise por categoria
    const categoryStats = data.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          products: [],
          totalRevenue: 0,
          totalCost: 0,
          avgMargin: 0
        };
      }
      
      const revenue = product.sellingPrice * Math.max(product.quantitySold, 1);
      const cost = product.totalCost * Math.max(product.quantitySold, 1);
      
      acc[category].products.push(product.profitMargin);
      acc[category].totalRevenue += revenue;
      acc[category].totalCost += cost;
      
      return acc;
    }, {} as Record<string, any>);

    const categoryMargins = Object.keys(categoryStats).map(category => {
      const stats = categoryStats[category];
      const totalMargin = stats.totalRevenue > 0 ? 
        ((stats.totalRevenue - stats.totalCost) / stats.totalRevenue) * 100 : 0;
      
      const avgProductMargin = stats.products.reduce((a: number, b: number) => a + b, 0) / stats.products.length;
      
      return {
        category,
        margemTotal: totalMargin,
        margemMedia: avgProductMargin,
        produtos: stats.products.length,
        receita: stats.totalRevenue,
        custo: stats.totalCost
      };
    }).sort((a, b) => b.margemTotal - a.margemTotal);

    return { marginData, scatterData, categoryMargins };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.marginData.length === 0) return { 
      avgMargin: 0, bestMargin: null, excellentCount: 0, poorCount: 0 
    };
    
    const avgMargin = chartData.marginData.reduce((acc, item) => acc + item.margem, 0) / chartData.marginData.length;
    const bestMargin = chartData.marginData[0];
    const excellentCount = chartData.marginData.filter(item => item.classification === 'Excelente').length;
    const poorCount = chartData.marginData.filter(item => item.classification === 'Ruim').length;
    
    return { avgMargin, bestMargin, excellentCount, poorCount };
  }, [chartData]);

  const MarginTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <div className="font-semibold text-sm mb-2">{data.fullName}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Categoria:</span>
              <Badge variant="secondary" className="text-xs">{data.categoria}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Classificação:</span>
              <Badge 
                style={{ backgroundColor: data.color, color: 'white' }}
                className="text-xs"
              >
                {data.classification}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{data.margem.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Margem em R$:</span>
              <span className="font-medium text-green-600">R$ {data.margemValor.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Custo:</span>
              <span className="font-medium text-red-600">R$ {data.custoTotal.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Vendidos:</span>
              <span className="font-medium">{data.vendidos} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>ROI:</span>
              <span className="font-medium">{data.roi.toFixed(1)}%</span>
            </div>
            
            {data.costBreakdown && (
              <div className="mt-2 pt-2 border-t">
                <div className="font-medium text-xs mb-1">Breakdown de Custos:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>Compra: R$ {data.costBreakdown.purchase}</span>
                  <span>Frete: R$ {data.costBreakdown.shipping}</span>
                  <span>Impostos: R$ {data.costBreakdown.taxes}</span>
                  <span>Embalagem: R$ {data.costBreakdown.packaging}</span>
                  <span>Marketing: R$ {data.costBreakdown.marketing}</span>
                  <span>Outros: R$ {data.costBreakdown.other}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.fullName}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Volume vendido:</span>
              <span className="font-medium">{data.x} unidades</span>
            </p>
            <p className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{data.y.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Valor da margem:</span>
              <span className="font-medium text-green-600">R$ {data.z.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Categoria:</span>
              <Badge variant="secondary" className="text-xs">{data.categoria}</Badge>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.category}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Margem Total:</span>
              <span className="font-medium">{data.margemTotal.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Margem Média:</span>
              <span className="font-medium">{data.margemMedia.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">{data.produtos}</span>
            </p>
            <p className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              Análise de Margem de Lucro
            </CardTitle>
            <CardDescription>
              Análise detalhada de margens e rentabilidade por produto
            </CardDescription>
          </div>
          {stats.bestMargin && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Target className="h-4 w-4 text-yellow-600" />
                Melhor: {stats.bestMargin.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.bestMargin.margem.toFixed(1)}% margem
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Margem Média</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgMargin.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Excelentes</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.excellentCount}
              <Target className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Classification Legend */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-chart-1"></div>
            <span className="text-xs">Excelente (≥40%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-chart-2"></div>
            <span className="text-xs">Boa (25-39%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-chart-3"></div>
            <span className="text-xs">Regular (15-24%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span className="text-xs">Ruim (&lt;15%)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-8 w-full" />
              <div className="flex justify-between">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-16" />
                ))}
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : chartData.marginData.length > 0 ? (
          <div className="h-full">
            {/* Gráfico de Margem por Produto (parte superior) */}
            <div className="h-2/3 mb-4">
              <h4 className="text-sm font-medium mb-2">Margem por Produto</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData.marginData.slice(0, 10)}
                  margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    label={{ value: 'Margem %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<MarginTooltip />} />
                  
                  {/* Linhas de referência */}
                  <ReferenceLine 
                    y={25} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    label={{ value: "Meta: 25%", position: "top", fontSize: 9 }}
                  />
                  <ReferenceLine 
                    y={40} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5" 
                    label={{ value: "Excelente: 40%", position: "top", fontSize: 9 }}
                  />
                  
                  <Bar dataKey="margem" radius={[4, 4, 0, 0]}>
                    {chartData.marginData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Análise por Categoria (parte inferior) */}
            <div className="h-1/3">
              <h4 className="text-sm font-medium mb-2">Margem por Categoria</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.categoryMargins}
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip content={<CategoryTooltip />} />
                  
                  <Bar 
                    dataKey="margemTotal" 
                    name="Margem Total"
                    fill="hsl(var(--chart-1))" 
                    radius={[2, 2, 0, 0]} 
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhum dado de margem</p>
              <p className="text-sm">Adicione produtos com vendas para ver a análise de margens</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}