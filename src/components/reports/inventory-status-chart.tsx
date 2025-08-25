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
  PieChart,
  Pie,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, AlertTriangle, CheckCircle2, Clock, Archive } from "lucide-react"
import type { Product } from "@/types"
import { useMemo } from "react"

type InventoryStatusChartProps = {
  data: Product[];
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  'purchased': { 
    label: 'Comprado', 
    color: 'hsl(var(--chart-4))', 
    icon: Package,
    priority: 1 
  },
  'shipping': { 
    label: 'Enviando', 
    color: 'hsl(var(--chart-2))', 
    icon: Clock,
    priority: 2 
  },
  'received': { 
    label: 'Recebido', 
    color: 'hsl(var(--chart-3))', 
    icon: CheckCircle2,
    priority: 3 
  },
  'selling': { 
    label: 'Vendendo', 
    color: 'hsl(var(--chart-1))', 
    icon: Package,
    priority: 4 
  },
  'sold': { 
    label: 'Vendido', 
    color: 'hsl(var(--primary))', 
    icon: CheckCircle2,
    priority: 5 
  }
};

export function InventoryStatusChart({ data, isLoading }: InventoryStatusChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { statusData: [], stockData: [], lowStockData: [] };
    
    // Análise por status
    const statusStats = data.reduce((acc, product) => {
      const status = product.status;
      if (!acc[status]) {
        acc[status] = {
          status,
          label: STATUS_CONFIG[status]?.label || status,
          count: 0,
          totalValue: 0,
          totalUnits: 0,
          products: [],
          color: STATUS_CONFIG[status]?.color || 'hsl(var(--muted))',
          priority: STATUS_CONFIG[status]?.priority || 0
        };
      }
      
      acc[status].count++;
      acc[status].totalValue += product.totalCost * product.quantity;
      acc[status].totalUnits += product.quantity;
      acc[status].products.push(product.name);
      
      return acc;
    }, {} as Record<string, any>);

    const statusData = Object.values(statusStats)
      .sort((a: any, b: any) => a.priority - b.priority);

    // Análise de estoque por produto
    const stockData = data
      .map(product => {
        const stockLevel = product.quantity - product.quantitySold;
        const stockPercentage = product.quantity > 0 ? (stockLevel / product.quantity) * 100 : 0;
        
        let stockStatus = 'normal';
        let stockColor = 'hsl(var(--chart-1))';
        
        if (stockLevel === 0) {
          stockStatus = 'out';
          stockColor = 'hsl(var(--destructive))';
        } else if (stockLevel <= 2) {
          stockStatus = 'low';
          stockColor = 'hsl(var(--chart-3))';
        } else if (stockPercentage >= 80) {
          stockStatus = 'high';
          stockColor = 'hsl(var(--chart-2))';
        }

        return {
          name: product.name.split(" ").slice(0, 2).join(" "),
          fullName: product.name,
          estoque: stockLevel,
          vendidos: product.quantitySold,
          total: product.quantity,
          percentual: stockPercentage,
          categoria: product.category,
          status: product.status,
          statusLabel: STATUS_CONFIG[product.status]?.label || product.status,
          stockStatus,
          color: stockColor,
          valorEstoque: product.totalCost * stockLevel,
          lucroRealizado: product.actualProfit
        };
      })
      .sort((a, b) => a.estoque - b.estoque);

    // Produtos com estoque baixo (≤ 2 unidades)
    const lowStockData = stockData.filter(item => item.estoque <= 2 && item.estoque > 0);

    return { statusData, stockData, lowStockData };
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.statusData.length === 0) return { 
      totalProducts: 0, totalValue: 0, lowStockCount: 0, soldCount: 0 
    };
    
    const totalProducts = chartData.statusData.reduce((acc: number, item: any) => acc + item.count, 0);
    const totalValue = chartData.statusData.reduce((acc: number, item: any) => acc + item.totalValue, 0);
    const lowStockCount = chartData.lowStockData.length;
    const soldCount = chartData.statusData.find((item: any) => item.status === 'sold')?.count || 0;
    
    return { totalProducts, totalValue, lowStockCount, soldCount };
  }, [chartData]);

  const StatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <div className="font-semibold text-sm mb-2">{data.label}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Produtos:</span>
              <span className="font-medium">{data.count} tipos</span>
            </div>
            <div className="flex justify-between">
              <span>Unidades:</span>
              <span className="font-medium">{data.totalUnits} total</span>
            </div>
            <div className="flex justify-between">
              <span>Valor:</span>
              <span className="font-medium text-blue-600">R$ {data.totalValue.toLocaleString('pt-BR')}</span>
            </div>
            {data.products.length > 0 && (
              <div className="mt-2">
                <div className="font-medium text-xs mb-1">Produtos:</div>
                {data.products.slice(0, 3).map((produto: string, index: number) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {produto.split(" ").slice(0, 2).join(" ")}
                  </div>
                ))}
                {data.products.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{data.products.length - 3} outros...
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

  const StockTooltip = ({ active, payload }: any) => {
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
              <span>Status:</span>
              <Badge variant="outline" className="text-xs">{data.statusLabel}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Em estoque:</span>
              <span className="font-medium">{data.estoque} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Vendidos:</span>
              <span className="font-medium text-green-600">{data.vendidos} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>Total original:</span>
              <span className="font-medium">{data.total} unidades</span>
            </div>
            <div className="flex justify-between">
              <span>% em estoque:</span>
              <span className="font-medium">{data.percentual.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Valor estoque:</span>
              <span className="font-medium text-blue-600">R$ {data.valorEstoque.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getStockLevelIcon = (stockStatus: string) => {
    switch (stockStatus) {
      case 'out': return AlertTriangle;
      case 'low': return AlertTriangle;
      case 'high': return Archive;
      default: return Package;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Status do Inventário
            </CardTitle>
            <CardDescription>
              Análise de estoque e status dos produtos
            </CardDescription>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Total Produtos</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {stats.totalProducts}
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Valor Estoque</div>
            <div className="text-lg font-bold">
              {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {stats.lowStockCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Estoque baixo: {stats.lowStockCount}
            </Badge>
          )}
          {stats.soldCount > 0 && (
            <Badge variant="default" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Vendidos: {stats.soldCount}
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-16" />
                ))}
              </div>
            </div>
          </div>
        ) : chartData.statusData.length > 0 ? (
          <div className="h-full">
            {/* Gráfico de Status (metade superior) */}
            <div className="h-1/2 mb-4">
              <h4 className="text-sm font-medium mb-2">Distribuição por Status</h4>
              <div className="h-full flex">
                {/* Pie Chart */}
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={25}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {chartData.statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<StatusTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Status Legend */}
                <div className="w-1/2 pl-4 flex flex-col justify-center">
                  <div className="space-y-2">
                    {chartData.statusData.map((status: any, index: number) => {
                      const IconComponent = STATUS_CONFIG[status.status as keyof typeof STATUS_CONFIG]?.icon || Package;
                      return (
                        <div key={status.status} className="flex items-center gap-2 text-xs">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: status.color }}
                          />
                          <IconComponent className="h-3 w-3" />
                          <span className="flex-1">{status.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {status.count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Estoque (metade inferior) */}
            <div className="h-1/2">
              <h4 className="text-sm font-medium mb-2">Níveis de Estoque por Produto</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.stockData.slice(0, 10)}
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
                    label={{ value: 'Unidades', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<StockTooltip />} />
                  
                  <Bar dataKey="estoque" radius={[4, 4, 0, 0]}>
                    {chartData.stockData.slice(0, 10).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base font-medium mb-2">Nenhum produto no inventário</p>
              <p className="text-sm">Adicione produtos para ver a análise de estoque</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}