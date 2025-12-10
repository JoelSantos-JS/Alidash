"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      customer: s.buyerName || "—",
      product: p.name,
      date: new Date(s.date)
    })));

    const listData = sales
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map(s => ({
        id: s.id,
        customer: s.customer,
        product: s.product,
        timeLabel: format(s.date, "dd/MM/yyyy HH:mm", { locale: ptBR })
      }));

    return { listData };
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vendas por Cliente</CardTitle>
        <CardDescription>Lista com cliente, horário e produto</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : processed.listData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Produto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processed.listData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{item.timeLabel}</TableCell>
                  <TableCell>{item.product}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-4">
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
