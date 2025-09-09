
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import type { Product, Sale } from "@/types";

import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductForm } from "@/components/product/product-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  DollarSign, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Target, 
  Archive,
  Clock,
  Building,
  ArrowUp,
  ArrowDown,
  Leaf,
  Settings,
  BarChart3,
  Calendar as CalendarIcon,
  Tag,
  FileText,
  Target as TargetIcon,
  User,
  LogOut,
  Menu,
  X,
  PiggyBank, 
  Wallet, 
  Info, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SaleForm } from "@/components/product/sale-form";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDualSync } from '@/lib/dual-database-sync';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FinancialHealthIndicator } from "@/components/dashboard/financial-health-indicator";
import { CashFlowSection } from "@/components/dashboard/cash-flow-section";
import { BudgetSection } from "@/components/dashboard/budget-section";
import { StatusLegend } from "@/components/dashboard/status-legend";
import { InventoryControlSection } from "@/components/dashboard/inventory-control-section";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { BusinessDashboard } from "@/components/dashboard/business-dashboard";
import { PersonalDashboardSection } from "@/components/dashboard/personal-dashboard-section";
import { AccountTypeToggle, useAccountType, type AccountType } from "@/components/ui/account-type-toggle";
import { isFeatureEnabled } from "@/config/features";
import Link from "next/link";
import { notifyProductCreated, notifyProductSold } from '@/lib/n8n-events';

interface ExtendedSale extends Sale {
  productName?: string;
  productId?: string;
}

// Função utilitária para limpar dados undefined
const cleanUndefinedValues = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }));
};

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

