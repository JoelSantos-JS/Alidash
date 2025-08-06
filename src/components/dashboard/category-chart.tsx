"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
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

  const chartConfig = React.useMemo(() => 
    chartData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as ChartConfig)
  , [chartData]);


  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Produtos por Categoria</CardTitle>
        <CardDescription>Distribuição dos produtos cadastrados</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center">
        {isLoading ? (
            <Skeleton className="w-[300px] h-[300px] rounded-full" />
        ) : chartData.length > 0 ? (
            <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
            >
            <PieChart>
                <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                >
                {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
                </Pie>
            </PieChart>
            </ChartContainer>
        ) : (
            <div className="text-center text-muted-foreground py-10">
                <p>Nenhum dado para exibir.</p>
                <p className="text-sm">Adicione produtos para ver o gráfico.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
