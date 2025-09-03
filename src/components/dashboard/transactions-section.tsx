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

interface DisplayTransaction {
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
    const processedTransactions: DisplayTransaction[] = [];
    const usedIds = new Set<string>(); // Para garantir IDs únicos
    const transactionKeyMap = new Map<string, DisplayTransaction>(); // Para detectar duplicatas por chave única

    // Função para gerar chave única para uma transação
    const generateTransactionKey = (transaction: any, source: string): string => {
      const date = new Date(transaction.date).toISOString().split('T')[0]; // YYYY-MM-DD
      const amount = transaction.amount?.toString() || '0';
      const description = transaction.description?.toLowerCase().trim() || '';
      
      return `${source}-${date}-${amount}-${description}`;
    };

    // Função para gerar ID único
    const generateUniqueId = (baseId: string): string => {
      let uniqueId = baseId;
      let counter = 1;
      
      while (usedIds.has(uniqueId)) {
        uniqueId = `${baseId}-${counter}`;
        counter++;
      }
      
      usedIds.add(uniqueId);
      return uniqueId;
    };

    // 1. Adicionar transações independentes (incluindo parceladas) - PRIORIDADE
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 TransactionsSection - Processando transações:', {
        total: transactions.length,
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          isInstallment: t.isInstallment,
          installmentInfo: t.installmentInfo ? 'presente' : 'ausente'
        }))
      });
    }

    transactions.forEach((originalTransaction: TransactionType) => {
      if (new Date(originalTransaction.date) >= periodStart) {
        let description = originalTransaction.description;
        
        // Log específico para transações parceladas
        if (originalTransaction.isInstallment && originalTransaction.installmentInfo) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 Transação parcelada encontrada:', {
              id: originalTransaction.id,
              description: originalTransaction.description,
              isInstallment: originalTransaction.isInstallment,
              installmentInfo: originalTransaction.installmentInfo,
              currentInstallment: originalTransaction.installmentInfo.currentInstallment,
              totalInstallments: originalTransaction.installmentInfo.totalInstallments
            });
          }
          
          description = `${originalTransaction.description} (${originalTransaction.installmentInfo.currentInstallment}/${originalTransaction.installmentInfo.totalInstallments})`;
        }

        const transactionKey = generateTransactionKey(originalTransaction, 'independent');
        
        // Verificar se já existe uma transação com a mesma chave
        if (!transactionKeyMap.has(transactionKey)) {
          const uniqueId = generateUniqueId(originalTransaction.id);
          
          const displayTransaction: DisplayTransaction = {
            id: uniqueId,
            date: new Date(originalTransaction.date),
            description: description,
            amount: originalTransaction.amount,
            type: originalTransaction.type === 'revenue' ? 'income' : 'expense',
            category: originalTransaction.category,
            subcategory: originalTransaction.subcategory || (originalTransaction.isInstallment ? 'Compra Parcelada' : 'Transação Independente'),
            source: 'independent'
          };
          
          processedTransactions.push(displayTransaction);
          transactionKeyMap.set(transactionKey, displayTransaction);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Transação duplicada detectada e ignorada:', {
              description: description,
              amount: originalTransaction.amount,
              date: originalTransaction.date,
              existingKey: transactionKey
            });
          }
        }
      }
    });

    // 2. Adicionar vendas de produtos (apenas se não houver conflito)
    products.forEach(product => {
      if (product.sales) {
        product.sales
          .filter(sale => new Date(sale.date) >= periodStart)
          .forEach(sale => {
            const saleTransaction = {
              date: sale.date,
              amount: product.sellingPrice * sale.quantity,
              description: `Venda: ${product.name} (${sale.quantity}x)`
            };
            
            const transactionKey = generateTransactionKey(saleTransaction, 'sale');
            
            // Verificar se já existe uma transação com a mesma chave
            if (!transactionKeyMap.has(transactionKey)) {
              const baseId = `sale-${sale.id}`;
              const uniqueId = generateUniqueId(baseId);
              
              const displayTransaction: DisplayTransaction = {
                id: uniqueId,
                date: new Date(sale.date),
                description: saleTransaction.description,
                amount: saleTransaction.amount,
                type: 'income',
                category: product.category,
                subcategory: 'Venda de Produto',
                source: 'sale'
              };
              
              processedTransactions.push(displayTransaction);
              transactionKeyMap.set(transactionKey, displayTransaction);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('🚫 Venda duplicada detectada e ignorada:', {
                  description: saleTransaction.description,
                  amount: saleTransaction.amount,
                  date: sale.date,
                  existingKey: transactionKey
                });
              }
            }
          });
      }
    });

    // 3. Adicionar compras de produtos (apenas se não houver conflito)
    products
      .filter(product => new Date(product.purchaseDate) >= periodStart)
      .forEach(product => {
        const purchaseTransaction = {
          date: product.purchaseDate,
          amount: product.totalCost * product.quantity,
          description: `Compra: ${product.name} (${product.quantity}x)`
        };
        
        const transactionKey = generateTransactionKey(purchaseTransaction, 'purchase');
        
        // Verificar se já existe uma transação com a mesma chave
        if (!transactionKeyMap.has(transactionKey)) {
          const baseId = `purchase-${product.id}`;
          const uniqueId = generateUniqueId(baseId);
          
          const displayTransaction: DisplayTransaction = {
            id: uniqueId,
            date: new Date(product.purchaseDate),
            description: purchaseTransaction.description,
            amount: purchaseTransaction.amount,
            type: 'expense',
            category: product.category,
            subcategory: 'Compra de Produto',
            source: 'product_purchase'
          };
          
          processedTransactions.push(displayTransaction);
          transactionKeyMap.set(transactionKey, displayTransaction);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚫 Compra duplicada detectada e ignorada:', {
              description: purchaseTransaction.description,
              amount: purchaseTransaction.amount,
              date: product.purchaseDate,
              existingKey: transactionKey
            });
          }
        }
      });

    // Ordenar por data
    processedTransactions.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.date.getTime() - a.date.getTime();
      } else {
        return a.date.getTime() - b.date.getTime();
      }
    });

    // Calcular saldo acumulado
    let runningBalance = 0;
    processedTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }
      transaction.balance = runningBalance;
    });

    // Calcular estatísticas
    const totalIncome = processedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = processedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const totalTransactions = processedTransactions.length;

    // Obter categorias únicas para filtro
    const categories = Array.from(new Set(processedTransactions.map(t => t.category))).sort();

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Processamento de transações concluído:', {
        totalProcessed: processedTransactions.length,
        uniqueKeys: transactionKeyMap.size,
        periodStart: periodStart.toISOString(),
        sortOrder
      });
    }

    return {
      transactions: processedTransactions,
      totalIncome,
      totalExpenses,
      netBalance,
      totalTransactions,
      categories
    };
  }, [products, transactions, periodFilter, sortOrder]);

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
    <div className="space-y-4 md:space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 md:pl-10 text-xs md:text-sm h-8 md:h-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Mais recente' : 'Mais antigo'}</span>
                <span className="sm:hidden">{sortOrder === 'desc' ? 'Recente' : 'Antigo'}</span>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs md:text-sm h-8 md:h-10">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs md:text-sm h-8 md:h-10">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {transactionsData.categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Data</TableHead>
                    <TableHead className="text-xs md:text-sm">Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs md:text-sm">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Tipo</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Valor</TableHead>
                    <TableHead className="hidden lg:table-cell text-right text-xs md:text-sm">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const IconComponent = getTransactionIcon(transaction.source);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-xs md:text-sm">
                          <div className="md:hidden">{format(transaction.date, 'dd/MM', { locale: ptBR })}</div>
                          <div className="hidden md:block">{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex items-center gap-1 md:gap-2">
                            <IconComponent className="h-3 w-3 md:h-4 md:w-4" />
                            <div>
                              <div className="font-medium max-w-[120px] md:max-w-none truncate">{transaction.description}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.subcategory}
                                {transaction.subcategory === 'Compra Parcelada' && (
                                  <span className="ml-1 text-blue-600">💳</span>
                                )}
                              </div>
                              <div className="sm:hidden flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                                <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                                  {transaction.type === 'income' ? 'R' : 'D'}
                                </Badge>
                                {transaction.subcategory === 'Compra Parcelada' && (
                                  <Badge variant="secondary" className="text-xs text-blue-600">💳</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{transaction.category}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                            {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs md:text-sm ${getTransactionColor(transaction.type)}`}>
                          <div className="md:hidden">
                            {transaction.type === 'income' ? '+' : '-'}
                            {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$')}
                          </div>
                          <div className="hidden md:block">
                            {transaction.type === 'income' ? '+' : '-'}
                            {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="lg:hidden text-xs text-muted-foreground mt-1">
                            Saldo: {(transaction.balance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$')}
                          </div>
                        </TableCell>
                        <TableCell className={`hidden lg:table-cell text-right font-medium text-xs md:text-sm ${getBalanceColor(transaction.balance || 0)}`}>
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