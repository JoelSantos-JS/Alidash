"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  DollarSign, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Target, 
  Archive,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { SupplierChart } from "@/components/dashboard/supplier-chart";
import { SalesTrendsChart } from "@/components/reports/sales-trends-chart";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { SalesHistorySection } from "@/components/dashboard/sales-history-section";
import { useAuth } from "@/hooks/use-supabase-auth";
import type { Product } from "@/types";

interface BusinessDashboardProps {
  products: Product[];
  isLoading: boolean;
  summaryStats: {
    totalInvested: number;
    totalActualProfit: number;
    projectedProfit: number;
    productsInStock: number;
    productsSolds: number;
    lowStockCount: number;
  };
  filteredProducts: Product[];
  periodFilter: "day" | "week" | "month";
  revenues: any[];
  expenses: any[];
  transactions: any[];
  currentDate?: Date;
  onOpenForm: () => void;
  onSearch: (term: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onSellProduct: (product: Product) => void;
  onLoadExampleData?: () => void;
}

export function BusinessDashboard({
  products,
  isLoading,
  summaryStats,
  filteredProducts,
  periodFilter,
  revenues,
  expenses,
  transactions,
  currentDate: currentDateProp,
  onOpenForm,
  onSearch,
  onProductClick,
  onEditProduct,
  onDeleteProduct,
  onSellProduct,
  onLoadExampleData
}: BusinessDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentDate, setCurrentDate] = useState(new Date());
  const anchorDate = currentDateProp || currentDate;
  
  // Carregar dados do período selecionado
  
  const handlePeriodChange = (date: Date) => {
    setCurrentDate(date);
    
    // Aqui implementaríamos a chamada para API com os parâmetros de mês e ano
    const month = date.getMonth() + 1; // Mês em JavaScript é 0-indexed
    const year = date.getFullYear();
    
    console.log(`Carregando dados para: ${month}/${year}`);
    
    // Exemplo de como seria a chamada para API
    // loadDashboardData(userId, 'business', month, year);
  };
  
  // Função para scroll das tabs com ref local (mais confiável)
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);
  const handleTabScroll = (direction: 'left' | 'right') => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <div className="relative tabs-container">
        {/* Botões de navegação */}
        <button 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background border rounded-l-md p-1 text-muted-foreground hover:text-foreground transition-colors nav-button"
          onClick={() => handleTabScroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <button 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background border rounded-r-md p-1 text-muted-foreground hover:text-foreground transition-colors nav-button"
          onClick={() => handleTabScroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        <TabsList ref={tabsScrollRef} className="mb-4 sm:mb-6 overflow-x-auto flex-nowrap gap-1 responsive-tabs scrollbar-hide px-8">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            <span className="hidden sm:inline">Dashboard Geral</span>
            <span className="sm:hidden">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            <span className="hidden sm:inline">Análise de Fornecedores</span>
            <span className="sm:hidden">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            <span className="hidden sm:inline">Histórico de Vendas</span>
            <span className="sm:hidden">Vendas</span>
          </TabsTrigger>
          
        </TabsList>
      </div>
      
      <TabsContent value="dashboard">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] sm:h-[116px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <SummaryCard 
              title="Total Investido"
              value={summaryStats.totalInvested}
              icon={DollarSign}
              isCurrency
            />
            <SummaryCard 
              title="Lucro Realizado"
              value={summaryStats.totalActualProfit}
              icon={TrendingUp}
              isCurrency
            />
            <SummaryCard 
              title="Lucro Potencial"
              value={summaryStats.projectedProfit}
              icon={Target}
              isCurrency
            />
            <SummaryCard 
              title="Produtos em Estoque"
              value={summaryStats.productsInStock}
              icon={Package}
            />
            <SummaryCard 
              title="Produtos Vendidos"
              value={summaryStats.productsSolds}
              icon={ShoppingCart}
            />
            <SummaryCard 
              title="Alerta de Estoque Baixo"
              value={summaryStats.lowStockCount}
              icon={Archive}
              className={summaryStats.lowStockCount > 0 ? "text-destructive" : ""}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-3 xl:col-span-6">
            <ProfitChart data={products} isLoading={isLoading}/>
          </div>
          <div className="lg:col-span-2 xl:col-span-3">
            <CategoryChart data={products} isLoading={isLoading}/>
          </div>
          <div className="lg:col-span-5 xl:col-span-3">
            <SalesTrendsChart data={products} isLoading={isLoading} />
          </div>
        </div>

        {/* Metas removidas do dashboard empresarial conforme solicitado */}

        {/* Seção de Produtos */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Produtos</h2>
            <div className="flex items-center gap-2">
              <PeriodSelector 
            currentDate={currentDate} 
            onDateChange={handlePeriodChange}
            className="mr-2"
              />
              <Button 
                onClick={onOpenForm} 
                size="sm" 
                className="h-8 sm:h-9 px-3 sm:px-4 gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <PlusCircle className="h-4 w-4"/>
                <span className="hidden sm:inline">Adicionar Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </div>
          </div>
          <ProductSearch onSearch={onSearch} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] sm:h-[350px] w-full" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando seus primeiros produtos ou carregue alguns dados de exemplo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onOpenForm} className="gap-2">
                <PlusCircle className="h-4 w-4"/>
                Adicionar Primeiro Produto
              </Button>
              <Button variant="outline" onClick={onLoadExampleData} className="gap-2">
                <Package className="h-4 w-4"/>
                Carregar Dados de Exemplo
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onProductClick(product)}
                onEdit={() => onEditProduct(product)}
                onDelete={() => onDeleteProduct(product)}
                onSell={() => onSellProduct(product)}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="suppliers">
        <SupplierChart data={products} isLoading={isLoading} />
      </TabsContent>
      
      <TabsContent value="sales">
        <SalesTrendsChart data={products} isLoading={isLoading} />
      </TabsContent>
      
      
    </Tabs>
  );
}