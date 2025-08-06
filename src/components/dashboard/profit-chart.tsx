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

type ProfitChartProps = {
    data: Product[];
    isLoading?: boolean;
}

export function ProfitChart({ data, isLoading }: ProfitChartProps) {
  
  const chartData = data.map(product => ({
    name: product.name.split(" ").slice(0, 2).join(" "), // Pega as duas primeiras palavras
    lucro: product.actualProfit,
    custo: product.totalCost * product.quantity,
  })).sort((a,b) => b.lucro - a.lucro).slice(0, 10); // Pega os 10 mais lucrativos
  
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
        <CardTitle>Análise de Lucro vs. Custo</CardTitle>
        <CardDescription>Top 10 produtos mais lucrativos</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="w-full h-[300px] flex items-end gap-2 px-4">
                {skeletonHeights.map((height, i) => (
                    <Skeleton key={i} className="h-full w-full" style={{height: `${height}%`}} />
                ))}
            </div>
        ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`}/>
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="lucro" name="Lucro Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo Total" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        ) : (
             <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                <div>
                    <p>Nenhum dado para exibir.</p>
                    <p className="text-sm">Adicione produtos com lucro para ver o gráfico.</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
