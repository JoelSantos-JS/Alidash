"use client"

import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, TrendingUp, Star, Award } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type ROIComparisonChartProps = {
  data: Product[];
  isLoading?: boolean;
}

const PERFORMANCE_COLORS = {
  excellent: "hsl(var(--chart-1))", // Verde
  good: "hsl(var(--chart-2))",      // Azul
  average: "hsl(var(--chart-3))",   // Amarelo
  poor: "hsl(var(--destructive))"   // Vermelho
};

export function ROIComparisonChart({ data, isLoading }: ROIComparisonChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { scatterData: [], radarData: [] };
    
    // Dados para scatter plot (ROI vs Investimento)
    const scatterData = data.map(product => {
      const investmentPerUnit = product.totalCost;
      const profitPerUnit = product.expectedProfit;
      const roi = product.roi;
      
      // Classificar performance
      let performance = 'poor';
      let color = PERFORMANCE_COLORS.poor;
      
      if (roi >= 50) {
        performance = 'excellent';
        color = PERFORMANCE_COLORS.excellent;
      } else if (roi >= 25) {
        performance = 'good';
        color = PERFORMANCE_COLORS.good;
      } else if (roi >= 10) {
        performance = 'average';
        color = PERFORMANCE_COLORS.average;
      }

      return {
        name: product.name.split(" ").slice(0, 2).join(" "),
        fullName: product.name,
        x: investmentPerUnit, // Eixo X: Investimento por unidade
        y: roi, // Eixo Y: ROI
        z: profitPerUnit, // Tamanho da bolha: Lucro por unidade
        categoria: product.category,
        status: product.status,
        vendidos: product.quantitySold,
        estoque: product.quantity - product.quantitySold,
        performance,
        color,
        investimentoTotal: product.totalCost * product.quantity,
        lucroRealizado: product.actualProfit,
        margem: product.profitMargin
      };
    });

    // Dados para radar chart (categorias)
    const categoryPerformance = data.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          roi: [],
          margem: [],
          velocidade: []
        };
      }
      
      acc[category].roi.push(product.roi);
      acc[category].margem.push(product.profitMargin);
      
      // Simular velocidade baseada no status
      const velocidadeScore = product.status === 'sold' ? 90 : 
                             product.status === 'selling' ? 70 :
                             product.status === 'received' ? 50 : 30;
      acc[category].velocidade.push(velocidadeScore);
      
      return acc;
    }, {} as Record<string, any>);

    const radarData = Object.keys(categoryPerformance).map(category => {
      const catData = categoryPerformance[category];
      return {
        category,
        ROI: catData.roi.reduce((a: number, b: number) => a + b, 0) / catData.roi.length,
        Margem: catData.margem.reduce((a: number, b: number) => a + b, 0) / catData.margem.length,
        Velocidade: catData.velocidade.reduce((a: number, b: number) => a + b, 0) / catData.velocidade.length
      };
    });

    return { scatterData, radarData };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.scatterData.length === 0) return { 
      avgROI: 0, topPerformer: null, excellentCount: 0, poorCount: 0 
    };
    
    const avgROI = chartData.scatterData.reduce((acc, item) => acc + item.y, 0) / chartData.scatterData.length;
    const topPerformer = chartData.scatterData.reduce((max, item) => 
      item.y > max.y ? item : max
    );
    const excellentCount = chartData.scatterData.filter(item => item.performance === 'excellent').length;
    const poorCount = chartData.scatterData.filter(item => item.performance === 'poor').length;
    
    return { avgROI, topPerformer, excellentCount, poorCount };
  }, [chartData]);

  const ScatterTooltip = ({ active, payload }: any) => {
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
              <span>Performance:</span>
              <Badge 
                style={{ backgroundColor: data.color, color: 'white' }}
                className="text-xs"
              >
                {data.performance === 'excellent' ? 'Excelente' :
                 data.performance === 'good' ? 'Boa' :
                 data.performance === 'average' ? 'Média' : 'Ruim'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Investimento/unid:</span>
              <span className="font-medium">R$ {data.x.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>ROI:</span>
              <span className="font-medium text-blue-600">{data.y.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Lucro/unid:</span>
              <span className="font-medium text-green-600">R$ {data.z.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{data.margem.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Vendidos:</span>
              <span className="font-medium">{data.vendidos} de {data.vendidos + data.estoque}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RadarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="flex justify-between">
                <span>{entry.name}:</span>
                <span className="font-medium" style={{ color: entry.color }}>
                  {entry.value.toFixed(1)}{entry.name === 'ROI' || entry.name === 'Margem' ? '%' : ''}
                </span>
              </p>
            ))}
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
              <Target className="h-5 w-5 text-green-600" />
              Análise de ROI e Performance
            </CardTitle>
            <CardDescription>
              Comparação de retorno sobre investimento vs capital investido
            </CardDescription>
          </div>
          {stats.topPerformer && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Award className="h-4 w-4 text-yellow-600" />
                Top ROI: {stats.topPerformer.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.topPerformer.y.toFixed(1)}% retorno
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">ROI Médio</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgROI.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Excelentes</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.excellentCount}
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Performance Legend */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.excellent }}></div>
            <span className="text-xs">Excelente (≥50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.good }}></div>
            <span className="text-xs">Boa (25-49%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.average }}></div>
            <span className="text-xs">Média (10-24%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.poor }}></div>
            <span className="text-xs">Ruim (&lt;10%)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-8 w-full" />
              <div className="flex justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
              <div className="flex justify-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ) : chartData.scatterData.length > 0 ? (
          <div className="h-full">
            {/* Scatter Plot (metade superior) */}
            <div className="h-1/2 mb-4">
              <h4 className="text-sm font-medium mb-2">ROI vs Investimento por Produto</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="x"
                    type="number"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Investimento por Unidade', position: 'insideBottom', offset: -10, fontSize: 10 }}
                  />
                  <YAxis 
                    dataKey="y"
                    type="number"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    label={{ value: 'ROI %', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip content={<ScatterTooltip />} />
                  
                  {/* Linhas de referência */}
                  <ReferenceLine 
                    y={25} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    label={{ value: "ROI Alvo: 25%", position: "top", fontSize: 9 }}
                  />
                  <ReferenceLine 
                    y={50} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5" 
                    label={{ value: "ROI Excelente: 50%", position: "top", fontSize: 9 }}
                  />
                  
                  <Scatter data={chartData.scatterData} fill="#8884d8">
                    {chartData.scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart por Categoria (metade inferior) */}
            {chartData.radarData.length > 0 && (
              <div className="h-1/2">
                <h4 className="text-sm font-medium mb-2">Performance por Categoria</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 8 }} 
                      tickCount={5}
                    />
                    <Radar
                      name="ROI %"
                      dataKey="ROI"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Margem %"
                      dataKey="Margem"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Velocidade"
                      dataKey="Velocidade"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip content={<RadarTooltip />} />
                    <Legend 
                      iconType="line" 
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhum dado de ROI</p>
              <p className="text-sm">Adicione produtos com vendas para ver a análise de ROI</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}