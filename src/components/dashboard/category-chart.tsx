"use client"

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton";
import type { Product } from "@/types"

type CategoryChartProps = {
    data: Product[];
    isLoading?: boolean;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export function CategoryChart({ data, isLoading }: CategoryChartProps) {
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const categoryCounts = data.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(categoryCounts).map((category, index) => ({
        name: category,
        value: categoryCounts[category],
        fill: COLORS[index % COLORS.length]
    }))

  }, [data]);


  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Produtos por Categoria</CardTitle>
        <CardDescription>Distribuição dos produtos cadastrados</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center h-[250px] sm:h-[300px]">
        {isLoading ? (
            <Skeleton className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] rounded-full" />
        ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        cursor={false}
                        formatter={(value: any, name: any) => [
                            `${value} produtos`,
                            name
                        ]}
                        contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            fontSize: '12px'
                        }}
                    />
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={80}
                        strokeWidth={3}
                        cx="50%"
                        cy="50%"
                    >
                        {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="text-center text-muted-foreground py-8 sm:py-10 px-4">
                <p className="text-sm sm:text-base">Nenhum dado para exibir.</p>
                <p className="text-xs sm:text-sm">Adicione produtos para ver o gráfico.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
