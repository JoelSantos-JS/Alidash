"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-supabase-auth";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  productId: string;
  productName: string;
  buyerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  createdAt: Date;
}

interface SalesHistorySectionProps {
  periodFilter: "day" | "week" | "month";
}

export function SalesHistorySection({ periodFilter }: SalesHistorySectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "product">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch sales data
  const fetchSales = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Carregando vendas do usuário:', user.id);
      
      // O usuário já é do Supabase, então podemos usar o ID diretamente
      const supabaseUserId = user.id;
      
      console.log('✅ Usuário Supabase ID:', supabaseUserId);
      
      // Buscar vendas usando API route
      const salesResponse = await fetch(`/api/sales/get?user_id=${supabaseUserId}`);
        
      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        const salesData = salesResult.sales || [];
        console.log('🛒 Vendas do Supabase:', salesData.length);
        setSales(salesData);
      } else {
        console.error('❌ Erro ao buscar vendas do Supabase:', await salesResponse.text());
        setSales([]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de vendas.",
        variant: "destructive",
      });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort sales
  useEffect(() => {
    let filtered = [...sales];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sale =>
        sale.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Period filter
    const now = new Date();
    const filterDate = new Date();
    
    switch (periodFilter) {
      case "day":
        filterDate.setDate(now.getDate() - 1);
        break;
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    filtered = filtered.filter(sale => new Date(sale.date) >= filterDate);

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "amount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "product":
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSales(filtered);
  }, [sales, searchQuery, periodFilter, sortBy, sortOrder]);

  // Load sales on component mount
  useEffect(() => {
    fetchSales();
  }, [user]);

  // Calculate summary stats
  const summaryStats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalQuantity: filteredSales.reduce((sum, sale) => sum + sale.quantity, 0),
    averageTicket: filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / filteredSales.length : 0
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalSales}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalRevenue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalQuantity}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.averageTicket.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Histórico de Vendas
              </CardTitle>
              <CardDescription>
                {filteredSales.length} venda{filteredSales.length !== 1 ? 's' : ''} encontrada{filteredSales.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSales}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou comprador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: "date" | "amount" | "product") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="product">Produto</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
              <p className="text-muted-foreground">
                {searchQuery || periodFilter !== "month" 
                  ? "Tente ajustar os filtros de busca."
                  : "Suas vendas aparecerão aqui quando forem registradas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sale.date), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sale.productName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sale.buyerName || 'Não informado'}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{sale.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {sale.unitPrice.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {sale.totalAmount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}