"use client"

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Calendar, BarChart3, Activity } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"
import { format, subDays, startOfDay, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

type SalesTrendsChartProps = {
  data: Product[];
  revenues?: any[];
  sales?: any[];
  isLoading?: boolean;
}

export function SalesTrendsChart({ data, revenues = [], sales = [], isLoading }: SalesTrendsChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { dailyTrends: [], weeklyTrends: [], monthlyTrends: [] };
    
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    // Gerar estrutura para os últimos 30 dias
    const dailyData = new Map();
    const dayInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    dayInterval.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyData.set(dateKey, {
        date: dateKey,
        displayDate: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        dayOfWeek: format(date, 'EEEE', { locale: ptBR }),
        vendas: 0,
        receita: 0,
        lucro: 0,
        produtos: 0,
        ticketMedio: 0,
        produtosVendidos: []
      });
    });

    // Chaves para deduplicação de vendas (productId|date)
    const saleKeys = new Set<string>();

    // Adicionar vendas vindas do endpoint de vendas
    sales.forEach((sale: any) => {
      const saleDate = startOfDay(new Date(sale.date));
      const dateKey = format(saleDate, 'yyyy-MM-dd');
      const key = sale.productId ? `${sale.productId}|${dateKey}` : `${dateKey}|no-product`;
      saleKeys.add(key);

      if (dailyData.has(dateKey)) {
        const dayData = dailyData.get(dateKey);
        const qty = Number(sale.quantity) || 0;
        const unit = Number(sale.unitPrice) || 0;
        const total = typeof sale.totalAmount === 'number' && !isNaN(sale.totalAmount) ? sale.totalAmount : unit * qty;

        dayData.vendas += qty;
        dayData.receita += total || 0;

        if (sale.productId) {
          const product = data.find(p => p.id === sale.productId);
          if (product) {
            dayData.lucro += (Number(product.sellingPrice) - Number(product.totalCost)) * qty;
            dayData.produtos++;
            dayData.produtosVendidos.push({
              name: product.name,
              category: product.category,
              quantity: qty,
              revenue: (Number(product.sellingPrice) || 0) * qty
            });
          }
        }
      }
    });

    // Adicionar vendas vindas dos produtos, evitando duplicatas com sales
    data.forEach(product => {
      if (product.sales && product.sales.length > 0) {
        product.sales.forEach(sale => {
          const saleDate = startOfDay(new Date(sale.date));
          const dateKey = format(saleDate, 'yyyy-MM-dd');
          const key = `${product.id}|${dateKey}`;
          if (saleKeys.has(key)) return;

          if (dailyData.has(dateKey)) {
            const dayData = dailyData.get(dateKey);
            const qty = Number(sale.quantity) || 0;
            dayData.vendas += qty;
            dayData.receita += (Number(product.sellingPrice) || 0) * qty;
            dayData.lucro += (Number(product.sellingPrice) - Number(product.totalCost)) * qty;
            dayData.produtos++;
            dayData.produtosVendidos.push({
              name: product.name,
              category: product.category,
              quantity: qty,
              revenue: (Number(product.sellingPrice) || 0) * qty
            });
          }
        });
      }
    });

    // Adicionar receitas marcadas como venda que não estão nas sales
    revenues.forEach((rev: any) => {
      const src = String(rev?.source || '').toLowerCase();
      const cat = String(rev?.category || '').toLowerCase();
      const isSale = src === 'sale' || cat.includes('venda');
      if (!isSale) return;

      const revDate = startOfDay(new Date(rev.date));
      const dateKey = format(revDate, 'yyyy-MM-dd');
      const key = rev.productId ? `${rev.productId}|${dateKey}` : '';
      if (key && saleKeys.has(key)) return;

      if (dailyData.has(dateKey)) {
        const dayData = dailyData.get(dateKey);
        const amount = Number(rev.amount) || 0;
        dayData.receita += amount;

        if (rev.productId) {
          const product = data.find(p => p.id === rev.productId);
          if (product) {
            // Sem quantidade exata na receita: estimar lucro apenas se possível
            // Mantemos vendas como está (não incrementa), apenas receita/lucro
            const unitProfit = Number(product.sellingPrice) - Number(product.totalCost);
            if (unitProfit > 0) {
              // Aproxima uma quantidade com base na receita / sellingPrice
              const qtyApprox = product.sellingPrice ? Math.round(amount / Number(product.sellingPrice)) : 0;
              dayData.lucro += unitProfit * qtyApprox;
            }
          }
        }
      }
    });

    // Calcular ticket médio
    dailyData.forEach((dayData, key) => {
      if (dayData.produtos > 0) {
        dayData.ticketMedio = dayData.receita / dayData.produtos;
      }
    });

    const dailyTrends = Array.from(dailyData.values());

    // Dados semanais (últimas 8 semanas)
    const weeklyData = new Map();
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7));
      const weekEnd = endOfWeek(weekStart);
      const weekKey = format(weekStart, 'yyyy-ww');
      
      weeklyData.set(weekKey, {
        week: weekKey,
        displayWeek: `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM', { locale: ptBR })}`,
        vendas: 0,
        receita: 0,
        lucro: 0,
        produtos: 0
      });
    }

    // Agrupar dados diários em semanais
    dailyTrends.forEach(day => {
      const dayDate = new Date(day.date);
      const weekStart = startOfWeek(dayDate);
      const weekKey = format(weekStart, 'yyyy-ww');
      
      if (weeklyData.has(weekKey)) {
        const weekData = weeklyData.get(weekKey);
        weekData.vendas += day.vendas;
        weekData.receita += day.receita;
        weekData.lucro += day.lucro;
        weekData.produtos += day.produtos;
      }
    });

    const weeklyTrends = Array.from(weeklyData.values());

    // Análise por categoria ao longo do tempo (unificada)
    const categoryTrends = data.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = {
          category,
          sales: [],
          totalRevenue: 0,
          totalUnits: 0,
          avgDailySales: 0
        };
      }

      // Vendas do produto (evitar duplicatas com sales)
      if (product.sales && product.sales.length > 0) {
        product.sales.forEach(sale => {
          const saleDateStr = format(new Date(sale.date), 'yyyy-MM-dd');
          const key = `${product.id}|${saleDateStr}`;
          if (saleKeys.has(key)) return;
          acc[category].sales.push({
            date: saleDateStr,
            quantity: sale.quantity,
            revenue: (Number(product.sellingPrice) || 0) * (Number(sale.quantity) || 0)
          });
          acc[category].totalRevenue += (Number(product.sellingPrice) || 0) * (Number(sale.quantity) || 0);
          acc[category].totalUnits += Number(sale.quantity) || 0;
        });
      }

      return acc;
    }, {} as Record<string, any>);

    // Vendas do endpoint de sales
    sales.forEach(sale => {
      const dateStr = format(new Date(sale.date), 'yyyy-MM-dd');
      const product = data.find(p => p.id === sale.productId);
      if (!product) return;
      const category = product.category;
      if (!categoryTrends[category]) {
        categoryTrends[category] = {
          category,
          sales: [],
          totalRevenue: 0,
          totalUnits: 0,
          avgDailySales: 0
        };
      }
      categoryTrends[category].sales.push({
        date: dateStr,
        quantity: Number(sale.quantity) || 0,
        revenue: (Number(sale.totalAmount) && !isNaN(sale.totalAmount)) ? Number(sale.totalAmount) : (Number(sale.unitPrice) || 0) * (Number(sale.quantity) || 0)
      });
      const rev = (Number(sale.totalAmount) && !isNaN(sale.totalAmount)) ? Number(sale.totalAmount) : (Number(sale.unitPrice) || 0) * (Number(sale.quantity) || 0);
      categoryTrends[category].totalRevenue += rev;
      categoryTrends[category].totalUnits += Number(sale.quantity) || 0;
    });

    // Receitas de venda que não estão nas sales
    revenues.forEach((rev: any) => {
      const src = String(rev?.source || '').toLowerCase();
      const catStr = String(rev?.category || '').toLowerCase();
      const isSale = src === 'sale' || catStr.includes('venda');
      if (!isSale) return;
      const dateStr = format(new Date(rev.date), 'yyyy-MM-dd');
      const key = rev.productId ? `${rev.productId}|${dateStr}` : '';
      if (key && saleKeys.has(key)) return;
      const product = rev.productId ? data.find(p => p.id === rev.productId) : null;
      if (!product) return;
      const category = product.category;
      if (!categoryTrends[category]) {
        categoryTrends[category] = {
          category,
          sales: [],
          totalRevenue: 0,
          totalUnits: 0,
          avgDailySales: 0
        };
      }
      const amount = Number(rev.amount) || 0;
      categoryTrends[category].sales.push({
        date: dateStr,
        quantity: 0,
        revenue: amount
      });
      categoryTrends[category].totalRevenue += amount;
    });

    // Calcular médias diárias por categoria
    Object.keys(categoryTrends).forEach(category => {
      const catData = categoryTrends[category];
      catData.avgDailySales = catData.totalUnits / 30; // Média dos últimos 30 dias
    });

    const monthlyTrends = Object.values(categoryTrends);

    return { dailyTrends, weeklyTrends, monthlyTrends };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.dailyTrends.length === 0) return { 
      totalSales: 0, avgDailySales: 0, bestDay: null, trend: 'stable' 
    };
    
    const totalSales = chartData.dailyTrends.reduce((acc, day) => acc + day.vendas, 0);
    const daysWithSales = chartData.dailyTrends.filter(day => day.vendas > 0).length;
    const avgDailySales = daysWithSales > 0 ? totalSales / daysWithSales : 0;
    
    const bestDay = chartData.dailyTrends.reduce((max, day) => 
      day.vendas > max.vendas ? day : max
    );

    // Calcular tendência (comparar primeira e segunda metade do período)
    const firstHalf = chartData.dailyTrends.slice(0, 15);
    const secondHalf = chartData.dailyTrends.slice(15);
    
    const firstHalfAvg = firstHalf.reduce((acc, day) => acc + day.vendas, 0) / 15;
    const secondHalfAvg = secondHalf.reduce((acc, day) => acc + day.vendas, 0) / 15;
    
    let trend = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'up';
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'down';
    
    return { totalSales, avgDailySales, bestDay, trend };
  }, [chartData]);

  const DailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.fullDate}</p>
          <p className="text-xs text-muted-foreground mb-2">{data.dayOfWeek}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Vendas:</span>
              <span className="font-medium">{data.vendas} unidades</span>
            </p>
            <p className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-blue-600">R$ {data.lucro.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">{data.produtos} tipos</span>
            </p>
            {data.ticketMedio > 0 && (
              <p className="flex justify-between">
                <span>Ticket Médio:</span>
                <span className="font-medium">R$ {data.ticketMedio.toLocaleString('pt-BR')}</span>
              </p>
            )}
            {data.produtosVendidos.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-xs mb-1">Produtos vendidos:</p>
                {data.produtosVendidos.slice(0, 3).map((produto: any, index: number) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {produto.name.split(" ").slice(0, 2).join(" ")} ({produto.quantity}x)
                  </p>
                ))}
                {data.produtosVendidos.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{data.produtosVendidos.length - 3} outros...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const WeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">Semana {data.displayWeek}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between">
              <span>Vendas:</span>
              <span className="font-medium">{data.vendas} unidades</span>
            </p>
            <p className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-blue-600">R$ {data.lucro.toLocaleString('pt-BR')}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Tendências de Vendas
            </CardTitle>
            <CardDescription>
              Análise temporal de vendas, receita e performance
            </CardDescription>
          </div>
        </div>

        {stats.bestDay && (
          <div className="mt-3">
            <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Melhor dia</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{stats.bestDay.displayDate}</div>
                <div className="text-xs text-muted-foreground">{stats.bestDay.vendas} vendas</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Vendas (30d)</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.totalSales}
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Média Diária</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgDailySales.toFixed(1)}
              {getTrendIcon()}
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex gap-2 mt-2">
          <Badge 
            variant={stats.trend === 'up' ? 'default' : stats.trend === 'down' ? 'destructive' : 'secondary'}
            className="text-xs gap-1"
          >
            {getTrendIcon()}
            Tendência: {stats.trend === 'up' ? 'Crescimento' : stats.trend === 'down' ? 'Queda' : 'Estável'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : chartData.dailyTrends.some(day => day.vendas > 0) ? (
          <div className="h-full">
            {/* Gráfico Daily Trends (metade superior) */}
            <div className="h-1/2 mb-4">
              <h4 className="text-sm font-medium mb-2">Vendas Diárias (últimos 30 dias)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData.dailyTrends}
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval={4} // Mostrar apenas alguns labels
                  />
                  <YAxis 
                    yAxisId="left"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Vendas', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Receita', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<DailyTooltip />} />
                  <Legend iconType="line" wrapperStyle={{ fontSize: '10px' }} />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="vendas" 
                    name="Vendas" 
                    fill="hsl(var(--chart-1))" 
                    radius={[2, 2, 0, 0]} 
                    opacity={0.7}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="receita" 
                    name="Receita" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico Weekly Trends (metade inferior) */}
            <div className="h-1/2">
              <h4 className="text-sm font-medium mb-2">Tendência Semanal (últimas 8 semanas)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.weeklyTrends}
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayWeek" 
                    fontSize={8}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={30}
                    interval={0}
                    tickFormatter={(value) => value.split(' - ')[0]} // Só primeira data
                  />
                  <YAxis 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Receita', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<WeeklyTooltip />} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhuma venda registrada</p>
              <p className="text-sm">Registre vendas para ver as tendências de performance</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
