"use client"

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart as PieIcon, Trophy, Target, TrendingUp } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type CategoryPerformanceChartProps = {
  data: Product[];
  isLoading?: boolean;
}

const COLORS = [
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

export function CategoryPerformanceChart({ data, isLoading }: CategoryPerformanceChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { pieData: [], barData: [] };
    
    // Agrupar por categoria
    const categoryStats = data.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          name: category,
          products: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalCost: 0,
          avgROI: 0,
          soldProducts: 0,
          totalProducts: 0
        };
      }
      
      acc[category].products++;
      acc[category].totalProducts += product.quantity;
      acc[category].soldProducts += product.quantitySold;
      acc[category].totalRevenue += product.sellingPrice * product.quantitySold;
      acc[category].totalProfit += product.actualProfit;
      acc[category].totalCost += product.totalCost * product.quantity;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular ROI médio por categoria
    Object.keys(categoryStats).forEach(category => {
      const categoryProducts = data.filter(p => p.category === category);
      const avgROI = categoryProducts.reduce((acc, p) => acc + p.roi, 0) / categoryProducts.length;
      categoryStats[category].avgROI = avgROI;
      categoryStats[category].profitMargin = categoryStats[category].totalRevenue > 0 
        ? (categoryStats[category].totalProfit / categoryStats[category].totalRevenue) * 100 
        : 0;
    });

    const categories = Object.values(categoryStats);
    
    // Dados para gráfico de pizza (receita por categoria)
    const pieData = categories.map((cat, index) => ({
      ...cat,
      value: cat.totalRevenue,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    // Dados para gráfico de barras (performance completa)
    const barData = categories.map((cat, index) => ({
      ...cat,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.totalProfit - a.totalProfit);

    return { pieData, barData };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.barData.length === 0) return { bestCategory: null, totalCategories: 0, avgMargin: 0 };
    
    const bestCategory = chartData.barData[0];
    const totalCategories = chartData.barData.length;
    const avgMargin = chartData.barData.reduce((acc, cat) => acc + cat.profitMargin, 0) / totalCategories;
    
    return { bestCategory, totalCategories, avgMargin };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">{data.products} tipos</span>
            </p>
            <p className="flex justify-between">
              <span>Estoque Total:</span>
              <span className="font-medium">{data.totalProducts} unidades</span>
            </p>
            <p className="flex justify-between">
              <span>Vendidos:</span>
              <span className="font-medium">{data.soldProducts} unidades</span>
            </p>
            <p className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.totalRevenue.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-blue-600">R$ {data.totalProfit.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>ROI Médio:</span>
              <span className="font-medium">{data.avgROI.toFixed(1)}%</span>
            </p>
            <p className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{data.profitMargin.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não mostrar label para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-purple-600" />
              Performance por Categoria
            </CardTitle>
            <CardDescription>
              Análise de receita e lucratividade por categoria
            </CardDescription>
          </div>
          {stats.bestCategory && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Top: {stats.bestCategory.name}
              </div>
              <div className="text-xs text-muted-foreground">
                R$ {stats.bestCategory.totalProfit.toLocaleString('pt-BR')} lucro
              </div>
            </div>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Categorias</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.totalCategories}
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Margem Média</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgMargin.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="flex justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
              <div className="flex justify-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ) : chartData.pieData.length > 0 ? (
          <div className="h-full flex flex-col">
            {/* Gráfico de Pizza */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={80}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda customizada */}
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {chartData.pieData.slice(0, 4).map((category, index) => (
                  <div key={category.name} className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: category.fill }}
                    />
                    <span className="truncate">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.products}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <PieIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhuma categoria encontrada</p>
              <p className="text-sm">Adicione produtos em diferentes categorias para ver a análise</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}