export default function Home() {
  const { user, loading: authLoading, isPro, openUpgradeModal, logoutWithBackup } = useAuth();
  
  // Hook para gerenciar tipo de conta (modular para futuras expansões)
  const { accountType, setAccountType, isPersonal, isBusiness } = useAccountType('business');
  
  // Detectar parâmetro mode na URL para voltar do dashboard pessoal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'business') {
      setAccountType('business');
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setAccountType]);
  
  // Debug logs para verificar estado da autenticação
  console.log('🔍 Estado da autenticação:', {
    user: !!user,
    userUid: user?.uid,
    userEmail: user?.email,
    authLoading,
    accountType
  });
  
  // Hook de sincronização dual - só criar quando user existir
  const dualSync = useMemo(() => {
    if (!user?.uid) return null;
    return useDualSync(user.uid, 'BEST_EFFORT');
  }, [user?.uid]);
  
  // Estados do componente
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [monthlyBudget, setMonthlyBudget] = useState(600);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  // Função para carregar orçamento do banco de dados
  const loadBudgetFromDatabase = async (supabaseUserId: string) => {
    try {
      const response = await fetch(`/api/budgets?user_id=${supabaseUserId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.budget) {
          setMonthlyBudget(data.budget.monthly_budget);
          console.log('✅ Orçamento carregado do banco:', data.budget.monthly_budget);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar orçamento:', error);
    }
  };

  // Função para salvar orçamento no banco de dados
  const saveBudgetToDatabase = async (newBudget: number) => {
    if (!user?.uid) return;
    
    setBudgetLoading(true);
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      const response = await fetch('/api/budgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: supabaseUserId,
          monthly_budget: newBudget
        })
      });
      
      if (response.ok) {
        setMonthlyBudget(newBudget);
        toast({
          title: "Orçamento atualizado",
          description: `Novo orçamento: ${newBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        });
        console.log('✅ Orçamento salvo no banco:', newBudget);
      } else {
        throw new Error('Erro ao salvar orçamento');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar orçamento:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao salvar orçamento",
        description: "Não foi possível salvar o orçamento. Tente novamente.",
      });
    } finally {
      setBudgetLoading(false);
    }
  };

  // Remover redirecionamento automático - dashboard pessoal será integrado

  useEffect(() => {
    console.log('🔍 useEffect executado - authLoading:', authLoading, 'user:', !!user);
    if (authLoading || !user) {
      console.log('⏳ Aguardando autenticação...');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados do Supabase para usuário:', user.uid);

        // Carregar produtos via API
        let supabaseProducts: Product[] = [];
        try {
          // Primeiro buscar o usuário no Supabase
        const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
        
        if (!userResponse.ok) {
          console.log('⚠️ Usuário não encontrado no Supabase');
          return;
        }
        
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;
        
        const response = await fetch(`/api/products/get?user_id=${supabaseUser.id}`);
          if (response.ok) {
            const data = await response.json();
            supabaseProducts = data.products || [];
            console.log('📦 Produtos encontrados:', supabaseProducts.length);
          }
        } catch (error) {
          console.log('⚠️ Erro ao carregar produtos:', error);
        }

        // Buscar usuário Supabase
        let supabaseUserId: string | null = null;
        try {
          const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            supabaseUserId = userResult.user.id;
            console.log('✅ Usuário Supabase encontrado:', supabaseUserId);
            
            // Carregar orçamento do banco de dados
            await loadBudgetFromDatabase(supabaseUserId);
          }
        } catch (error) {
          console.log('⚠️ Erro ao buscar usuário:', error);
        }

        // Carregar receitas
        let supabaseRevenues: any[] = [];
        if (supabaseUserId) {
          try {
            const revenuesResponse = await fetch(`/api/revenues/get?user_id=${supabaseUserId}`);
            if (revenuesResponse.ok) {
              const revenuesData = await revenuesResponse.json();
              supabaseRevenues = revenuesData.revenues || [];
            }
          } catch (error) {
            console.log('⚠️ Erro ao carregar receitas:', error);
          }
        }

        // Carregar despesas
        let supabaseExpenses: any[] = [];
        if (supabaseUserId) {
          try {
            const expensesResponse = await fetch(`/api/expenses/get?user_id=${supabaseUserId}`);
            if (expensesResponse.ok) {
              const expensesData = await expensesResponse.json();
              supabaseExpenses = expensesData.expenses || [];
            }
          } catch (error) {
            console.log('⚠️ Erro ao carregar despesas:', error);
          }
        }

        // Carregar vendas
        let supabaseSales: any[] = [];
        if (supabaseUserId) {
          try {
            const salesResponse = await fetch(`/api/sales/get?user_id=${supabaseUser.id}`);
            if (salesResponse.ok) {
              const salesData = await salesResponse.json();
              supabaseSales = salesData.sales || [];
            }
          } catch (error) {
            console.log('⚠️ Erro ao carregar vendas:', error);
          }
        }

        // Carregar transações
        let supabaseTransactions: any[] = [];
        if (supabaseUserId) {
          try {
            const transactionsResponse = await fetch(`/api/transactions/get?user_id=${supabaseUserId}`);
            if (transactionsResponse.ok) {
              const transactionsData = await transactionsResponse.json();
              supabaseTransactions = transactionsData.transactions || [];
            }
          } catch (error) {
            console.log('⚠️ Erro ao carregar transações:', error);
          }
        }

        // Usar dados do Supabase ou fallback para dados de exemplo
        const finalProducts = supabaseProducts.length > 0 ? supabaseProducts : initialProducts;
        
        setProducts(finalProducts);
        setRevenues(supabaseRevenues);
        setExpenses(supabaseExpenses);
        setSales(supabaseSales);
        setTransactions(supabaseTransactions);
        
        console.log('📊 Dashboard carregado:', {
          produtos: finalProducts.length,
          receitas: supabaseRevenues.length,
          despesas: supabaseExpenses.length,
          vendas: supabaseSales.length,
          transacoes: supabaseTransactions.length
        });

      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setProducts(initialProducts);
      }
      setIsLoading(false);
    }
    
    fetchData();
  }, [user, authLoading]);

  // Função para salvar dados no Firebase
  const saveDataToFirebase = async (productsToSave: Product[]) => {
    if (!user) return;
    
    try {
      const cleanProducts = productsToSave.map(product => cleanUndefinedValues(product));
      const docRef = doc(db, "user-data", user.uid);
      await setDoc(docRef, { products: cleanProducts }, { merge: true });
      console.log('✅ Produtos salvos no Firebase');
    } catch (error) {
      console.error("Erro ao salvar produtos:", error);
      toast({
        variant: 'destructive',
        title: "Erro ao Salvar",
        description: "Não foi possível salvar os dados.",
      });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const summaryStats = useMemo(() => {
    // Estatísticas de produtos
    const totalInvested = products.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0);
    const totalActualProfit = products.reduce((acc, p) => acc + p.actualProfit, 0);
    const projectedProfit = products.reduce((acc, p) => acc + (p.expectedProfit * (p.quantity - p.quantitySold)), 0);
    const productsInStock = products.reduce((acc, p) => acc + (p.quantity - p.quantitySold), 0);
    const productsSolds = products.reduce((acc, p) => acc + p.quantitySold, 0);
    const lowStockCount = products.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold').length;

    // Calcular receitas e despesas do período
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
    
    const periodRevenue = revenues
      .filter(r => new Date(r.date) >= periodStart)
      .reduce((acc, revenue) => acc + (revenue.amount || 0), 0);

    const periodExpenses = expenses
      .filter(e => new Date(e.date) >= periodStart)
      .reduce((acc, expense) => acc + (expense.amount || 0), 0);

    const periodBalance = periodRevenue - periodExpenses;
    const expenseRatio = periodRevenue > 0 ? (periodExpenses / periodRevenue) * 100 : 0;

    // Determinar saúde financeira
    let financialHealth = "Excelente";
    let healthColor = "text-green-600";
    if (expenseRatio > 80) {
      financialHealth = "Crítica";
      healthColor = "text-red-600";
    } else if (expenseRatio > 60) {
      financialHealth = "Atenção";
      healthColor = "text-yellow-600";
    } else if (expenseRatio > 40) {
      financialHealth = "Boa";
      healthColor = "text-blue-600";
    }

    return {
      totalInvested,
      totalActualProfit,
      projectedProfit,
      productsInStock,
      productsSolds,
      lowStockCount,
      periodRevenue,
      periodExpenses,
      periodBalance,
      expenseRatio,
      financialHealth,
      healthColor
    };
  }, [products, revenues, expenses, periodFilter]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleOpenForm = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsFormOpen(true);
    setSelectedProduct(null);
  };

  const handleSaveProduct = async (productData: Product) => {
    const sanitizedProductData = cleanUndefinedValues(productData);

    if(productToEdit) {
      // Editar produto existente
      const updatedProducts = products.map(p => p.id === productToEdit.id ? { ...p, ...sanitizedProductData, id: p.id } : p)
      setProducts(updatedProducts);
      await saveDataToFirebase(updatedProducts);
      
      toast({
        title: "Produto Atualizado!",
        description: `O produto "${productData.name}" foi atualizado.`,
      });
    } else {
      // Adicionar novo produto
      const newProduct: Product = {
        ...sanitizedProductData,
        id: new Date().getTime().toString(),
        sales: [],
      }
      const updatedProducts = [newProduct, ...products];
      setProducts(updatedProducts);
      await saveDataToFirebase(updatedProducts);
      
      toast({
        title: "Produto Adicionado!",
        description: `O produto "${productData.name}" foi adicionado.`,
      });
    }

    setIsFormOpen(false);
    setProductToEdit(null);
  }

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    setProductToDelete(null);
    setSelectedProduct(null);
    
    await saveDataToFirebase(updatedProducts);
    
    toast({
      variant: 'destructive',
      title: "Produto Excluído!",
      description: `O produto "${product.name}" foi excluído.`,
    });
  }
  
  const handleRegisterSale = async (product: Product, saleData: Omit<Sale, 'id' | 'date'>) => {
    const cleanSaleData = cleanUndefinedValues(saleData);
    
    const newSale: Sale = {
      ...cleanSaleData,
      id: new Date().getTime().toString(),
      date: new Date(),
    }

    const updatedProducts = products.map(p => {
      if (p.id === product.id) {
        const newQuantitySold = p.quantitySold + saleData.quantity;
        const newActualProfit = p.expectedProfit * newQuantitySold;
        const newStatus = newQuantitySold >= p.quantity ? 'sold' : p.status;
        
        return {
          ...p,
          quantitySold: newQuantitySold,
          actualProfit: newActualProfit,
          status: newStatus,
          sales: [...(p.sales || []), newSale],
        }
      }
      return p;
    });
    
    setProducts(updatedProducts);
    await saveDataToFirebase(updatedProducts);
    
    setIsSaleFormOpen(false);
    setSelectedProduct(null);
    
    toast({
      title: "Venda Registrada!",
      description: `${saleData.quantity} unidade(s) de "${product.name}" vendida(s).`,
    });
  }

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  const periodLabel = useMemo(() => {
    switch (periodFilter) {
      case "day": return "Dia";
      case "week": return "Semana";
      case "month": return "Mês";
      default: return "Mês";
    }
  }, [periodFilter]);

  const periodDateRange = useMemo(() => {
    const now = new Date();
    switch (periodFilter) {
      case "day":
        return `${format(now, 'dd/MM/yyyy', { locale: ptBR })}`;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `${format(weekAgo, 'dd/MM/yyyy', { locale: ptBR })} a ${format(now, 'dd/MM/yyyy', { locale: ptBR })}`;
      case "month":
        return `${format(now, 'dd/MM/yyyy', { locale: ptBR }).substring(3)}`;
      default:
        return `${format(now, 'dd/MM/yyyy', { locale: ptBR }).substring(3)}`;
    }
  }, [periodFilter]);

  // Alertas do sistema
  const systemAlerts = useMemo(() => {
    const alerts = [];
    
    // Verificar se está usando dados de exemplo (comparar por ID dos produtos)
    const isUsingExampleData = products.length > 0 && products.every(p => 
      initialProducts.some(ip => ip.id === p.id)
    );
    
    if (isUsingExampleData) {
      alerts.push({
        type: 'info',
        message: 'Usando dados de exemplo. Adicione seus próprios produtos.',
        icon: Info
      });
    }
    
    if (summaryStats.lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${summaryStats.lowStockCount} produto(s) com estoque baixo`,
        icon: AlertTriangle
      });
    }
    
    if (summaryStats.periodBalance < 0) {
      alerts.push({
        type: 'error',
        message: 'Saldo negativo no período',
        icon: AlertTriangle
      });
    }
    
    return alerts;
  }, [summaryStats, products]);

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out shadow-lg md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center gap-2">
                <Logo size="lg" />
                <span className="text-lg sm:text-xl font-bold">VoxCash</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 sm:p-4 space-y-2">
              <Button
                variant="default"
                className="w-full justify-start gap-2 sm:gap-3"
                size="lg"
                onClick={() => router.push('/')}
              >
                <Clock className="h-4 w-4" />
                <span className="text-sm sm:text-base">Dashboard</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/receitas' : '/receitas')}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm sm:text-base">{isPersonal ? 'Ganhos' : 'Receitas'}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/despesas' : '/despesas')}
              >
                <ArrowDown className="h-4 w-4" />
                <span className="text-sm sm:text-base">{isPersonal ? 'Gastos' : 'Despesas'}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/transacoes')}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Transações</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/dividas')}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm sm:text-base">Dívidas</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/categorias')}
              >
                <Tag className="h-4 w-4" />
                <span className="text-sm sm:text-base">Categorias</span>
              </Button>
              
              {/* Itens específicos do modo empresarial */}
              {!isPersonal && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 sm:gap-3" 
                  size="lg"
                  onClick={() => router.push('/produtos')}
                >
                  <Package className="h-4 w-4" />
                  <span className="text-sm sm:text-base">Produtos</span>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/relatorios')}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Relatórios</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/metas')}
              >
                <TargetIcon className="h-4 w-4" />
                <span className="text-sm sm:text-base">Metas</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push('/agenda')}
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm sm:text-base">Agenda</span>
              </Button>
            </nav>

            {/* User Section */}
            <div className="p-3 sm:p-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={async () => {
                  try {
                    await logoutWithBackup();
                  } catch (error) {
                    console.error('Erro ao fazer logout:', error);
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm sm:text-base">Sair</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Header */}
          <header className="bg-card border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden flex-shrink-0 h-9 w-9 p-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <h1 className="text-base sm:text-xl md:text-2xl font-bold truncate">
                       Dashboard {isPersonal ? 'Pessoal' : 'Empresarial'}
                     </h1>
                     <div className={cn(
                       "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                       isPersonal 
                         ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                         : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                     )}>
                       {isPersonal ? (
                         <>
                           <User className="h-3 w-3" />
                           <span>Pessoal</span>
                         </>
                       ) : (
                         <>
                           <Building className="h-3 w-3" />
                           <span>Empresarial</span>
                         </>
                       )}
                     </div>
                   </div>
                   <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                     <span className="truncate">{isPersonal ? 'Controle completo das suas finanças pessoais' : 'Visão geral das suas finanças empresariais'}</span>
                    {products.length > 0 && !products.every(p => initialProducts.some(ip => ip.id === p.id)) && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Dados Reais
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
                 {/* Account Type Toggle - Preparado para futuras expansões */}
                 <AccountTypeToggle 
                   currentType={accountType}
                   onTypeChange={setAccountType}
                   disabled={false} // Pode ser habilitado quando implementarmos o modo pessoal
                 />

                 {/* Period Selector */}
                 <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                   <Button
                     variant={periodFilter === "day" ? "default" : "ghost"}
                     size="sm"
                     className="text-xs px-2 sm:px-3 h-8 sm:h-9"
                     onClick={() => setPeriodFilter("day")}
                   >
                     Dia
                   </Button>
                   <Button
                     variant={periodFilter === "week" ? "default" : "ghost"}
                     size="sm"
                     className="text-xs px-2 sm:px-3 h-8 sm:h-9"
                     onClick={() => setPeriodFilter("week")}
                   >
                     Sem
                   </Button>
                   <Button
                     variant={periodFilter === "month" ? "default" : "ghost"}
                     size="sm"
                     className="text-xs px-2 sm:px-3 h-8 sm:h-9"
                     onClick={() => setPeriodFilter("month")}
                   >
                     Mês
                   </Button>
                 </div>

                 <ThemeToggle />



                {/* User Avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 hover:bg-muted/50 transition-colors flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-lg border-2 border-white/20 hover:scale-105 transition-transform">
                        {getInitials(user?.email)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Minha Conta</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/perfil?tab=settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pessoal" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard Pessoal</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await logoutWithBackup();
                        } catch (error) {
                          console.error('Erro ao fazer logout:', error);
                        }
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 will-change-scroll scroll-smooth">
            {/* Finance Header */}
            <Card className={cn(
              "mb-4 sm:mb-6 border-200",
              isPersonal 
                ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
                : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
            )}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center",
                      isPersonal ? "bg-purple-500" : "bg-blue-500"
                    )}>
                      {isPersonal ? (
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      ) : (
                        <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold">
                        {isPersonal 
                          ? `Resumo Financeiro Pessoal: ${periodLabel}/${format(new Date(), 'yyyy')}`
                          : `Resumo Financeiro Empresarial: ${periodLabel}/${format(new Date(), 'yyyy')}`
                        }
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Período: {periodDateRange}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "self-start sm:self-auto",
                      summaryStats.periodBalance >= 0 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}
                  >
                    {isPersonal 
                      ? (summaryStats.periodBalance >= 0 ? 'Economia Positiva' : 'Gastos Excessivos')
                      : (summaryStats.periodBalance >= 0 ? 'Saldo Positivo' : 'Saldo Negativo')
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Alerts - Apenas para modo empresarial */}
            {!isPersonal && systemAlerts.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="space-y-2">
                  {systemAlerts.map((alert, index) => {
                    const Icon = alert.icon;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border",
                          alert.type === 'error' 
                            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                            : alert.type === 'warning'
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                            : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                        )}
                      >
                        <Icon className={cn(
                          "h-3 w-3 sm:h-4 sm:w-4",
                          alert.type === 'error' ? "text-red-600" : 
                          alert.type === 'warning' ? "text-yellow-600" : "text-blue-600"
                        )} />
                        <span className={cn(
                          "text-xs sm:text-sm font-medium",
                          alert.type === 'error' ? "text-red-800 dark:text-red-200" : 
                          alert.type === 'warning' ? "text-yellow-800 dark:text-yellow-200" : "text-blue-800 dark:text-blue-200"
                        )}>
                          {alert.message}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metrics Cards - Apenas para modo empresarial */}
            {!isPersonal && (
              <div className="responsive-grid responsive-grid-4 mb-6 md:mb-8">
              <Card className="transform-gpu">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {isPersonal ? 'Ganhos do período' : 'Receitas no período'}
                    </h3>
                    <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                    {summaryStats.periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {summaryStats.periodRevenue > 0 ? '+' : ''}0.0%
                  </div>
                </CardContent>
              </Card>

              <Card className="transform-gpu">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {isPersonal ? 'Gastos do período' : 'Despesas no período'}
                    </h3>
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 break-words">
                    {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {summaryStats.periodExpenses > 0 ? 'Processado' : 'Sem movimentação'}
                  </div>
                </CardContent>
              </Card>

              <Card className="transform-gpu">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {isPersonal ? 'Economia do período' : 'Saldo do período'}
                    </h3>
                    {summaryStats.periodBalance >= 0 ? (
                      <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                    {summaryStats.periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className={cn(
                    "text-xs sm:text-sm",
                    summaryStats.periodBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {summaryStats.periodBalance >= 0 ? '+' : ''}{summaryStats.periodRevenue > 0 ? ((summaryStats.periodBalance / summaryStats.periodRevenue) * 100).toFixed(1) : '0.0'}%
                  </div>
                </CardContent>
              </Card>

              <FinancialHealthIndicator expenseRatio={summaryStats.expenseRatio} isPersonal={isPersonal} />
              </div>
            )}

            {/* Seções Condicionais */}
            {!isPersonal && (
              <div className="space-y-6 mb-6 md:mb-8">
                <BudgetSection 
                  className=""
                  monthlyBudget={monthlyBudget}
                  estimatedExpenses={summaryStats.periodExpenses || 0}
                  totalItems={products.length}
                  missingItems={products.filter(p => p.quantity - p.quantitySold <= 2 && p.status !== 'sold').length}
                  onBudgetChange={saveBudgetToDatabase}
                  isLoading={budgetLoading}
                />
                
                <CashFlowSection 
                   className=""
                   periodRevenue={summaryStats.periodRevenue}
                   periodExpenses={summaryStats.periodExpenses}
                   periodBalance={summaryStats.periodBalance}
                   products={products}
                   revenues={revenues}
                   expenses={expenses}
                 />
                 
                 <InventoryControlSection 
                   products={products}
                   className=""
                 />
               </div>
            )}

            {/* Dashboard Condicional */}
            {isPersonal ? (
              <PersonalDashboardSection
                user={user}
                periodFilter={periodFilter}
                isLoading={isLoading}
              />
            ) : (
              <BusinessDashboard
                products={products}
                isLoading={isLoading}
                summaryStats={summaryStats}
                filteredProducts={filteredProducts}
                periodFilter={periodFilter}
                revenues={revenues}
                expenses={expenses}
                transactions={transactions}
                isPro={isPro}
                onOpenForm={() => handleOpenForm()}
                onSearch={handleSearch}
                onProductClick={(product) => setSelectedProduct(product)}
                onEditProduct={(product) => {
                  setProductToEdit(product);
                  setIsFormOpen(true);
                }}
                onDeleteProduct={(product) => setProductToDelete(product)}
                onSellProduct={(product) => {
                  setSelectedProduct(product);
                  setIsSaleFormOpen(true);
                }}
                onUpgradeClick={openUpgradeModal}
              />
            )}
          </main>
        </div>
      </div>

      <Dialog
        open={!!selectedProduct || isFormOpen || isSaleFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedProduct(null);
            setIsFormOpen(false);
            setProductToEdit(null);
            setIsSaleFormOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0 max-h-[95vh] overflow-hidden">
          {isFormOpen ? (
            <ProductForm 
              onSave={handleSaveProduct}
              productToEdit={productToEdit}
              onCancel={() => {
                setIsFormOpen(false)
                setProductToEdit(null)
              }}
            />
          ) : isSaleFormOpen && selectedProduct ? (
             <div className="p-6">
               <SaleForm
                  product={selectedProduct}
                  onSave={(saleData) => handleRegisterSale(selectedProduct, saleData)}
                  onCancel={() => {
                      setIsSaleFormOpen(false)
                      setSelectedProduct(null)
                  }}
               />
             </div>
          ) : selectedProduct ? (
            <ProductDetailView 
              product={selectedProduct} 
              onEdit={() => handleOpenForm(selectedProduct)}
              onDelete={() => setProductToDelete(selectedProduct)}
              onRegisterSale={() => setIsSaleFormOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/>
                Você tem certeza absoluta?
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto <strong className="text-foreground">"{productToDelete?.name}"</strong> de seus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}>
              Sim, excluir produto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
