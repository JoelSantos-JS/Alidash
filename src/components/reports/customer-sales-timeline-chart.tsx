"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { Product } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerSalesTimelineChartProps {
  data: Product[];
  isLoading: boolean;
}

export function CustomerSalesTimelineChart({ data, isLoading }: CustomerSalesTimelineChartProps) {
  const processed = useMemo(() => {
    const sales = (data || []).flatMap(p => (p.sales || []).map(s => ({
      id: s.id,
      customer: s.buyerName || "Cliente",
      product: p.name,
      date: new Date(s.date)
    })));

    const customers = Array.from(new Set(sales.map(s => s.customer)));
    const indexByCustomer = new Map(customers.map((c, i) => [c, i]));

    const chartData = sales.map(s => {
      const h = s.date.getHours() + s.date.getMinutes() / 60;
      return {
        x: Number(h.toFixed(2)),
        y: indexByCustomer.get(s.customer) || 0,
        customer: s.customer,
        product: s.product,
        timeLabel: format(s.date, "dd/MM/yyyy HH:mm", { locale: ptBR })
      };
    });

    return { chartData, customers };
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vendas por Cliente</CardTitle>
        <CardDescription>Distribuição por hora com cliente e produto</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px]">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-1 sm:gap-2 px-2 sm:px-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-full w-full" />
            ))}
          </div>
        ) : processed.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={[0, 24]} tickFormatter={(v) => `${Math.floor(v)}h`} />
              <YAxis type="number" dataKey="y" tickFormatter={(v) => processed.customers[v] || ""} allowDecimals={false} />
              <Tooltip formatter={(_, __, item) => [`${item.payload.product}`, `${item.payload.customer} • ${item.payload.timeLabel}`]} />
              <Scatter data={processed.chartData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
            <div>
              <p className="text-sm sm:text-base">Nenhuma venda registrada.</p>
              <p className="text-xs sm:text-sm">Registre vendas para visualizar clientes e horários.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

