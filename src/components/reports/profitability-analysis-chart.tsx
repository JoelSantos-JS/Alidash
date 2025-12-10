"use client"

import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type ProfitabilityAnalysisChartProps = {
  data: Product[];
  isLoading?: boolean;
  periodFilter?: "week" | "month" | "quarter" | "year";
}

export function ProfitabilityAnalysisChart({ data, isLoading, periodFilter = "month" }: ProfitabilityAnalysisChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const now = new Date();
    const periodStart = (() => {
      switch (periodFilter) {
        case "week":
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month":
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          return new Date(now.getFullYear(), quarter * 3, 1);
        case "year":
          return new Date(now.getFullYear(), 0, 1);
        default:
          return new Date(now.getFullYear(), now.getMonth(), 1);
      }
    })();
    
    return data
      .filter(product => product.sales && product.sales.some(sale => new Date(sale.date) >= periodStart))
      .map(product => {
        const soldQtyInPeriod = (product.sales || [])
          .filter(sale => new Date(sale.date) >= periodStart)
          .reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);
        const totalRevenue = product.sellingPrice * soldQtyInPeriod;
        const totalCost = product.totalCost * soldQtyInPeriod;
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

        return {
          name: product.name.split(" ").slice(0, 2).join(" "),
          fullName: product.name,
          receita: totalRevenue,
          custo: totalCost,
          lucro: totalRevenue - totalCost,
          margemLucro: profitMargin,
          roi: product.roi,
          categoria: product.category,
          vendidos: soldQtyInPeriod,
          estoque: product.quantity - product.quantitySold
        };
      })
      .sort((a, b) => b.lucro - a.lucro);
  }, [data, periodFilter]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { avgMargin: 0, totalProfit: 0, bestPerformer: null };
    
    const avgMargin = chartData.reduce((acc, item) => acc + item.margemLucro, 0) / chartData.length;
    const totalProfit = chartData.reduce((acc, item) => acc + item.lucro, 0);
    const bestPerformer = chartData[0];
    
    return { avgMargin, totalProfit, bestPerformer };
  }, [chartData]);

  const formatTooltipValue = (value: any, name: any) => {
    if (name === 'margemLucro' || name === 'roi') {
      return [`${value.toFixed(1)}%`, name === 'margemLucro' ? 'Margem de Lucro' : 'ROI'];
    }
    return [`R$ ${value.toLocaleString('pt-BR')}`, 
      name === 'receita' ? 'Receita' : 
      name === 'custo' ? 'Custo' : 'Lucro'
    ];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
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
              <span>Vendidos:</span>
              <span className="font-medium">{data.vendidos} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Custo:</span>
              <span className="font-medium text-red-600">R$ {data.custo.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-blue-600">R$ {data.lucro.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{data.margemLucro.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>ROI:</span>
              <span className="font-medium">{data.roi.toFixed(1)}%</span>
            </div>
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
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Análise de Lucratividade
            </CardTitle>
            <CardDescription>
              Receita vs Custo vs Margem de Lucro
            </CardDescription>
          </div>
          {stats.bestPerformer && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Melhor: {stats.bestPerformer.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.bestPerformer.margemLucro.toFixed(1)}% margem
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
              {stats.avgMargin > 30 ? 
                <TrendingUp className="h-4 w-4 text-green-600" /> : 
                stats.avgMargin > 15 ? 
                <Minus className="h-4 w-4 text-yellow-600" /> :
                <TrendingDown className="h-4 w-4 text-red-600" />
              }
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Lucro Total</div>
            <div className="text-lg font-bold">
              {stats.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-2 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <div className="flex justify-between">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-16" />
                ))}
              </div>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                yAxisId="left"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px' }}
              />
              
              {/* Linha de referência para margem ideal */}
              <ReferenceLine 
                yAxisId="right" 
                y={25} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5" 
                label={{ value: "Meta: 25%", position: "top", fontSize: 10 }}
              />
              
              <Bar 
                yAxisId="left"
                dataKey="receita" 
                name="Receita" 
                fill="hsl(var(--chart-1))" 
                radius={[0, 0, 0, 0]} 
                opacity={0.8}
              />
              <Bar 
                yAxisId="left"
                dataKey="custo" 
                name="Custo" 
                fill="hsl(var(--destructive))" 
                radius={[0, 0, 0, 0]} 
                opacity={0.8}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="margemLucro" 
                name="Margem %" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhum produto vendido</p>
              <p className="text-sm">Registre vendas para ver a análise de lucratividade</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
