"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
  BarChart3
} from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
 
import type { Product } from "@/types";

const ProfitChart = dynamic(
  () => import("@/components/dashboard/profit-chart").then((m) => m.ProfitChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] sm:h-[300px] w-full" />,
  }
);

const CategoryChart = dynamic(
  () => import("@/components/dashboard/category-chart").then((m) => m.CategoryChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] sm:h-[300px] w-full" />,
  }
);

const SupplierChart = dynamic(
  () => import("@/components/dashboard/supplier-chart").then((m) => m.SupplierChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] sm:h-[300px] w-full" />,
  }
);

const SalesTrendsChart = dynamic(
  () => import("@/components/reports/sales-trends-chart").then((m) => m.SalesTrendsChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  }
);

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
  sales: any[];
  currentDate?: Date;
  onOpenForm: () => void;
  onSearch: (term: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onSellProduct: (product: Product) => void;
  onLoadExampleData?: () => void;
  onDateChange?: (date: Date) => void;
}

export function BusinessDashboard({
  products,
  isLoading,
  summaryStats,
  filteredProducts,
  periodFilter,
  revenues,
  expenses,
  sales,
  currentDate: currentDateProp,
  onOpenForm,
  onSearch,
  onProductClick,
  onEditProduct,
  onDeleteProduct,
  onSellProduct,
  onLoadExampleData,
  onDateChange
}: BusinessDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const lastPropTimeRef = useRef<number | null>(null);

  const INITIAL_VISIBLE_PRODUCTS = 24;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  
  const handlePeriodChange = (date: Date) => {
    setCurrentDate(date);
    if (onDateChange) onDateChange(date);
  };
  
  useEffect(() => {
    if (currentDateProp) {
      const time = currentDateProp.getTime();
      if (lastPropTimeRef.current !== time) {
        lastPropTimeRef.current = time;
        setCurrentDate(currentDateProp);
      }
    }
  }, [currentDateProp]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [filteredProducts.length]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);
  
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <div>
        <TabsList className="mb-4 sm:mb-6 grid w-full grid-cols-3 gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="dashboard" 
            className="w-full h-10 sm:h-12 text-sm sm:text-base rounded-none font-medium transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Dashboard Geral</span>
            <span className="sm:hidden">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="suppliers" 
            className="w-full h-10 sm:h-12 text-sm sm:text-base rounded-none font-medium transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Package className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Análise de Fornecedores</span>
            <span className="sm:hidden">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sales" 
            className="w-full h-10 sm:h-12 text-sm sm:text-base rounded-none font-medium transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
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
              title="Saldo do Período"
              value={(summaryStats as any).periodBalance ?? 0}
              icon={DollarSign}
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {visibleProducts.map((product) => (
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
            {visibleProducts.length < filteredProducts.length && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE_PRODUCTS)}
                >
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>
      
      <TabsContent value="suppliers">
        <SupplierChart data={products} isLoading={isLoading} />
      </TabsContent>
      
      <TabsContent value="sales">
        <SalesTrendsChart data={products} revenues={revenues} sales={sales} isLoading={isLoading} />
      </TabsContent>
      
      
    </Tabs>
  );
}
