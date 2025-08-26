"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, TrendingDown, CreditCard, Package, Target, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Product, Expense } from "@/types";

interface ExpensesSectionProps {
  products: Product[];
  periodFilter: "day" | "week" | "month";
  expenses?: Expense[];
}

interface ExpenseItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'product_purchase' | 'operational';
  category: string;
  subcategory?: string;
}

export function ExpensesSection({ products, periodFilter, expenses = [] }: ExpensesSectionProps) {
  const expensesData = useMemo(() => {
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
    const allExpenses: ExpenseItem[] = [];

    // Despesas de compra de produtos
    products
      .filter(product => new Date(product.purchaseDate) >= periodStart)
      .forEach(product => {
        // Custo total do produto
        allExpenses.push({
          id: `product-${product.id}`,
          date: new Date(product.purchaseDate),
          description: `Compra: ${product.name} (${product.quantity}x)`,
          amount: product.totalCost * product.quantity,
          type: 'product_purchase',
          category: product.category,
          subcategory: 'Custo Total'
        });

        // Detalhamento dos custos (opcional, para análise mais detalhada)
        if (product.shippingCost > 0) {
          allExpenses.push({
            id: `shipping-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Frete: ${product.name}`,
            amount: product.shippingCost,
            type: 'operational',
            category: 'Logística',
            subcategory: 'Frete'
          });
        }

        if (product.importTaxes > 0) {
          allExpenses.push({
            id: `taxes-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Impostos: ${product.name}`,
            amount: product.importTaxes,
            type: 'operational',
            category: 'Impostos',
            subcategory: 'Importação'
          });
        }

        if (product.marketingCost > 0) {
          allExpenses.push({
            id: `marketing-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Marketing: ${product.name}`,
            amount: product.marketingCost,
            type: 'operational',
            category: 'Marketing',
            subcategory: 'Promoção'
          });
        }
      });

    // Adicionar despesas independentes
    if (expenses && expenses.length > 0) {
      expenses.forEach(expense => {
        if (new Date(expense.date) >= periodStart) {
          allExpenses.push({
            id: `independent-${expense.id}`,
            date: new Date(expense.date),
            description: expense.description,
            amount: expense.amount,
            type: 'operational',
            category: expense.category
          });
        }
      });
    }

    // Focando apenas em despesas de produtos

    // Ordenar por data (mais recente primeiro)
    allExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calcular totais
    const totalExpenses = allExpenses.reduce((acc, item) => acc + item.amount, 0);
    const productExpenses = allExpenses.filter(e => e.type === 'product_purchase').reduce((acc, item) => acc + item.amount, 0);
    const operationalExpenses = allExpenses.filter(e => e.type === 'operational').reduce((acc, item) => acc + item.amount, 0);
    const totalTransactions = allExpenses.length;

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

    const previousExpenses: ExpenseItem[] = [];
    
    // Despesas do período anterior
    products
      .filter(product => {
        const purchaseDate = new Date(product.purchaseDate);
        return purchaseDate >= previousPeriodStart && purchaseDate < periodStart;
      })
      .forEach(product => {
        previousExpenses.push({
          id: `prev-product-${product.id}`,
          date: new Date(product.purchaseDate),
          description: `Compra: ${product.name}`,
          amount: product.totalCost * product.quantity,
          type: 'product_purchase',
          category: product.category
        });
      });

    const previousTotal = previousExpenses.reduce((acc, item) => acc + item.amount, 0);
    const growthPercentage = previousTotal > 0 ? ((totalExpenses - previousTotal) / previousTotal) * 100 : 0;

    // Análise por categoria
    const categoryBreakdown = allExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      expenses: allExpenses,
      totalExpenses,
      productExpenses,
      operationalExpenses,
      totalTransactions,
      growthPercentage,
      topCategories
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

  const getExpenseTypeIcon = (type: string) => {
    switch (type) {
      case 'product_purchase': return Package;
      case 'operational': return CreditCard;
      default: return CreditCard;
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'product_purchase': return 'Compra';
      case 'operational': return 'Operacional';
      default: return 'Outros';
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'product_purchase': return 'default';
      case 'operational': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expensesData.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {expensesData.growthPercentage >= 0 ? (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-green-500 mr-1 rotate-180" />
              )}
              <span className={expensesData.growthPercentage >= 0 ? "text-red-500" : "text-green-500"}>
                {Math.abs(expensesData.growthPercentage).toFixed(1)}%
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expensesData.productExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {expensesData.expenses.filter(e => e.type === 'product_purchase').length} compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Comprados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expensesData.expenses.filter(e => e.type === 'product_purchase').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos adquiridos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operacional</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expensesData.operationalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Frete, impostos, marketing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5 text-red-500" />
            Despesas {getPeriodLabel().charAt(0).toUpperCase() + getPeriodLabel().slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expensesData.expenses.length > 0 ? (
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
                  {expensesData.expenses.map((expense) => {
                    const IconComponent = getExpenseTypeIcon(expense.type);
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="text-xs md:text-sm">
                          <div className="md:hidden">{format(expense.date, 'dd/MM', { locale: ptBR })}</div>
                          <div className="hidden md:block">{format(expense.date, 'dd/MM/yyyy', { locale: ptBR })}</div>
                        </TableCell>
                        <TableCell className="font-medium text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <IconComponent className="h-3 w-3 md:h-4 md:w-4" />
                            <div className="max-w-[120px] md:max-w-none truncate">
                              {expense.description}
                            </div>
                          </div>
                          {expense.subcategory && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {expense.subcategory}
                            </div>
                          )}
                          <div className="sm:hidden text-xs text-muted-foreground mt-1 flex gap-1">
                            <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                            <Badge variant={getExpenseTypeColor(expense.type) as any} className="text-xs">
                              {getExpenseTypeLabel(expense.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={getExpenseTypeColor(expense.type) as any} className="text-xs">
                            {getExpenseTypeLabel(expense.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600 text-xs md:text-sm">
                          <div className="md:hidden">-{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$')}</div>
                          <div className="hidden md:block">-{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground">
                Não há despesas registradas {getPeriodLabel()}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Categorias */}
      {expensesData.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Maiores Categorias de Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expensesData.topCategories.map(([category, amount], index) => {
                const percentage = (amount / expensesData.totalExpenses) * 100;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-medium">{category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% do total
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}