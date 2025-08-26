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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
import { ReportsSidebar } from "@/components/reports/reports-sidebar";

// Dados iniciais (mesmos da página principal)
const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Xiaomi",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "https://via.placeholder.com/300x200?text=Smartphone",
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
    imageUrl: "https://via.placeholder.com/300x200?text=Fone",
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
    imageUrl: "https://via.placeholder.com/300x200?text=Relogio",
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

  // Carregar dados dos produtos
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados para relatórios:', user.uid);
        
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        let firebaseProducts: Product[] = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          if (userData.products && userData.products.length > 0) {
            const data = userData.products;
            firebaseProducts = data.map((p: any) => ({
              ...p,
              purchaseDate: p.purchaseDate?.toDate ? p.purchaseDate.toDate() : new Date(p.purchaseDate),
              sales: p.sales ? p.sales.map((s: any) => ({
                ...s, 
                date: s.date?.toDate ? s.date.toDate() : 
                      typeof s.date === 'string' ? new Date(s.date) : 
                      new Date(s.date)
              })) : [],
            }));
          }
        }

        let finalProducts = firebaseProducts;
        if (finalProducts.length === 0) {
          console.log('📥 Usando dados de exemplo para relatórios');
          finalProducts = initialProducts;
        }

        setProducts(finalProducts);
        console.log('📊 Relatórios carregados com:', finalProducts.length, 'produtos');

      } catch (error) {
        console.error('❌ Erro ao carregar dados para relatórios:', error);
        setProducts(initialProducts);
        toast({
          variant: 'destructive',
          title: "Erro ao Carregar Dados",
          description: "Usando dados de exemplo. Verifique sua conexão.",
        });
      }
      setIsLoading(false);
    };

    fetchData();
  }, [user, authLoading, toast]);

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
    const totalRevenue = filteredProducts.reduce((acc, p) => {
      return acc + (p.sellingPrice * p.quantitySold);
    }, 0);
    const totalProfit = filteredProducts.reduce((acc, p) => acc + p.actualProfit, 0);
    const avgROI = totalProducts > 0 ? filteredProducts.reduce((acc, p) => acc + p.roi, 0) / totalProducts : 0;

    return {
      totalProducts,
      totalInvestment,
      totalRevenue,
      totalProfit,
      avgROI
    };
  }, [filteredProducts]);

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
  const handleExport = () => {
    toast({
      title: "Exportação Iniciada",
      description: "Seu relatório está sendo gerado. Aguarde alguns segundos.",
    });
    // Add actual export logic here
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you could re-fetch data
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
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Relatórios Avançados
                </h1>
                <p className="text-muted-foreground">
                  Análise completa dos seus produtos e desempenho
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                Produtos: {reportStats.totalProducts}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Investimento Total</p>
                  <p className="text-2xl font-bold">
                    {reportStats.totalInvestment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">
                    {reportStats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lucro Realizado</p>
                  <p className="text-2xl font-bold">
                    {reportStats.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                  <p className="text-2xl font-bold">
                    {reportStats.avgROI.toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfitabilityAnalysisChart data={filteredProducts} isLoading={isLoading} />
              <CategoryPerformanceChart data={filteredProducts} isLoading={isLoading} />
              <SalesVelocityChart data={filteredProducts} isLoading={isLoading} />
              <ROIComparisonChart data={filteredProducts} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InventoryStatusChart data={filteredProducts} isLoading={isLoading} />
              <SupplierPerformanceChart data={filteredProducts} isLoading={isLoading} />
              <ProfitMarginAnalysisChart data={filteredProducts} isLoading={isLoading} />
              <SalesTrendsChart data={filteredProducts} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <SalesTrendsChart data={filteredProducts} isLoading={isLoading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryPerformanceChart data={filteredProducts} isLoading={isLoading} />
                <ROIComparisonChart data={filteredProducts} isLoading={isLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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