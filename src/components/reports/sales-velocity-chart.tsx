"use client"

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
  Cell
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Zap, AlertTriangle, CheckCircle } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"
import { format, subDays, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

type SalesVelocityChartProps = {
  data: Product[];
  isLoading?: boolean;
}

export function SalesVelocityChart({ data, isLoading }: SalesVelocityChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { velocityData: [], dailySales: [] };
    
    // Análise de velocidade de vendas (dias para vender)
    const velocityData = data
      .filter(product => product.quantitySold > 0 && product.daysToSell)
      .map(product => ({
        name: product.name.split(" ").slice(0, 2).join(" "),
        fullName: product.name,
        diasParaVender: product.daysToSell || 0,
        categoria: product.category,
        quantidadeVendida: product.quantitySold,
        estoque: product.quantity - product.quantitySold,
        lucroRealizado: product.actualProfit,
        status: product.status,
        velocidade: product.daysToSell ? 
          (product.daysToSell <= 7 ? 'Rápida' : 
           product.daysToSell <= 30 ? 'Média' : 'Lenta') : 'N/A'
      }))
      .sort((a, b) => a.diasParaVender - b.diasParaVender);

    // Análise de vendas por dia (últimos 30 dias)
    const today = new Date();
    const dailySalesMap = new Map();
    
    // Inicializar com zeros para os últimos 30 dias
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(today, i));
      const dateKey = format(date, 'yyyy-MM-dd');
      dailySalesMap.set(dateKey, {
        date: dateKey,
        displayDate: format(date, 'dd/MM', { locale: ptBR }),
        vendas: 0,
        receita: 0,
        produtos: []
      });
    }

    // Processar vendas reais
    data.forEach(product => {
      if (product.sales && product.sales.length > 0) {
        product.sales.forEach(sale => {
          const saleDate = new Date(sale.date);
          const dateKey = format(saleDate, 'yyyy-MM-dd');
          
          if (dailySalesMap.has(dateKey)) {
            const dayData = dailySalesMap.get(dateKey);
            dayData.vendas += sale.quantity;
            dayData.receita += product.sellingPrice * sale.quantity;
            dayData.produtos.push({
              name: product.name,
              quantity: sale.quantity,
              revenue: product.sellingPrice * sale.quantity
            });
          }
        });
      }
    });

    const dailySales = Array.from(dailySalesMap.values());

    return { velocityData, dailySales };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.velocityData.length === 0) return { 
      avgDays: 0, fastProducts: 0, slowProducts: 0, totalSales: 0 
    };
    
    const avgDays = chartData.velocityData.reduce((acc, item) => acc + item.diasParaVender, 0) / chartData.velocityData.length;
    const fastProducts = chartData.velocityData.filter(item => item.diasParaVender <= 7).length;
    const slowProducts = chartData.velocityData.filter(item => item.diasParaVender > 30).length;
    const totalSales = chartData.dailySales.reduce((acc, day) => acc + day.vendas, 0);
    
    return { avgDays, fastProducts, slowProducts, totalSales };
  }, [chartData]);

  const VelocityTooltip = ({ active, payload, label }: any) => {
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
              <span>Dias para vender:</span>
              <span className="font-medium">{data.diasParaVender} dias</span>
            </div>
            <div className="flex justify-between">
              <span>Velocidade:</span>
              <Badge 
                variant={data.velocidade === 'Rápida' ? 'default' : 
                        data.velocidade === 'Média' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {data.velocidade}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Vendidos:</span>
              <span className="font-medium">{data.quantidadeVendida} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Lucro:</span>
              <span className="font-medium text-green-600">R$ {data.lucroRealizado.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const DailySalesTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <div className="font-semibold text-sm mb-2">{data.displayDate}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Vendas:</span>
              <span className="font-medium">{data.vendas} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium text-green-600">R$ {data.receita.toLocaleString('pt-BR')}</span>
            </div>
            {data.produtos.length > 0 && (
              <div className="mt-2">
                <div className="font-medium text-xs mb-1">Produtos vendidos:</div>
                {data.produtos.slice(0, 3).map((produto: any, index: number) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {produto.name.split(" ").slice(0, 2).join(" ")} ({produto.quantity}x)
                  </div>
                ))}
                {data.produtos.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{data.produtos.length - 3} outros...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getVelocityColor = (days: number) => {
    if (days <= 7) return "hsl(var(--chart-1))"; // Verde - Rápido
    if (days <= 30) return "hsl(var(--chart-2))"; // Amarelo - Médio
    return "hsl(var(--destructive))"; // Vermelho - Lento
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Velocidade de Vendas
            </CardTitle>
            <CardDescription>
              Análise temporal das vendas e performance por produto
            </CardDescription>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Tempo Médio</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.avgDays.toFixed(0)} dias
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Vendas (30d)</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.totalSales}
              <Zap className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="flex gap-2 mt-2">
          <Badge variant="default" className="text-xs gap-1">
            <CheckCircle className="h-3 w-3" />
            Rápidas: {stats.fastProducts}
          </Badge>
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Lentas: {stats.slowProducts}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="space-y-4 w-full">
              <Skeleton className="h-8 w-full" />
              <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-12" />
                ))}
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : chartData.velocityData.length > 0 ? (
          <div className="h-full">
            {/* Gráfico de Velocidade (metade superior) */}
            <div className="h-1/2 mb-4">
              <h4 className="text-sm font-medium mb-2">Velocidade por Produto (dias para vender)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.velocityData.slice(0, 8)}
                  margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10}
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
                    label={{ value: 'Dias', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<VelocityTooltip />} />
                  
                  {/* Linha de referência para 30 dias */}
                  <ReferenceLine 
                    y={30} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    label={{ value: "30 dias", position: "top", fontSize: 10 }}
                  />
                  
                  <Bar 
                    dataKey="diasParaVender" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.velocityData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getVelocityColor(entry.diasParaVender)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Vendas Diárias (metade inferior) */}
            <div className="h-1/2">
              <h4 className="text-sm font-medium mb-2">Vendas Diárias (últimos 30 dias)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.dailySales}
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="displayDate" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    interval={6} // Mostrar apenas alguns labels
                  />
                  <YAxis 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: 'Vendas', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<DailySalesTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
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
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhuma venda registrada</p>
              <p className="text-sm">Registre vendas para ver a análise de velocidade</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}