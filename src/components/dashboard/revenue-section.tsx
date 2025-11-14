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
  currentDate?: Date;
  revenues?: Revenue[];
}

interface RevenueItem {
  id: string;
  date: Date;
  time?: string;
  description: string;
  amount: number;
  type: 'sale' | 'revenue';
  category: string;
  source?: string;
}

export function RevenueSection({ products, periodFilter, currentDate = new Date(), revenues = [] }: RevenueSectionProps) {
  const revenueData = useMemo(() => {
    const now = currentDate;
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
    const allRevenues: RevenueItem[] = [];

    // Receitas de vendas de produtos
    products.forEach(product => {
      if (product.sales) {
        product.sales
          .filter(sale => new Date(sale.date) >= periodStart)
          .forEach(sale => {
            allRevenues.push({
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
        allRevenues.push({
          id: `revenue-${revenue.id}`,
          date: new Date(revenue.date),
          time: revenue.time,
          description: revenue.description,
          amount: revenue.amount,
          type: 'revenue',
          category: revenue.category
        });
      }
    });

    // Ordenar por data (mais recente primeiro)
    allRevenues.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calcular totais
    const totalRevenue = allRevenues.reduce((acc, item) => acc + item.amount, 0);
    const salesRevenue = allRevenues.filter(r => r.type === 'sale').reduce((acc, item) => acc + item.amount, 0);
    const totalTransactions = allRevenues.length;

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
      revenues: allRevenues,
      totalRevenue,
      salesRevenue,
      totalTransactions,
      growthPercentage
    };
  }, [products, periodFilter, currentDate, revenues]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "day": return `no dia ${format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      case "week": return `nos últimos 7 dias até ${format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      case "month": return `de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`;
      default: return "no período selecionado";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Data</TableHead>
                    <TableHead className="text-xs md:text-sm">Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs md:text-sm">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Tipo</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.revenues.map((revenue) => {
                    console.log('📊 Renderizando receita:', { id: revenue.id, time: revenue.time, date: revenue.date });
                    return (
                      <TableRow key={revenue.id}>
                        <TableCell className="text-xs md:text-sm">
                          <div className="md:hidden">
                            {format(revenue.date, 'dd/MM', { locale: ptBR })}
                            {revenue.time && <div className="text-xs text-muted-foreground">{revenue.time}</div>}
                          </div>
                          <div className="hidden md:block">
                            {format(revenue.date, 'dd/MM/yyyy', { locale: ptBR })}
                            {revenue.time && <div className="text-xs text-muted-foreground">{revenue.time}</div>}
                          </div>
                        </TableCell>
                      <TableCell className="font-medium text-xs md:text-sm">
                        <div className="max-w-[120px] md:max-w-none truncate">
                          {revenue.description}
                        </div>
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs">{revenue.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{revenue.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="default" className="text-xs">
                          {revenue.type === 'sale' ? 'Venda' : 'Receita'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 text-xs md:text-sm">
                        <div className="md:hidden">+{revenue.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$')}</div>
                        <div className="hidden md:block">+{revenue.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </div>
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