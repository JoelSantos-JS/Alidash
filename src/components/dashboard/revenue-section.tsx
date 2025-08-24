"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, TrendingUp, DollarSign, ShoppingCart, Trophy, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Product, Revenue } from "@/types";

interface RevenueSectionProps {
  products: Product[];
  periodFilter: "day" | "week" | "month";
  revenues?: Revenue[];
}

interface RevenueItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'sale' | 'revenue';
  category: string;
}

export function RevenueSection({ products, periodFilter, revenues = [] }: RevenueSectionProps) {
  const revenueData = useMemo(() => {
    const now = new Date();
    const getPeriodStart = () => {
      switch (periodFilter) {
        case "day":
          return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case "week":
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month":
          return new Date(now.getFullYear(), now.getMonth(), 1);
        default:
          return new Date(now.getFullYear(), now.getMonth(), 1);
      }
    };

    const periodStart = getPeriodStart();
    const revenues: RevenueItem[] = [];

    // Receitas de vendas de produtos
    products.forEach(product => {
      if (product.sales) {
        product.sales
          .filter(sale => new Date(sale.date) >= periodStart)
          .forEach(sale => {
            revenues.push({
              id: `sale-${sale.id}`,
              date: new Date(sale.date),
              description: `Venda: ${product.name} (${sale.quantity}x)`,
              amount: product.sellingPrice * sale.quantity,
              type: 'sale',
              category: product.category
            });
          });
      }
    });

    // Adicionar receitas independentes
    revenues.forEach(revenue => {
      if (new Date(revenue.date) >= periodStart) {
        revenues.push({
          id: `revenue-${revenue.id}`,
          date: new Date(revenue.date),
          description: revenue.description,
          amount: revenue.amount,
          type: 'revenue',
          category: revenue.category
        });
      }
    });

    // Ordenar por data (mais recente primeiro)
    revenues.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calcular totais
    const totalRevenue = revenues.reduce((acc, item) => acc + item.amount, 0);
    const salesRevenue = revenues.filter(r => r.type === 'sale').reduce((acc, item) => acc + item.amount, 0);
    const totalTransactions = revenues.length;

    // Calcular crescimento (comparar com período anterior)
    const previousPeriodStart = new Date(periodStart);
    switch (periodFilter) {
      case "day":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        break;
      case "week":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case "month":
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        break;
    }

    const previousRevenues: RevenueItem[] = [];
    
    // Receitas do período anterior
    products.forEach(product => {
      if (product.sales) {
        product.sales
          .filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= previousPeriodStart && saleDate < periodStart;
          })
          .forEach(sale => {
            previousRevenues.push({
              id: `prev-sale-${sale.id}`,
              date: new Date(sale.date),
              description: `Venda: ${product.name}`,
              amount: product.sellingPrice * sale.quantity,
              type: 'sale',
              category: product.category
            });
          });
      }
    });

    const previousTotal = previousRevenues.reduce((acc, item) => acc + item.amount, 0);
    const growthPercentage = previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0;

    return {
      revenues,
      totalRevenue,
      salesRevenue,
      totalTransactions,
      growthPercentage
    };
  }, [products, periodFilter]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "day": return "hoje";
      case "week": return "esta semana";
      case "month": return "este mês";
      default: return "este período";
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenueData.growthPercentage >= 0 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              )}
              <span className={revenueData.growthPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(revenueData.growthPercentage).toFixed(1)}%
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData.salesRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenueData.revenues.filter(r => r.type === 'sale').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueData.revenues.filter(r => r.type === 'sale').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unidades vendidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Receitas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-green-500" />
            Receitas {getPeriodLabel().charAt(0).toUpperCase() + getPeriodLabel().slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.revenues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.revenues.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell>
                      {format(revenue.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {revenue.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{revenue.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Venda
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{revenue.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma receita encontrada</h3>
              <p className="text-muted-foreground">
                Não há receitas registradas {getPeriodLabel()}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}