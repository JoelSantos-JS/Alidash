
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
import { SupplierChart } from "@/components/dashboard/supplier-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FinancialHealthIndicator } from "@/components/dashboard/financial-health-indicator";
import { CashFlowSection } from "@/components/dashboard/cash-flow-section";
import { BudgetSection } from "@/components/dashboard/budget-section";
import { StatusLegend } from "@/components/dashboard/status-legend";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AccountTypeToggle } from "@/components/ui/account-type-toggle";
import { Logo } from "@/components/ui/logo";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
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

export default function Home() {
  const { user, loading: authLoading, isPro, openUpgradeModal, logoutWithBackup, accountType, setAccountType } = useAuth();
  
  // Hook de sincronização dual
  const dualSync = useDualSync(user?.uid || '', 'BEST_EFFORT');
  
  // Memoize expensive calculations
  const memoizedAccountType = useMemo(() => accountType, [accountType]);

  // Função wrapper para trocar tipo de conta com notificação
  const handleAccountTypeChange = (type: 'personal' | 'business') => {
    setAccountType(type);
    
    // Mostrar notificação de confirmação
    toast({
      title: `Modo ${type === 'personal' ? 'Pessoal' : 'Empresarial'} ativado`,
      description: `Dashboard alterado para visualização ${type === 'personal' ? 'pessoal' : 'empresarial'}`,
      duration: 2000,
    });
  };

  // Função para scroll das tabs
  const handleTabScroll = (direction: 'left' | 'right') => {
    const tabsList = document.querySelector('.responsive-tabs');
    if (tabsList) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [selectedSalesProduct, setSelectedSalesProduct] = useState<string>("all");
  const [salesDateFilter, setSalesDateFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(400);
  const [dreams, setDreams] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
        try {
            console.log('🔄 Carregando dados reais do usuário:', user.uid);
            
            // 1. Primeiro, tentar carregar do Firebase (dados principais)
            const docRef = doc(db, "user-data", user.uid);
            const docSnap = await getDoc(docRef);

            let firebaseProducts: Product[] = [];
            let firebaseDreams: any[] = [];
            let firebaseBets: any[] = [];
            let firebaseBudget = 400;

            if (docSnap.exists()) {
                const userData = docSnap.data();
                console.log('📦 Dados encontrados no Firebase:', {
                    products: userData.products?.length || 0,
                    dreams: userData.dreams?.length || 0,
                    bets: userData.bets?.length || 0,
                    budget: userData.monthlyBudget
                });
                
                // Carregar produtos do Firebase
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
                
                firebaseDreams = userData.dreams || [];
                firebaseBets = userData.bets || [];
                firebaseBudget = userData.monthlyBudget || 400;
            }

            // 2. Tentar carregar backup do Supabase (dados de backup)
            try {
                const backupResponse = await fetch(`/api/backup/save?userId=${user.uid}`);
                if (backupResponse.ok) {
                    const backupData = await backupResponse.json();
                    console.log('📦 Dados de backup encontrados no Supabase:', backupData);
                    
                    // Se não há produtos no Firebase mas há no backup, usar o backup
                    if (firebaseProducts.length === 0 && backupData.itemCounts?.products > 0) {
                        console.log('🔄 Usando produtos do backup do Supabase');
                        // Aqui você pode implementar a restauração do backup se necessário
                    }
                }
            } catch (backupError) {
                console.log('⚠️ Erro ao verificar backup do Supabase:', backupError);
            }

            // 3. Decidir quais dados usar
            let finalProducts = firebaseProducts;
            let finalBudget = firebaseBudget;

            if (finalProducts.length === 0) {
                console.log('📥 Nenhum produto encontrado, usando dados de exemplo');
                finalProducts = initialProducts;
            } else {
                console.log('✅ Usando produtos reais do banco de dados');
            }

            // 4. Aplicar os dados
            setProducts(finalProducts);
            setMonthlyBudget(finalBudget);
            
            // Dados de exemplo para sonhos e apostas se não houver dados reais
            const exampleDreams = firebaseDreams.length > 0 ? firebaseDreams : [
              {
                id: "1",
                name: "Viagem para Europa",
                targetAmount: 14000,
                currentAmount: 3000,
                status: "in_progress"
              }
            ];
            
            const exampleBets = firebaseBets.length > 0 ? firebaseBets : [
              {
                id: "1",
                stake: 90,
                status: "won",
                earnedFreebetValue: 790
              },
              {
                id: "2", 
                stake: 50,
                status: "pending"
              },
              {
                id: "3",
                stake: 30,
                status: "pending"
              }
            ];
            
            setDreams(exampleDreams);
            setBets(exampleBets);
            
            console.log('📊 Dashboard carregado com:', {
                produtos: finalProducts.length,
                orcamento: finalBudget,
                sonhos: firebaseDreams.length,
                apostas: firebaseBets.length
            });

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            console.log('📥 Usando dados de exemplo devido ao erro');
            setProducts(initialProducts);
        }
        setIsLoading(false);
    }
    fetchData();

  }, [user, authLoading]);

  useEffect(() => {
    if(isLoading || authLoading || !user) return;
    
    const saveData = async () => {
        try {
            // Limpar dados undefined antes de salvar
            const cleanProducts = products.map(product => cleanUndefinedValues(product));
            
            console.log('💾 Salvando produtos com sincronização dual:', cleanProducts.length, 'produtos');
            console.log('📊 Produtos com vendas:', cleanProducts.filter(p => p.sales && p.sales.length > 0).map(p => ({ name: p.name, salesCount: p.sales.length })));
            
            // Usar sincronização dual para salvar produtos
            // Como não temos um método direto para salvar arrays, vamos usar o Firebase como fallback
            // e implementar sincronização individual para novos produtos
            const docRef = doc(db, "user-data", user.uid);
            await setDoc(docRef, { products: cleanProducts }, { merge: true });
            
            console.log('✅ Produtos salvos com sucesso (Firebase + preparado para Supabase)');
        } catch (error) {
            console.error("Failed to save products", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Dados",
                description: "Não foi possível salvar os produtos na nuvem. Suas alterações podem ser perdidas.",
            })
        }
    }
    
    saveData();
    
  }, [products, isLoading, user, authLoading, toast]);

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

    // Estatísticas de sonhos
    const totalDreamsValue = dreams.reduce((acc, d) => acc + (d.targetAmount || 0), 0);
    const totalDreamsSaved = dreams.reduce((acc, d) => acc + (d.currentAmount || 0), 0);
    const activeDreams = dreams.filter(d => d.status === 'in_progress').length;

    // Estatísticas de apostas
    const totalBetsStake = bets.reduce((acc, b) => acc + (b.stake || 0), 0);
    const totalBetsProfit = bets.reduce((acc, b) => {
      if (b.status === 'won') return acc + (b.earnedFreebetValue || 0);
      if (b.status === 'lost') return acc - (b.stake || 0);
      return acc;
    }, 0);
    const pendingBets = bets.filter(b => b.status === 'pending').length;

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
    const periodSales = products.flatMap(p => 
      p.sales?.filter(s => new Date(s.date) >= periodStart) || []
    );
    
    const periodRevenue = periodSales.reduce((acc, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return acc + (product?.sellingPrice || 0) * sale.quantity;
    }, 0);

    // Calcular despesas do período (investimentos feitos no período)
    const periodExpenses = products.reduce((acc, product) => {
      const purchaseDate = new Date(product.purchaseDate);
      if (purchaseDate >= periodStart) {
        return acc + (product.totalCost * product.quantity);
      }
      return acc;
    }, 0);

    // Se não há dados no período atual, usar dados dos últimos 30 dias
    let finalPeriodRevenue = periodRevenue;
    let finalPeriodExpenses = periodExpenses;
    
    if (periodRevenue === 0 && periodExpenses === 0) {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentSales = products.flatMap(p => 
        p.sales?.filter(s => new Date(s.date) >= thirtyDaysAgo) || []
      );
      
      finalPeriodRevenue = recentSales.reduce((acc, sale) => {
        const product = products.find(p => p.id === sale.productId);
        return acc + (product?.sellingPrice || 0) * sale.quantity;
      }, 0);

      finalPeriodExpenses = products.reduce((acc, product) => {
        const purchaseDate = new Date(product.purchaseDate);
        if (purchaseDate >= thirtyDaysAgo) {
          return acc + (product.totalCost * product.quantity);
        }
        return acc;
      }, 0);
    }

    const periodBalance = finalPeriodRevenue - finalPeriodExpenses;
    const expenseRatio = finalPeriodRevenue > 0 ? (finalPeriodExpenses / finalPeriodRevenue) * 100 : 0;



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
        periodRevenue: finalPeriodRevenue,
        periodExpenses: finalPeriodExpenses,
        periodBalance,
        expenseRatio,
        financialHealth,
        healthColor,
        // Dados de sonhos
        totalDreamsValue,
        totalDreamsSaved,
        activeDreams,
        // Dados de apostas
        totalBetsStake,
        totalBetsProfit,
        pendingBets
    }
  }, [products, dreams, bets, periodFilter]);

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
      
      // Usar sincronização dual para atualizar
      try {
        const result = await dualSync.updateProduct(productToEdit.id, sanitizedProductData);
        console.log(`Produto atualizado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
        
        toast({
          title: "Produto Atualizado!",
          description: `${productData.name} - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        });
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({
          title: "Produto Atualizado!",
          description: `O produto "${productData.name}" foi atualizado localmente.`,
        });
      }
    } else {
       // Adicionar novo produto
      const newProduct: Product = {
        ...sanitizedProductData,
        id: new Date().getTime().toString(),
        sales: [],
      }
      setProducts(prev => [newProduct, ...prev]);
      
      // Usar sincronização dual para criar
      try {
        const result = await dualSync.createProduct(newProduct);
        console.log(`Produto criado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
        
        toast({
          title: "Produto Adicionado!",
          description: `${productData.name} - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        });
        
        // Notificar N8N sobre o novo produto
        await notifyProductCreated(newProduct);
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({
          title: "Produto Adicionado!",
          description: `O produto "${productData.name}" foi adicionado localmente.`,
        });
      }
    }

    setIsFormOpen(false);
    setProductToEdit(null);
  }

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Remover do estado local
    setProducts(products.filter(p => p.id !== productId));
    setProductToDelete(null);
    setSelectedProduct(null);
    
    // Usar sincronização dual para deletar
    try {
      const result = await dualSync.deleteProduct(productId);
      console.log(`Produto deletado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
      
      toast({
        variant: 'destructive',
        title: "Produto Excluído!",
        description: `${product.name} - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
      });
    } catch (error) {
      console.error('Erro na sincronização dual:', error);
      toast({
        variant: 'destructive',
        title: "Produto Excluído!",
        description: `O produto "${product.name}" foi excluído localmente.`,
      });
    }
  }
  
  const handleRegisterSale = (product: Product, saleData: Omit<Sale, 'id' | 'date'>) => {
    console.log('🔄 Registrando venda:', { product: product.name, saleData });
    
    // Limpar dados undefined da venda
    const cleanSaleData = cleanUndefinedValues(saleData);
    
    const newSale: Sale = {
        ...cleanSaleData,
        id: new Date().getTime().toString(),
        date: new Date(),
    }
    
    console.log('📝 Nova venda criada:', newSale);

    const updatedProducts = products.map(p => {
        if (p.id === product.id) {
            const newQuantitySold = p.quantitySold + saleData.quantity;
            const newActualProfit = p.expectedProfit * newQuantitySold;
            const newStatus = newQuantitySold >= p.quantity ? 'sold' : p.status;
            
            // Calculate days to sell
            const salesHistory = [...(p.sales || []), newSale].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let daysToSell;
            if (newStatus === 'sold') {
                const purchaseDate = new Date(p.purchaseDate).getTime();
                const lastSaleDate = new Date(salesHistory[salesHistory.length - 1].date).getTime();
                daysToSell = Math.ceil((lastSaleDate - purchaseDate) / (1000 * 60 * 60 * 24));
            }

            return {
                ...p,
                quantitySold: newQuantitySold,
                actualProfit: newActualProfit,
                status: newStatus,
                sales: salesHistory,
                daysToSell: daysToSell ?? p.daysToSell,
            }
        }
        return p;
    });

    console.log('📊 Produtos atualizados:', updatedProducts.find(p => p.id === product.id));
    
    setProducts(updatedProducts);
    setIsSaleFormOpen(false);
    setSelectedProduct(null);
     toast({
        title: "Venda Registrada!",
        description: `${saleData.quantity} unidade(s) de "${product.name}" vendida(s).`,
    });
  }

  // Funções para o histórico de vendas
  const allSales = useMemo(() => {
    const sales: ExtendedSale[] = [];
    products.forEach((product) => {
      if (product.sales && product.sales.length > 0) {
        console.log(`📦 Produto ${product.name} tem ${product.sales.length} vendas:`, product.sales);
        product.sales.forEach((sale: Sale) => {
          sales.push({
            ...sale,
            productName: product.name,
            productId: product.id
          });
        });
      }
    });
    console.log('🛒 Total de vendas encontradas:', sales.length);
    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [products]);

  const filteredSales = useMemo(() => {
    let filtered = [...allSales];

    // Filtro por termo de busca
    if (salesSearchTerm) {
      filtered = filtered.filter(sale => 
        sale.productName?.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
        sale.buyerName?.toLowerCase().includes(salesSearchTerm.toLowerCase())
      );
    }

    // Filtro por produto
    if (selectedSalesProduct !== "all") {
      filtered = filtered.filter(sale => sale.productId === selectedSalesProduct);
    }

    // Filtro por data
    if (salesDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (salesDateFilter) {
        case "today":
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= today;
          });
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= monthAgo;
          });
          break;
      }
    }

    return filtered;
  }, [allSales, salesSearchTerm, selectedSalesProduct, salesDateFilter]);

  const salesStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((total, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return total + (product?.sellingPrice || 0) * sale.quantity;
    }, 0);

    const totalItems = filteredSales.reduce((total, sale) => total + sale.quantity, 0);
    const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return { totalRevenue, totalItems, averageTicket };
  }, [filteredSales, products]);

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
    
    // Verificar se está usando dados de exemplo
    if (products === initialProducts && products.length > 0) {
      alerts.push({
        type: 'info',
        message: 'Usando dados de exemplo. Adicione seus próprios produtos para ver dados reais.',
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
    
    if (summaryStats.periodExpenses > monthlyBudget * 0.8) {
      alerts.push({
        type: 'warning',
        message: 'Orçamento próximo do limite',
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
  }, [summaryStats, monthlyBudget, products]);

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
              <span className="text-lg sm:text-xl font-bold">Zeromize</span>
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
              onClick={() => router.push('/receitas')}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm sm:text-base">Receitas</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 sm:gap-3" 
              size="lg"
              onClick={() => router.push('/despesas')}
            >
              <ArrowDown className="h-4 w-4" />
              <span className="text-sm sm:text-base">Despesas</span>
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
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 sm:gap-3" 
              size="lg"
              onClick={() => router.push('/produtos')}
            >
              <Package className="h-4 w-4" />
              <span className="text-sm sm:text-base">Produtos</span>
            </Button>
            
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
            
            <Button variant="ghost" className="w-full justify-start gap-2 sm:gap-3" size="lg">
              <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              <span className="text-sm sm:text-base">WhatsApp</span>
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
                    Dashboard {memoizedAccountType === 'personal' ? 'Pessoal' : 'Empresarial'}
                  </h1>
                  <div className={cn(
                    "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                    memoizedAccountType === 'personal' 
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  )}>
                    {memoizedAccountType === 'personal' ? (
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
                  <span className="truncate">Visão geral das suas finanças {memoizedAccountType === 'personal' ? 'pessoal' : 'empresarial'}</span>
                  {products.length > 0 && products !== initialProducts && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Dados Reais
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
              {/* Account Type Toggle - Hidden on mobile, shown in header */}
              <div className="hidden sm:block">
                <AccountTypeToggle 
                  value={memoizedAccountType} 
                  onValueChange={handleAccountTypeChange}
                />
              </div>

              {/* Period Selector - Compact on mobile */}
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

              {/* Calendar - Hidden on mobile */}
              <div className="hidden sm:block">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setIsCalendarOpen(false);
                          toast({
                            title: "Data selecionada",
                            description: `Período atualizado para ${format(date, 'dd/MM/yyyy', { locale: ptBR })}`,
                          });
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

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
          {memoizedAccountType === 'personal' ? (
            // Dashboard Pessoal
            <>
              {/* Personal Finance Header */}
              <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold">
                          Resumo Financeiro Pessoal: {periodLabel}/{format(new Date(), 'yyyy')}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Período: {periodDateRange}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 self-start sm:self-auto">
                      Controle Pessoal
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Metrics Cards */}
              <div className="responsive-grid responsive-grid-4 mb-6 md:mb-8">
                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Ganhos do mês</h3>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 break-words">
                      {summaryStats.periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Salário + extras
                    </div>
                  </CardContent>
                </Card>

                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Gastos do mês</h3>
                      <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 break-words">
                      {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Contas + despesas
                    </div>
                  </CardContent>
                </Card>

                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Economia</h3>
                      <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                      {summaryStats.periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600">
                      {summaryStats.periodRevenue > 0 ? ((summaryStats.periodBalance / summaryStats.periodRevenue) * 100).toFixed(1) : '0.0'}% do ganho
                    </div>
                  </CardContent>
                </Card>

                <Card className="transform-gpu border-2 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Meta de Economia</h3>
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 text-purple-600">
                      R$ 1.500,00
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {summaryStats.periodBalance >= 1500 ? '✅ Meta atingida!' : `${((summaryStats.periodBalance / 1500) * 100).toFixed(1)}% da meta`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Budget Section */}
              <Card className="mb-6 sm:mb-8">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                    Orçamento Pessoal
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Controle suas despesas pessoais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="responsive-grid responsive-grid-3">
                    <div className="responsive-card bg-purple-50 dark:bg-purple-950/20">
                      <div className="responsive-number text-purple-600 mb-2">R$ 3.000,00</div>
                      <div className="text-sm text-muted-foreground font-medium">Orçamento Mensal</div>
                    </div>
                    <div className="responsive-card bg-red-50 dark:bg-red-950/20">
                      <div className="responsive-number text-red-600 mb-2">
                        {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Gastos Realizados</div>
                    </div>
                    <div className="responsive-card bg-green-50 dark:bg-green-950/20">
                      <div className="responsive-number text-green-600 mb-2">
                        {(3000 - summaryStats.periodExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Disponível</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // Dashboard Empresarial
            <>
              {/* Business Finance Header */}
              <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold">
                          Resumo Financeiro Empresarial: {periodLabel}/{format(new Date(), 'yyyy')}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Período: {periodDateRange}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 self-start sm:self-auto">
                      Saldo Positivo
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              {systemAlerts.length > 0 && (
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

              {/* Business Metrics Cards */}
              <div className="responsive-grid responsive-grid-4 mb-6 md:mb-8">
                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Receitas no período</h3>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                      {summaryStats.periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      0.0%
                    </div>
                  </CardContent>
                </Card>

                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Despesas no período</h3>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 break-words">
                      {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Pendente: R$ 0,00
                    </div>
                  </CardContent>
                </Card>

                <Card className="transform-gpu">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Saldo do período</h3>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                      {summaryStats.periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600">
                      6.2%
                    </div>
                  </CardContent>
                </Card>

                <FinancialHealthIndicator expenseRatio={summaryStats.expenseRatio} />
              </div>

              {/* Business Budget Section */}
              <BudgetSection 
                monthlyBudget={monthlyBudget}
                estimatedExpenses={summaryStats.periodExpenses}
                totalItems={products.length}
                missingItems={summaryStats.lowStockCount}
                className="mb-8"
                onBudgetChange={async (newBudget) => {
                  setMonthlyBudget(newBudget);
                  
                  // Salvar no Firestore
                  if (user) {
                    try {
                      const docRef = doc(db, "user-data", user.uid);
                      await setDoc(docRef, { monthlyBudget: newBudget }, { merge: true });
                    } catch (error) {
                      console.error('Erro ao salvar orçamento:', error);
                    }
                  }
                  
                  toast({
                    title: "Orçamento Atualizado!",
                    description: `Orçamento mensal alterado para ${newBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                  });
                }}
              />

              {/* Status Legend */}
              <StatusLegend 
                className="mb-8"
                totalItems={products.length}
                lowStockItems={summaryStats.lowStockCount}
                outOfStockItems={products.filter(p => p.status === 'sold').length}
              />

              {/* Fluxo de Caixa Section */}
              <CashFlowSection 
                className="mb-8"
                periodRevenue={summaryStats.periodRevenue}
                periodExpenses={summaryStats.periodExpenses}
                periodBalance={summaryStats.periodBalance}
                products={products}
              />
            </>
          )}

          {/* Business Dashboard Content - Only show for business mode */}
          {memoizedAccountType === 'business' ? (
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
                  <Button onClick={() => handleOpenForm()} className="gap-2 text-sm sm:text-base">
                    <PlusCircle className="h-4 w-4"/>
                    Adicionar Produto
                  </Button>
                </div>
                <ProductSearch onSearch={handleSearch} />
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-[300px] sm:h-[350px] w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 && !isLoading && (
                <div className="text-center py-8 sm:py-16">
                  <h3 className="text-lg sm:text-xl font-medium">Nenhum Produto Encontrado</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Tente um termo de busca diferente ou adicione um novo produto.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="suppliers">
              <div className="grid grid-cols-1 gap-6 mb-8">
                <SupplierChart data={products} isLoading={isLoading} isPro={isPro} onUpgradeClick={openUpgradeModal} />
              </div>
            </TabsContent>
            
            <TabsContent value="sales">
              <div className="space-y-6">
                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Buscar</label>
                    <Input
                      placeholder="Produto ou comprador..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Produto</label>
                    <Select value={selectedSalesProduct} onValueChange={setSelectedSalesProduct}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Todos os produtos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os produtos</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Período</label>
                    <Select value={salesDateFilter} onValueChange={setSalesDateFilter}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Todos os períodos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Últimos 7 dias</SelectItem>
                        <SelectItem value="month">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  <SummaryCard 
                    title="Receita Total"
                    value={salesStats.totalRevenue}
                    icon={DollarSign}
                    isCurrency
                  />
                  <SummaryCard 
                    title="Itens Vendidos"
                    value={salesStats.totalItems}
                    icon={ShoppingCart}
                  />
                  <SummaryCard 
                    title="Ticket Médio"
                    value={salesStats.averageTicket}
                    icon={TrendingUp}
                    isCurrency
                  />
                </div>

                {/* Tabela de Vendas */}
                <div className="border rounded-lg">
                  <div className="p-4 sm:p-6 border-b">
                    <h3 className="text-base sm:text-lg font-semibold">Histórico de Vendas</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {filteredSales.length} vendas encontradas
                    </p>
                  </div>
                  <div className="p-4 sm:p-6">
                    {filteredSales.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-center">Quantidade</TableHead>
                            <TableHead>Comprador</TableHead>
                            <TableHead className="text-right">Valor Unitário</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSales.map((sale) => {
                            const product = products.find(p => p.id === sale.productId);
                            const unitPrice = product?.sellingPrice || 0;
                            const totalPrice = unitPrice * sale.quantity;
                            
                            return (
                              <TableRow key={`${sale.productId}-${sale.date}-${sale.quantity}`}>
                                <TableCell>
                                  {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{sale.productName || "N/A"}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{sale.quantity}</Badge>
                                </TableCell>
                                <TableCell>
                                  {sale.buyerName || "Não informado"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <ShoppingCart className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium mb-2">Nenhuma venda encontrada</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          {allSales.length === 0 
                            ? "Você ainda não registrou nenhuma venda." 
                            : "Tente ajustar os filtros para encontrar mais vendas."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="revenue">
              <RevenueSection 
                products={products}
                periodFilter={periodFilter}
              />
            </TabsContent>
            
            <TabsContent value="expenses">
              <ExpensesSection 
                products={products}
                periodFilter={periodFilter}
              />
            </TabsContent>
            
            <TabsContent value="transactions">
              <TransactionsSection 
                products={products}
                periodFilter={periodFilter}
              />
            </TabsContent>
          </Tabs>
          ) : (
            // Personal Dashboard Content
            <div className="space-y-6 sm:space-y-8">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                    Metas Pessoais
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Suas metas financeiras pessoais</CardDescription>
                </CardHeader>
                                  <CardContent>
                    <div className="responsive-grid responsive-grid-3">
                      <div className="responsive-card bg-purple-50 dark:bg-purple-950/20">
                        <div className="responsive-number text-purple-600 mb-2">R$ 1.500,00</div>
                        <div className="text-sm text-muted-foreground font-medium">Meta de Economia</div>
                        <div className="text-sm text-green-600 mt-2 font-medium">
                          {summaryStats.periodBalance >= 1500 ? '✅ Atingida!' : `${((summaryStats.periodBalance / 1500) * 100).toFixed(1)}%`}
                        </div>
                      </div>
                      <div className="responsive-card bg-blue-50 dark:bg-blue-950/20">
                        <div className="responsive-number text-blue-600 mb-2">R$ 5.000,00</div>
                        <div className="text-sm text-muted-foreground font-medium">Meta de Investimento</div>
                        <div className="text-sm text-blue-600 mt-2 font-medium">0.0%</div>
                      </div>
                      <div className="responsive-card bg-green-50 dark:bg-green-950/20">
                        <div className="responsive-number text-green-600 mb-2">R$ 10.000,00</div>
                        <div className="text-sm text-muted-foreground font-medium">Reserva de Emergência</div>
                        <div className="text-sm text-green-600 mt-2 font-medium">0.0%</div>
                      </div>
                    </div>
                  </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Resumo Pessoal
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Visão geral das suas finanças pessoais</CardDescription>
                </CardHeader>
                                  <CardContent>
                    <div className="responsive-grid responsive-grid-2">
                      <div className="responsive-card bg-green-50 dark:bg-green-950/20">
                        <div className="responsive-number text-green-600 mb-2">
                          {summaryStats.periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Total de Ganhos</div>
                      </div>
                      <div className="responsive-card bg-red-50 dark:bg-red-950/20">
                        <div className="responsive-number text-red-600 mb-2">
                          {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Total de Gastos</div>
                      </div>
                    </div>
                  </CardContent>
              </Card>

              {/* Seção de Sonhos */}
              {dreams.length > 0 && (
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                      Meus Sonhos
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Progresso dos seus objetivos financeiros</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="responsive-grid responsive-grid-3">
                      <div className="responsive-card bg-purple-50 dark:bg-purple-950/20">
                        <div className="responsive-number text-purple-600 mb-2">
                          {summaryStats.totalDreamsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Meta Total</div>
                      </div>
                      <div className="responsive-card bg-green-50 dark:bg-green-950/20">
                        <div className="responsive-number text-green-600 mb-2">
                          {summaryStats.totalDreamsSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Já Economizado</div>
                      </div>
                      <div className="responsive-card bg-blue-50 dark:bg-blue-950/20">
                        <div className="responsive-number text-blue-600 mb-2">
                          {summaryStats.activeDreams}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Sonhos Ativos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seção de Apostas */}
              {bets.length > 0 && (
                <Card>
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                      Minhas Apostas
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Resumo das suas apostas esportivas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="responsive-grid responsive-grid-3">
                      <div className="responsive-card bg-orange-50 dark:bg-orange-950/20">
                        <div className="responsive-number text-orange-600 mb-2">
                          {summaryStats.totalBetsStake.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Total Apostado</div>
                      </div>
                      <div className="responsive-card bg-green-50 dark:bg-green-950/20">
                        <div className={cn(
                          "responsive-number mb-2",
                          summaryStats.totalBetsProfit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {summaryStats.totalBetsProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Lucro/Prejuízo</div>
                      </div>
                      <div className="responsive-card bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="responsive-number text-yellow-600 mb-2">
                          {summaryStats.pendingBets}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">Apostas Pendentes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
        
        {/* Floating Account Type Toggle for Mobile */}
        <div className="fixed bottom-4 right-4 z-30 md:hidden">
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden",
              memoizedAccountType === 'personal'
                ? "bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 shadow-purple-500/25"
                : "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-blue-500/25"
            )}
            onClick={() => handleAccountTypeChange(memoizedAccountType === 'personal' ? 'business' : 'personal')}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full" />
            
            {/* Icon */}
            <div className="relative z-10 text-white">
              {memoizedAccountType === 'personal' ? (
                <User className="h-6 w-6" />
              ) : (
                <Building className="h-6 w-6" />
              )}
            </div>
          </Button>
        </div>
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

    
