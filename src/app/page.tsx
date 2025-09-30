
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import type { Product, Sale } from "@/types";

import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductEditMenu } from "@/components/product/product-edit-menu";
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
import { initialProducts } from '@/data/initial-products';

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



export default function Home() {
  const { user, loading: authLoading, logoutWithBackup } = useAuth();
  
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
  
  // Debug logs para verificar estado da autenticação (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Estado da autenticação:', {
      user: !!user,
      userUid: user?.uid,
      userEmail: user?.email,
      authLoading,
      accountType
    });
  }
  
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
  const [showEditMenu, setShowEditMenu] = useState(true); // true = menu de edição, false = detalhes completos
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Função para carregar dados iniciais apenas para usuários novos
  const loadInitialDataForNewUser = async () => {
    if (!user) return;
    
    try {
      // Verificar se o usuário já tem produtos
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;
        
        // Verificar se já tem produtos
        const productsResponse = await fetch(`/api/products/list?user_id=${supabaseUser.id}`);
        if (productsResponse.ok) {
          const productsResult = await productsResponse.json();
          
          // Se não tem produtos, é um usuário novo - carregar dados de exemplo
          if (productsResult.products.length === 0) {
            setProducts(initialProducts);
            toast({
              title: "Bem-vindo!",
              description: "Carregamos alguns produtos de exemplo para você começar.",
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar usuário novo:', error);
    }
  };

  // Função para carregar dados de exemplo manualmente
  const handleLoadExampleData = () => {
    setProducts(initialProducts);
    toast({
      title: "Dados de exemplo carregados!",
      description: "Agora você pode explorar as funcionalidades do sistema.",
    });
  };

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
    if (authLoading || !user) {
      return;
    }

    const fetchData = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Carregando dados do Supabase para usuário:', user.uid);
        }

        // Primeiro buscar o usuário no Supabase
        const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
        
        if (!userResponse.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ Usuário não encontrado no Supabase');
          }
          setProducts([]);
          setIsLoading(false);
          return;
        }
        
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;
        const supabaseUserId = supabaseUser.id;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Usuário Supabase encontrado:', supabaseUserId);
        }

        // Carregar orçamento do banco de dados
        await loadBudgetFromDatabase(supabaseUserId);

        // Fazer todas as chamadas de API em paralelo para melhor performance
        const [
          productsResult,
          revenuesResult,
          expensesResult,
          salesResult,
          transactionsResult
        ] = await Promise.allSettled([
          fetch(`/api/products/get?user_id=${supabaseUserId}`).then(res => res.ok ? res.json() : { products: [] }),
          fetch(`/api/revenues/get?user_id=${supabaseUserId}`).then(res => res.ok ? res.json() : { revenues: [] }),
          fetch(`/api/expenses/get?user_id=${supabaseUserId}`).then(res => res.ok ? res.json() : { expenses: [] }),
          fetch(`/api/sales/get?user_id=${supabaseUserId}`).then(res => res.ok ? res.json() : { sales: [] }),
          fetch(`/api/transactions/get?user_id=${supabaseUserId}`).then(res => res.ok ? res.json() : { transactions: [] })
        ]);

        // Extrair dados dos resultados
        const supabaseProducts = productsResult.status === 'fulfilled' ? (productsResult.value.products || []) : [];
        const supabaseRevenues = revenuesResult.status === 'fulfilled' ? (revenuesResult.value.revenues || []) : [];
        const supabaseExpenses = expensesResult.status === 'fulfilled' ? (expensesResult.value.expenses || []) : [];
        const supabaseSales = salesResult.status === 'fulfilled' ? (salesResult.value.sales || []) : [];
        const supabaseTransactions = transactionsResult.status === 'fulfilled' ? (transactionsResult.value.transactions || []) : [];

        // Log de erros se houver (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          if (productsResult.status === 'rejected') console.log('⚠️ Erro ao carregar produtos:', productsResult.reason);
          if (revenuesResult.status === 'rejected') console.log('⚠️ Erro ao carregar receitas:', revenuesResult.reason);
          if (expensesResult.status === 'rejected') console.log('⚠️ Erro ao carregar despesas:', expensesResult.reason);
          if (salesResult.status === 'rejected') console.log('⚠️ Erro ao carregar vendas:', salesResult.reason);
          if (transactionsResult.status === 'rejected') console.log('⚠️ Erro ao carregar transações:', transactionsResult.reason);
        }

        // Usar apenas dados do Supabase (sem fallback para dados de exemplo)
        const finalProducts = supabaseProducts;
        
        setProducts(finalProducts);
        setRevenues(supabaseRevenues);
        setExpenses(supabaseExpenses);
        setSales(supabaseSales);
        setTransactions(supabaseTransactions);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Dashboard carregado:', {
            produtos: finalProducts.length,
            receitas: supabaseRevenues.length,
            despesas: supabaseExpenses.length,
            vendas: supabaseSales.length,
            transacoes: supabaseTransactions.length
          });
        }

      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setProducts([]);
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
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Produtos salvos no Firebase');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao salvar produtos:", error);
      }
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

    try {
      // Primeiro buscar o usuário no Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;

        if(productToEdit) {
          // Editar produto existente
          const updatedProduct = { ...productToEdit, ...sanitizedProductData, id: productToEdit.id };
          
          // Atualizar usando a API de sincronização dual
          const updateResponse = await fetch(`/api/products/update?user_id=${supabaseUser.id}&product_id=${productToEdit.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProduct)
          });
          
          if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log('✅ Produto atualizado:', result);
            
            // Só atualizar estado local se a operação foi bem-sucedida
            if (result.success) {
              const updatedProducts = products.map(p => p.id === productToEdit.id ? updatedProduct : p);
              setProducts(updatedProducts);
              
              toast({
                title: "Produto Atualizado!",
                description: `O produto "${productData.name}" foi atualizado com sucesso.`,
              });
            } else {
              throw new Error(result.errors?.join(', ') || 'Erro desconhecido');
            }
          } else {
            const errorResult = await updateResponse.json();
            throw new Error(errorResult.error || 'Erro ao atualizar produto');
          }
        } else {
          // Adicionar novo produto
          const newProduct: Product = {
            ...sanitizedProductData,
            id: new Date().getTime().toString(),
            sales: [],
          }
          
          // Criar usando a API de sincronização dual
          const createResponse = await fetch(`/api/products/create?user_id=${supabaseUser.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newProduct)
          });
          
          if (createResponse.ok) {
            const result = await createResponse.json();
            console.log('✅ Produto criado:', result);
            
            // Só atualizar estado local se a operação foi bem-sucedida
            if (result.success) {
              const updatedProducts = [newProduct, ...products];
              setProducts(updatedProducts);
              
              toast({
                title: "Produto Adicionado!",
                description: `O produto "${productData.name}" foi adicionado com sucesso.`,
              });
            } else {
              throw new Error(result.errors?.join(', ') || 'Erro desconhecido');
            }
          } else {
            const errorResult = await createResponse.json();
            throw new Error(errorResult.error || 'Erro ao criar produto');
          }
        }
      } else {
        throw new Error('Erro ao buscar dados do usuário');
      }

      setIsFormOpen(false);
      setProductToEdit(null);
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao Salvar",
        description: `Não foi possível salvar o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || isDeleting) return;

    setIsDeleting(true);
    
    // Feedback visual imediato - atualizar UI otimisticamente
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    setProductToDelete(null);
    setSelectedProduct(null);

    try {
      // Buscar usuário e deletar produto em paralelo (otimização)
      const [userResponse] = await Promise.all([
        fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`)
      ]);
      
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;
        
        // Deletar usando a API de sincronização dual
        const deleteResponse = await fetch(`/api/products/delete?user_id=${supabaseUser.id}&product_id=${productId}`, {
          method: 'DELETE',
        });
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          console.log('✅ Produto deletado:', result);
          
          // Verificar se ambos os bancos funcionaram ou se não há erros críticos
          const hasErrors = result.errors && result.errors.length > 0;
          const bothSucceeded = result.firebaseSuccess && result.supabaseSuccess;
          const atLeastOneSucceeded = result.firebaseSuccess || result.supabaseSuccess;
          
          if (bothSucceeded) {
            // Sucesso completo
            toast({
              title: "Produto Excluído!",
              description: `O produto "${product.name}" foi excluído com sucesso.`,
            });
          } else if (atLeastOneSucceeded && !hasErrors) {
            // Sucesso parcial mas sem erros críticos
            toast({
              title: "Produto Excluído!",
              description: `O produto "${product.name}" foi excluído com sucesso.`,
            });
          } else {
            // Falha ou erros críticos - reverter mudança otimística
            setProducts(products);
            const errorMessage = hasErrors ? result.errors.join(', ') : 'Erro desconhecido na sincronização';
            throw new Error(errorMessage);
          }
        } else {
          // Reverter mudança otimística se falhou
          setProducts(products);
          const errorResult = await deleteResponse.json();
          throw new Error(errorResult.error || 'Erro ao deletar produto');
        }
      } else {
        // Reverter mudança otimística se falhou
        setProducts(products);
        throw new Error('Erro ao buscar dados do usuário');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir produto:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao Excluir",
        description: `Não foi possível excluir o produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }
  
  const handleRegisterSale = async (product: Product, saleData: Omit<Sale, 'id' | 'date'>) => {
    const cleanSaleData = cleanUndefinedValues(saleData);
    
    try {
      // Primeiro buscar o usuário no Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      
      if (userResponse.ok) {
        const userResult = await userResponse.json();
        const supabaseUser = userResult.user;
        
        const newSale: Sale = {
          ...cleanSaleData,
          id: new Date().getTime().toString(),
          date: new Date(),
        }

        // Calcular dados atualizados do produto
        const newQuantitySold = product.quantitySold + saleData.quantity;
        const newActualProfit = product.expectedProfit * newQuantitySold;
        const newStatus = newQuantitySold >= product.quantity ? 'sold' : product.status;
        
        const updatedProduct = {
          ...product,
          quantitySold: newQuantitySold,
          actualProfit: newActualProfit,
          status: newStatus,
          sales: [...(product.sales || []), newSale],
        };

        // Atualizar produto no Supabase usando a API de sincronização dual
        const updateResponse = await fetch(`/api/products/update?user_id=${supabaseUser.id}&product_id=${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProduct)
        });
        
        if (updateResponse.ok) {
          const result = await updateResponse.json();
          console.log('✅ Venda registrada:', result);
          
          // Só atualizar estado local se a operação foi bem-sucedida
          if (result.success) {
            const updatedProducts = products.map(p => p.id === product.id ? updatedProduct : p);
            setProducts(updatedProducts);
            
            setIsSaleFormOpen(false);
            setSelectedProduct(null);
            
            toast({
              title: "Venda Registrada!",
              description: `${saleData.quantity} unidade(s) de "${product.name}" vendida(s) com sucesso.`,
            });
          } else {
            throw new Error(result.errors?.join(', ') || 'Erro desconhecido');
          }
        } else {
          const errorResult = await updateResponse.json();
          throw new Error(errorResult.error || 'Erro ao registrar venda');
        }
      } else {
        throw new Error('Erro ao buscar dados do usuário');
      }
    } catch (error) {
      console.error('❌ Erro ao registrar venda:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao Registrar Venda",
        description: `Não foi possível registrar a venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      });
    }
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
                onClick={() => router.push(isPersonal ? '/pessoal/transacoes' : '/transacoes')}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Transações</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/dividas' : '/dividas')}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm sm:text-base">Dívidas</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/categorias' : '/categorias')}
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
                onClick={() => router.push(isPersonal ? '/pessoal/relatorios' : '/relatorios')}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm sm:text-base">Relatórios</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/metas' : '/metas')}
              >
                <TargetIcon className="h-4 w-4" />
                <span className="text-sm sm:text-base">Metas</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 sm:gap-3" 
                size="lg"
                onClick={() => router.push(isPersonal ? '/pessoal/agenda' : '/agenda')}
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
                onOpenForm={() => handleOpenForm()}
                onSearch={handleSearch}
                onProductClick={(product) => {
                  setSelectedProduct(product);
                  setShowEditMenu(true); // Sempre mostrar menu de edição primeiro
                }}
                onEditProduct={(product) => {
                  setProductToEdit(product);
                  setIsFormOpen(true);
                }}
                onDeleteProduct={(product) => setProductToDelete(product)}
                onSellProduct={(product) => {
                  setSelectedProduct(product);
                  setIsSaleFormOpen(true);
                }}

                onLoadExampleData={handleLoadExampleData}
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
            setShowEditMenu(true);
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
          ) : selectedProduct && showEditMenu ? (
            <ProductEditMenu 
              product={selectedProduct} 
              onEdit={() => {
                setProductToEdit(selectedProduct);
                setIsFormOpen(true);
              }}
              onDelete={() => setProductToDelete(selectedProduct)}
              onRegisterSale={() => setIsSaleFormOpen(true)}
              onViewDetails={() => setShowEditMenu(false)}
            />
          ) : selectedProduct ? (
            <ProductDetailView 
              product={selectedProduct} 
              onEdit={() => {
                setProductToEdit(selectedProduct);
                setIsFormOpen(true);
              }}
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
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir produto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
