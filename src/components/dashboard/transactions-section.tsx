"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowUpDown, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  DollarSign, 
  Package, 
  Target, 
  CreditCard,
  ShoppingCart,
  Trophy,
  Calendar,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Product, Transaction as TransactionType } from "@/types";

interface TransactionsSectionProps {
  products: Product[];
  periodFilter: "day" | "week" | "month";
  transactions?: TransactionType[];
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory: string;
  source: 'sale' | 'product_purchase' | 'operational' | 'independent';
  balance?: number;
}

export function TransactionsSection({ products, periodFilter, transactions = [] }: TransactionsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const transactionsData = useMemo(() => {
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
    const transactions: Transaction[] = [];

    // Receitas de vendas de produtos
    products.forEach(product => {
      if (product.sales) {
        product.sales
          .filter(sale => new Date(sale.date) >= periodStart)
          .forEach(sale => {
            transactions.push({
              id: `sale-${sale.id}`,
              date: new Date(sale.date),
              description: `Venda: ${product.name} (${sale.quantity}x)`,
              amount: product.sellingPrice * sale.quantity,
              type: 'income',
              category: product.category,
              subcategory: 'Venda de Produto',
              source: 'sale'
            });
          });
      }
    });

    // Focando apenas em receitas de produtos

    // Adicionar transações independentes
    transactions.forEach(transaction => {
      if (new Date(transaction.date) >= periodStart) {
        transactions.push({
          id: `independent-${transaction.id}`,
          date: new Date(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type === 'revenue' ? 'income' : 'expense',
          category: transaction.category,
          subcategory: transaction.subcategory || 'Transação Independente',
          source: 'independent'
        });
      }
    });

    // Despesas de compra de produtos
    products
      .filter(product => new Date(product.purchaseDate) >= periodStart)
      .forEach(product => {
        transactions.push({
          id: `purchase-${product.id}`,
          date: new Date(product.purchaseDate),
          description: `Compra: ${product.name} (${product.quantity}x)`,
          amount: product.totalCost * product.quantity,
          type: 'expense',
          category: product.category,
          subcategory: 'Compra de Produto',
          source: 'product_purchase'
        });

        // Custos operacionais detalhados
        if (product.shippingCost > 0) {
          transactions.push({
            id: `shipping-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Frete: ${product.name}`,
            amount: product.shippingCost,
            type: 'expense',
            category: 'Logística',
            subcategory: 'Frete',
            source: 'operational'
          });
        }

        if (product.importTaxes > 0) {
          transactions.push({
            id: `taxes-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Impostos: ${product.name}`,
            amount: product.importTaxes,
            type: 'expense',
            category: 'Impostos',
            subcategory: 'Importação',
            source: 'operational'
          });
        }

        if (product.marketingCost > 0) {
          transactions.push({
            id: `marketing-${product.id}`,
            date: new Date(product.purchaseDate),
            description: `Marketing: ${product.name}`,
            amount: product.marketingCost,
            type: 'expense',
            category: 'Marketing',
            subcategory: 'Promoção',
            source: 'operational'
          });
        }
      });

    // Focando apenas em despesas de produtos

    // Ordenar por data
    transactions.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.date.getTime() - a.date.getTime();
      } else {
        return a.date.getTime() - b.date.getTime();
      }
    });

    // Calcular saldo acumulado
    let runningBalance = 0;
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }
      transaction.balance = runningBalance;
    });

    // Calcular estatísticas
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const totalTransactions = transactions.length;

    // Obter categorias únicas para filtro
    const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

    return {
      transactions,
      totalIncome,
      totalExpenses,
      netBalance,
      totalTransactions,
      categories
    };
  }, [products, periodFilter, sortOrder]);

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactionsData.transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || transaction.type === filterType;
      const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactionsData.transactions, searchTerm, filterType, filterCategory]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "day": return "hoje";
      case "week": return "esta semana";
      case "month": return "este mês";
      default: return "este período";
    }
  };

  const getTransactionIcon = (source: string) => {
    switch (source) {
      case 'sale': return ShoppingCart;
      case 'product_purchase': return Package;
      case 'operational': return CreditCard;
      default: return DollarSign;
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(transactionsData.netBalance)}`}>
              {transactionsData.netBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {transactionsData.netBalance >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span>Resultado {getPeriodLabel()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactionsData.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionsData.transactions.filter(t => t.type === 'income').length} entradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactionsData.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionsData.transactions.filter(t => t.type === 'expense').length} saídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionsData.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Total {getPeriodLabel()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {transactionsData.categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {sortOrder === 'desc' ? 'Mais recente' : 'Mais antigo'}
            </Button>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const IconComponent = getTransactionIcon(transaction.source);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.subcategory}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getBalanceColor(transaction.balance || 0)}`}>
                          {(transaction.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowUpDown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground">
                {transactionsData.totalTransactions === 0 
                  ? `Não há transações registradas ${getPeriodLabel()}.`
                  : "Tente ajustar os filtros para encontrar mais transações."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}