"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Product } from "@/types"

type ProfitChartProps = {
    data: Product[];
}

export function ProfitChart({ data }: ProfitChartProps) {
  
  const chartData = data.map(product => ({
    name: product.name.split(" ").slice(0, 2).join(" "), // Pega as duas primeiras palavras
    lucro: product.actualProfit,
    custo: product.totalCost * product.quantity,
  }))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Análise de Lucro vs. Custo</CardTitle>
        <CardDescription>Comparativo por produto</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
