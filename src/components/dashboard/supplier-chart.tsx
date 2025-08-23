"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Product } from "@/types"
import { Skeleton } from "../ui/skeleton";
import { UpgradeToProCard } from "../layout/upgrade-to-pro-card";

type SupplierChartProps = {
    data: Product[];
    isLoading?: boolean;
    isPro: boolean;
    onUpgradeClick: () => void;
}

export function SupplierChart({ data, isLoading, isPro, onUpgradeClick }: SupplierChartProps) {
  
  const chartData = React.useMemo(() => {
    const profitBySupplier = data.reduce((acc, product) => {
        if (!product.supplier) return acc;
        if (!acc[product.supplier]) {
            acc[product.supplier] = { supplier: product.supplier, profit: 0 };
        }
        acc[product.supplier].profit += product.actualProfit;
        return acc;
    }, {} as Record<string, { supplier: string; profit: number }>);
    
    return Object.values(profitBySupplier).sort((a,b) => b.profit - a.profit);
  }, [data]);

  const [skeletonHeights, setSkeletonHeights] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (isLoading) {
      const heights = Array.from({ length: 10 }, () => Math.random() * 80 + 10);
      setSkeletonHeights(heights);
    }
  }, [isLoading]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lucro por Fornecedor (Pro)</CardTitle>
        <CardDescription>Análise do lucro realizado por cada fornecedor</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] relative">
        {!isPro && (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
                <UpgradeToProCard 
                    title="Análise de Fornecedores"
                    description="Identifique seus fornecedores mais lucrativos e otimize suas compras com esta análise exclusiva para assinantes Pro."
                    onUpgradeClick={onUpgradeClick}
                />
            </div>
        )}
        {isLoading ? (
            <div className="w-full h-full flex items-end gap-1 sm:gap-2 px-2 sm:px-4">
                {skeletonHeights.map((height, i) => (
                    <Skeleton key={i} className="h-full w-full" style={{height: `${height}%`}} />
                ))}
            </div>
        ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, top: 5, right: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    type="number" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$${value}`}
                />
                <YAxis 
                    dataKey="supplier" 
                    type="category" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    width={80}
                />
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        fontSize: '12px'
                    }}
                    formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar 
                    dataKey="profit" 
                    name="Lucro Realizado" 
                    fill="hsl(var(--chart-2))" 
                    radius={[0, 4, 4, 0]} 
                />
            </BarChart>
            </ResponsiveContainer>
        ) : (
             <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
                <div>
                    <p className="text-sm sm:text-base">Nenhum dado para exibir.</p>
                    <p className="text-xs sm:text-sm">Adicione produtos com lucro e fornecedor para ver o gráfico.</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
