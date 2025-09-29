"use client";

import { useState } from "react";
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
import { SummaryCard } from "@/components/dashboard/summary-card";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { SupplierChart } from "@/components/dashboard/supplier-chart";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { SalesHistorySection } from "@/components/dashboard/sales-history-section";
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
  isPro?: boolean;
  onOpenForm: () => void;
  onSearch: (term: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onSellProduct: (product: Product) => void;
  onUpgradeClick?: () => void;
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
  isPro = false,
  onOpenForm,
  onSearch,
  onProductClick,
  onEditProduct,
  onDeleteProduct,
  onSellProduct,
  onUpgradeClick = () => {},
  onLoadExampleData = () => {}
}: BusinessDashboardProps) {
  // Função para scroll das tabs
  const handleTabScroll = (direction: 'left' | 'right') => {
    const tabsList = document.querySelector('.responsive-tabs');
    if (tabsList) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
        
        <TabsList className="mb-4 sm:mb-6 overflow-x-auto flex-wrap gap-1 responsive-tabs scrollbar-hide px-8">
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
          <TabsTrigger value="revenue" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Receitas</TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Despesas</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
            <span className="hidden sm:inline">Transações</span>
            <span className="sm:hidden">Trans.</span>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-3">
            <ProfitChart data={products} isLoading={isLoading}/>
          </div>
          <div className="lg:col-span-2">
            <CategoryChart data={products} isLoading={isLoading}/>
          </div>
        </div>

        {/* Seção de Produtos */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Produtos</h2>
            <Button onClick={onOpenForm} className="gap-2 text-sm sm:text-base">
              <PlusCircle className="h-4 w-4"/>
              Adicionar Produto
            </Button>
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
        <SupplierChart data={products} isLoading={isLoading} isPro={isPro} onUpgradeClick={onUpgradeClick} />
      </TabsContent>
      
      <TabsContent value="sales">
        <SalesHistorySection periodFilter={periodFilter} />
      </TabsContent>
      
      <TabsContent value="revenue">
        <RevenueSection 
          products={products}
          periodFilter={periodFilter}
          revenues={revenues}
        />
      </TabsContent>
      
      <TabsContent value="expenses">
        <ExpensesSection 
          products={products}
          periodFilter={periodFilter}
          expenses={expenses}
        />
      </TabsContent>
      
      <TabsContent value="transactions">
        <TransactionsSection 
          products={products}
          periodFilter={periodFilter}
          transactions={transactions}
        />
      </TabsContent>
    </Tabs>
  );
}