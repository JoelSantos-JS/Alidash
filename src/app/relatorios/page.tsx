"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Download,
  FileText,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { exportReportToPDF, exportReportToExcel, calculateReportStats } from "@/lib/report-export";
import type { Product } from "@/types";
import { supabaseService } from "@/lib/supabase-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Componentes de relatórios
import { ProfitabilityAnalysisChart } from "@/components/reports/profitability-analysis-chart";
import { CategoryPerformanceChart } from "@/components/reports/category-performance-chart";
import { SalesVelocityChart } from "@/components/reports/sales-velocity-chart";
import { ROIComparisonChart } from "@/components/reports/roi-comparison-chart";
import { InventoryStatusChart } from "@/components/reports/inventory-status-chart";
import { SupplierPerformanceChart } from "@/components/reports/supplier-performance-chart";
import { SalesTrendsChart } from "@/components/reports/sales-trends-chart";
import { ProfitMarginAnalysisChart } from "@/components/reports/profit-margin-analysis-chart";
import { CustomerSalesTimelineChart } from "@/components/reports/customer-sales-timeline-chart";
// Sidebar component
import { ReportsSidebar } from '@/components/reports/reports-sidebar';

// Dados iniciais (mesmos da página principal)
const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Xiaomi",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Smartphone de última geração",
    purchasePrice: 800,
    shippingCost: 50,
    importTaxes: 120,
    packagingCost: 10,
    marketingCost: 30,
    otherCosts: 20,
    totalCost: 1030,
    sellingPrice: 1500,
    expectedProfit: 470,
    profitMargin: 31.3,
    sales: [
      {
        id: "sale1",
        date: new Date(2024, 11, 15),
        quantity: 1,
        buyerName: "João Silva",
        productId: "1"
      }
    ],
    quantity: 3,
    quantitySold: 1,
    status: 'selling',
    purchaseDate: new Date(2024, 11, 1),
    roi: 45.6,
    actualProfit: 470
  },
  {
    id: "2",
    name: "Fone de Ouvido Bluetooth",
    category: "Acessórios",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Fone sem fio de alta qualidade",
    purchasePrice: 120,
    shippingCost: 15,
    importTaxes: 18,
    packagingCost: 5,
    marketingCost: 10,
    otherCosts: 5,
    totalCost: 173,
    sellingPrice: 250,
    expectedProfit: 77,
    profitMargin: 30.8,
    sales: [],
    quantity: 5,
    quantitySold: 0,
    status: 'received',
    purchaseDate: new Date(2024, 11, 10),
    roi: 0,
    actualProfit: 0
  },
  {
    id: "3",
    name: "Relógio Smart",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Relógio inteligente com monitor cardíaco",
    purchasePrice: 200,
    shippingCost: 25,
    importTaxes: 30,
    packagingCost: 8,
    marketingCost: 15,
    otherCosts: 7,
    totalCost: 285,
    sellingPrice: 450,
    expectedProfit: 165,
    profitMargin: 36.7,
    sales: [
      {
        id: "sale2",
        date: new Date(2024, 11, 20),
        quantity: 1,
        buyerName: "Maria Santos",
        productId: "3"
      }
    ],
    quantity: 2,
    quantitySold: 1,
    status: 'selling',
    purchaseDate: new Date(2024, 11, 5),
    roi: 57.9,
    actualProfit: 165
  }
];

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "quarter" | "year">("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Carregar dados dos produtos do Supabase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados para relatórios (Supabase):', user.id);

        // Buscar produtos reais do Supabase via API
        const response = await fetch(`/api/products/get?user_id=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        const supabaseProducts = data.products || [];

        // Validar e processar dados dos produtos
        const processedProducts = supabaseProducts.map((product: any) => ({
          ...product,
          // Garantir que campos numéricos sejam números
          purchasePrice: Number(product.purchasePrice) || 0,
          shippingCost: Number(product.shippingCost) || 0,
          importTaxes: Number(product.importTaxes) || 0,
          packagingCost: Number(product.packagingCost) || 0,
          marketingCost: Number(product.marketingCost) || 0,
          otherCosts: Number(product.otherCosts) || 0,
          totalCost: Number(product.totalCost) || 0,
          sellingPrice: Number(product.sellingPrice) || 0,
          expectedProfit: Number(product.expectedProfit) || 0,
          actualProfit: Number(product.actualProfit) || 0,
          profitMargin: Number(product.profitMargin) || 0,
          roi: Number(product.roi) || 0,
          quantity: Number(product.quantity) || 0,
          quantitySold: Number(product.quantitySold) || 0,
          // Garantir que datas sejam objetos Date
          purchaseDate: product.purchaseDate ? new Date(product.purchaseDate) : new Date(),
          // Processar vendas se existirem
          sales: product.sales ? product.sales.map((sale: any) => ({
            ...sale,
            date: new Date(sale.date),
            quantity: Number(sale.quantity) || 1
          })) : []
        }));

        setProducts(processedProducts);
        console.log('📊 Relatórios (Supabase) carregados com:', processedProducts.length, 'produtos');
        
        if (processedProducts.length === 0) {
          toast({
            title: "Nenhum Produto Encontrado",
            description: "Adicione produtos para visualizar os relatórios.",
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados para relatórios (Supabase):', error);
        toast({
          variant: 'destructive',
          title: "Erro ao Carregar Dados",
          description: "Não foi possível carregar os dados do banco. Verifique sua conexão.",
        });
        // Em caso de erro, manter array vazio
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Filtros de dados
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro por categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Filtro por período
    const now = new Date();
    const periodStart = (() => {
      switch (periodFilter) {
        case "week":
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month":
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          return new Date(now.getFullYear(), quarter * 3, 1);
        case "year":
          return new Date(now.getFullYear(), 0, 1);
        default:
          return new Date(now.getFullYear(), now.getMonth(), 1);
      }
    })();

    // Aplicar filtro de período apenas para produtos com vendas
    filtered = filtered.filter(p => {
      if (!p.sales || p.sales.length === 0) return true; // Incluir produtos sem vendas
      return p.sales.some(sale => new Date(sale.date) >= periodStart);
    });

    return filtered;
  }, [products, categoryFilter, periodFilter]);

  // Estatísticas gerais
  const reportStats = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalInvestment = filteredProducts.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0);
    const now = new Date();
    const periodStart = (() => {
      switch (periodFilter) {
        case "week":
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month":
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          return new Date(now.getFullYear(), quarter * 3, 1);
        case "year":
          return new Date(now.getFullYear(), 0, 1);
        default:
          return new Date(now.getFullYear(), now.getMonth(), 1);
      }
    })();
    const totalRevenue = filteredProducts.reduce((acc, p) => {
      const revenueFromSales = (p.sales || [])
        .filter(sale => new Date(sale.date) >= periodStart)
        .reduce((sum, sale) => sum + (p.sellingPrice * sale.quantity), 0);
      return acc + revenueFromSales;
    }, 0);
    const totalProfit = filteredProducts.reduce((acc, p) => {
      const profitFromSales = (p.sales || [])
        .filter(sale => new Date(sale.date) >= periodStart)
        .reduce((sum, sale) => sum + ((p.sellingPrice - p.totalCost) * sale.quantity), 0);
      return acc + profitFromSales;
    }, 0);
    const avgROI = totalProducts > 0 ? filteredProducts.reduce((acc, p) => acc + p.roi, 0) / totalProducts : 0;

    return {
      totalProducts,
      totalInvestment,
      totalRevenue,
      totalProfit,
      avgROI
    };
  }, [filteredProducts, periodFilter]);

  // Categorias únicas para o filtro
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories;
  }, [products]);

  const periodLabel = useMemo(() => {
    switch (periodFilter) {
      case "week": return "Semana";
      case "month": return "Mês";
      case "quarter": return "Trimestre";
      case "year": return "Ano";
      default: return "Mês";
    }
  }, [periodFilter]);

  // Handler functions for sidebar
  const handleExport = (format: 'pdf' | 'excel') => {
    if (!products.length) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há produtos para incluir no relatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reportData = {
        ...calculateReportStats(filteredProducts),
        period: periodLabel,
        generatedAt: new Date()
      };

      if (format === 'pdf') {
        exportReportToPDF(reportData, { includeDetails: true });
        toast({
          title: "PDF exportado com sucesso",
          description: "O relatório foi salvo em seu computador.",
        });
      } else {
        exportReportToExcel(reportData, { includeDetails: true });
        toast({
          title: "Excel exportado com sucesso", 
          description: "A planilha foi salva em seu computador.",
        });
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao gerar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/get?user_id=${user?.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      const supabaseProducts = data.products || [];
      const processedProducts = supabaseProducts.map((product: any) => ({
        ...product,
        purchasePrice: Number(product.purchasePrice) || 0,
        shippingCost: Number(product.shippingCost) || 0,
        importTaxes: Number(product.importTaxes) || 0,
        packagingCost: Number(product.packagingCost) || 0,
        marketingCost: Number(product.marketingCost) || 0,
        otherCosts: Number(product.otherCosts) || 0,
        totalCost: Number(product.totalCost) || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        expectedProfit: Number(product.expectedProfit) || 0,
        actualProfit: Number(product.actualProfit) || 0,
        profitMargin: Number(product.profitMargin) || 0,
        roi: Number(product.roi) || 0,
        quantity: Number(product.quantity) || 0,
        quantitySold: Number(product.quantitySold) || 0,
        purchaseDate: product.purchaseDate ? new Date(product.purchaseDate) : new Date(),
        sales: product.sales ? product.sales.map((sale: any) => ({
          ...sale,
          date: new Date(sale.date),
          quantity: Number(sale.quantity) || 1
        })) : []
      }));
      setProducts(processedProducts);
      toast({
        title: "Dados Atualizados",
        description: "Os relatórios foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro na Atualização",
        description: "Não foi possível atualizar os dados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ReportsSidebar
          data={filteredProducts}
          periodFilter={periodFilter}
          categoryFilter={categoryFilter}
          onPeriodFilterChange={setPeriodFilter}
          onCategoryFilterChange={setCategoryFilter}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 sm:gap-3">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Relatórios Avançados
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Análise completa dos seus produtos e desempenho
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Badge variant="secondary" className="gap-2 px-2 sm:px-3 py-1">
                <FileText className="h-4 w-4" />
                Produtos: {reportStats.totalProducts}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Investimento Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {reportStats.totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {reportStats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Lucro Realizado</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {reportStats.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                    {reportStats.avgROI.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="container mx-auto px-3 sm:px-6 pb-10 sm:pb-12">
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-10 sm:h-12 bg-transparent p-0">
            <TabsTrigger value="overview" className="text-sm sm:text-base rounded-none transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance" className="text-sm sm:text-base rounded-none transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Performance</TabsTrigger>
            <TabsTrigger value="trends" className="text-sm sm:text-base rounded-none transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Tendências</TabsTrigger>
            <TabsTrigger value="analysis" className="text-sm sm:text-base rounded-none transition-colors hover:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProfitabilityAnalysisChart data={filteredProducts} isLoading={isLoading} periodFilter={periodFilter} />
              <CategoryPerformanceChart data={filteredProducts} isLoading={isLoading} />
              <SalesVelocityChart data={filteredProducts} isLoading={isLoading} />
              <ROIComparisonChart data={filteredProducts} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <InventoryStatusChart data={filteredProducts} isLoading={isLoading} />
              <SupplierPerformanceChart data={filteredProducts} isLoading={isLoading} />
              <ProfitMarginAnalysisChart data={filteredProducts} isLoading={isLoading} />
              <SalesTrendsChart data={filteredProducts} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <SalesTrendsChart data={filteredProducts} isLoading={isLoading} />
              <CustomerSalesTimelineChart data={filteredProducts} isLoading={isLoading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CategoryPerformanceChart data={filteredProducts} isLoading={isLoading} />
                <ROIComparisonChart data={filteredProducts} isLoading={isLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProfitMarginAnalysisChart data={filteredProducts} isLoading={isLoading} />
              <SupplierPerformanceChart data={filteredProducts} isLoading={isLoading} />
              <SalesVelocityChart data={filteredProducts} isLoading={isLoading} />
              <InventoryStatusChart data={filteredProducts} isLoading={isLoading} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}
