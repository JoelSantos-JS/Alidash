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
  RadialBarChart,
  RadialBar,
  Legend,
  LineChart,
  Line
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Truck, Star, TrendingUp, Award, Users } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type SupplierPerformanceChartProps = {
  data: Product[];
  isLoading?: boolean;
}

const SUPPLIER_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE"
];

export function SupplierPerformanceChart({ data, isLoading }: SupplierPerformanceChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { supplierData: [], performanceData: [] };
    
    // Análise por fornecedor
    const supplierStats = data.reduce((acc, product) => {
      const supplier = product.supplier;
      if (!acc[supplier]) {
        acc[supplier] = {
          supplier,
          produtos: 0,
          totalInvestment: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgROI: 0,
          avgMargin: 0,
          vendidos: 0,
          totalUnits: 0,
          avgCost: 0,
          productList: [],
          successRate: 0
        };
      }
      
      acc[supplier].produtos++;
      acc[supplier].totalInvestment += product.totalCost * product.quantity;
      acc[supplier].totalRevenue += product.sellingPrice * product.quantitySold;
      acc[supplier].totalProfit += product.actualProfit;
      acc[supplier].vendidos += product.quantitySold;
      acc[supplier].totalUnits += product.quantity;
      acc[supplier].productList.push({
        name: product.name,
        roi: product.roi,
        margin: product.profitMargin,
        cost: product.totalCost,
        sold: product.quantitySold > 0
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular métricas derivadas
    Object.keys(supplierStats).forEach(supplier => {
      const stats = supplierStats[supplier];
      const products = stats.productList;
      
      // ROI médio
      stats.avgROI = products.reduce((acc: number, p: any) => acc + p.roi, 0) / products.length;
      
      // Margem média
      stats.avgMargin = products.reduce((acc: number, p: any) => acc + p.margin, 0) / products.length;
      
      // Custo médio
      stats.avgCost = products.reduce((acc: number, p: any) => acc + p.cost, 0) / products.length;
      
      // Taxa de sucesso (produtos vendidos)
      const soldProducts = products.filter((p: any) => p.sold).length;
      stats.successRate = (soldProducts / products.length) * 100;
      
      // Score de performance (combinação de ROI, margem e taxa de sucesso)
      stats.performanceScore = (stats.avgROI * 0.4 + stats.avgMargin * 0.3 + stats.successRate * 0.3);
      
      // Classificação
      if (stats.performanceScore >= 40) {
        stats.rating = 'Excelente';
        stats.ratingColor = 'hsl(var(--chart-1))';
      } else if (stats.performanceScore >= 25) {
        stats.rating = 'Bom';
        stats.ratingColor = 'hsl(var(--chart-2))';
      } else if (stats.performanceScore >= 15) {
        stats.rating = 'Regular';
        stats.ratingColor = 'hsl(var(--chart-3))';
      } else {
        stats.rating = 'Fraco';
        stats.ratingColor = 'hsl(var(--destructive))';
      }
    });

    const supplierData = Object.values(supplierStats)
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
      .map((supplier: any, index: number) => ({
        ...supplier,
        fill: SUPPLIER_COLORS[index % SUPPLIER_COLORS.length]
      }));

    // Dados para gráfico radial (top 5 fornecedores)
    const performanceData = supplierData.slice(0, 5).map((supplier: any, index: number) => ({
      ...supplier,
      name: supplier.supplier.split(" ")[0], // Nome curto
      score: Math.min(supplier.performanceScore, 100), // Limitar a 100
      fill: SUPPLIER_COLORS[index % SUPPLIER_COLORS.length]
    }));

    return { supplierData, performanceData };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.supplierData.length === 0) return { 
      totalSuppliers: 0, bestSupplier: null, avgPerformance: 0, excellentCount: 0 
    };
    
    const totalSuppliers = chartData.supplierData.length;
    const bestSupplier = chartData.supplierData[0];
    const avgPerformance = chartData.supplierData.reduce((acc: number, s: any) => acc + s.performanceScore, 0) / totalSuppliers;
    const excellentCount = chartData.supplierData.filter((s: any) => s.rating === 'Excelente').length;
    
    return { totalSuppliers, bestSupplier, avgPerformance, excellentCount };
  }, [chartData]);

  const SupplierTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.supplier}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Classificação:</span>
              <Badge 
                style={{ backgroundColor: data.ratingColor, color: 'white' }}
                className="text-xs"
              >
                {data.rating}
              </Badge>
            </div>
            <p className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">{data.produtos} tipos</span>
            </p>
            <p className="flex justify-between">
              <span>Investimento:</span>
              <span className="font-medium text-blue-600">R$ {data.totalInvestment.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.totalRevenue.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-purple-600">R$ {data.totalProfit.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>ROI Médio:</span>
              <span className="font-medium">{data.avgROI.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Margem Média:</span>
              <span className="font-medium">{data.avgMargin.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Taxa Sucesso:</span>
              <span className="font-medium">{data.successRate.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Score Performance:</span>
              <span className="font-medium text-primary">{data.performanceScore.toFixed(1)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.supplier}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Score:</span>
              <span className="font-medium text-primary">{data.score.toFixed(1)}</span>
            </p>
            <div className="flex justify-between">
              <span>Classificação:</span>
              <Badge 
                style={{ backgroundColor: data.ratingColor, color: 'white' }}
                className="text-xs"
              >
                {data.rating}
              </Badge>
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
              <Truck className="h-5 w-5 text-indigo-600" />
              Performance dos Fornecedores
            </CardTitle>
            <CardDescription>
              Análise comparativa de performance e resultados
            </CardDescription>
          </div>
          {stats.bestSupplier && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Award className="h-4 w-4 text-yellow-600" />
                Top: {stats.bestSupplier.supplier.split(" ")[0]}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.bestSupplier.performanceScore.toFixed(1)} score
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Fornecedores</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.totalSuppliers}
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Performance Média</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgPerformance.toFixed(1)}
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {stats.excellentCount > 0 && (
            <Badge variant="default" className="text-xs gap-1">
              <Star className="h-3 w-3" />
              Excelentes: {stats.excellentCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="flex justify-center">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              <div className="flex justify-between">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20" />
                ))}
              </div>
            </div>
          </div>
        ) : chartData.supplierData.length > 0 ? (
          <div className="h-full">
            {/* Gráfico Radial de Performance (metade superior) */}
            <div className="h-1/2 mb-4">
              <h4 className="text-sm font-medium mb-2">Score de Performance (Top 5)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="80%"
                  data={chartData.performanceData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="score"
                    cornerRadius={4}
                    fill="#8884d8"
                  >
                    {chartData.performanceData.map((entry: any, index: number) => (
                      <Cell key={`radial-cell-${index}`} fill={entry.fill} />
                    ))}
                  </RadialBar>
                  <Tooltip content={<PerformanceTooltip />} />
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '10px' }}
                    layout="horizontal"
                    align="center"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras Comparativo (metade inferior) */}
            <div className="h-1/2">
              <h4 className="text-sm font-medium mb-2">Comparação de Lucro por Fornecedor</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.supplierData.slice(0, 6)}
                  margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="supplier" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    tickFormatter={(value) => value.split(" ")[0]} // Mostrar só a primeira palavra
                  />
                  <YAxis 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Lucro', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<SupplierTooltip />} />
                  
                  <Bar 
                    dataKey="totalProfit" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.supplierData.slice(0, 6).map((entry: any, index: number) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.ratingColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhum fornecedor encontrado</p>
              <p className="text-sm">Adicione produtos de diferentes fornecedores para ver a análise</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}