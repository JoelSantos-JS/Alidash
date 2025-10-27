"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { useDualSync } from '@/lib/dual-database-sync';
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DebtCard } from "@/components/debt/debt-card";
import { DebtForm } from "@/components/debt/debt-form";
import { 
  PlusCircle, 
  Search, 
  Filter,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  CreditCard
} from "lucide-react";
import type { Debt, DebtPayment } from "@/types";

// Dados de exemplo
const initialDebts: Debt[] = [
  {
    id: "1",
    creditorName: "Banco do Brasil",
    description: "Cartão de crédito - fatura dezembro",
    originalAmount: 2500,
    currentAmount: 2650,
    interestRate: 12.5,
    dueDate: new Date(2024, 11, 25),
    createdDate: new Date(2024, 10, 25),
    category: "credit_card",
    priority: "high",
    status: "pending",
    paymentMethod: "pix",
    notes: "Fatura com compras do mês de dezembro",
    tags: ["cartão", "banco"]
  },
  {
    id: "2",
    creditorName: "Financeira Itaú",
    description: "Empréstimo pessoal",
    originalAmount: 15000,
    currentAmount: 12800,
    interestRate: 3.2,
    dueDate: new Date(2025, 0, 15),
    createdDate: new Date(2024, 5, 15),
    category: "loan",
    priority: "medium",
    status: "pending",
    installments: {
      total: 24,
      paid: 8,
      amount: 750
    },
    payments: [
      {
        id: "p1",
        debtId: "2",
        date: new Date(2024, 11, 15),
        amount: 750,
        paymentMethod: "bank_transfer",
        notes: "Parcela 8/24"
      }
    ],
    notes: "Empréstimo para capital de giro",
    tags: ["empréstimo", "itaú"]
  },
  {
    id: "3",
    creditorName: "AliExpress Supplier",
    description: "Fornecedor - produtos eletrônicos",
    originalAmount: 3200,
    currentAmount: 3200,
    dueDate: new Date(2024, 11, 20),
    createdDate: new Date(2024, 11, 5),
    category: "supplier",
    priority: "urgent",
    status: "overdue",
    paymentMethod: "bank_transfer",
    notes: "Pagamento de produtos importados",
    tags: ["fornecedor", "importação"]
  },
  {
    id: "4",
    creditorName: "João Silva",
    description: "Empréstimo pessoal",
    originalAmount: 1000,
    currentAmount: 1000,
    dueDate: new Date(2024, 11, 30),
    createdDate: new Date(2024, 11, 1),
    category: "personal",
    priority: "low",
    status: "paid",
    paymentMethod: "pix",
    payments: [
      {
        id: "p2",
        debtId: "4",
        date: new Date(2024, 11, 18),
        amount: 1000,
        paymentMethod: "pix",
        notes: "Pagamento integral"
      }
    ],
    notes: "Empréstimo de emergência",
    tags: ["pessoal", "emergência"]
  }
];

export default function DebtsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // User ID is now directly available from Supabase user object
  
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  
  // Hook de sincronização dual
  const dualSync = useDualSync(user?.id || '', 'BEST_EFFORT');

  // Carregar dados do Supabase via API
  useEffect(() => {
    const loadDebts = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔄 Carregando dívidas via API para usuário:', user.id);
        
        const supabaseUserId = user.id;
        if (!supabaseUserId) {
          console.log('⚠️ Não foi possível obter o ID do usuário no Supabase');
          setDebts(initialDebts);
          return;
        }
        
        const response = await fetch(`/api/debts/get?user_id=${supabaseUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.debts) {
            console.log('✅ Dívidas carregadas do Supabase:', data.debts.length);
            setDebts(data.debts);
          } else {
            console.log('📥 Nenhuma dívida encontrada no Supabase, usando dados de exemplo');
            setDebts(initialDebts);
          }
        } else {
          console.log('⚠️ Erro na resposta da API de dívidas:', response.status);
          setDebts(initialDebts);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dívidas via API:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as dívidas do Supabase.",
          variant: "destructive",
        });
        // Em caso de erro, usar dados de exemplo
        setDebts(initialDebts);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadDebts();
    }
  }, [user, authLoading, toast]);



  // Filtrar e ordenar dívidas
  const filteredDebts = useMemo(() => {
    let filtered = debts.filter(debt => {
      const matchesSearch = debt.creditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           debt.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || debt.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || debt.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || debt.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return a.dueDate.getTime() - b.dueDate.getTime();
        case "amount":
          return b.currentAmount - a.currentAmount;
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "creditor":
          return a.creditorName.localeCompare(b.creditorName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [debts, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalDebts = debts.length;
    const activeDebts = debts.filter(debt => debt.status !== 'paid' && debt.status !== 'cancelled').length;
    
    const totalAmount = debts.reduce((sum, debt) => {
      if (debt.status !== 'paid' && debt.status !== 'cancelled') {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }
      return sum;
    }, 0);
    
    const averageAmount = activeDebts > 0 ? totalAmount / activeDebts : 0;
    
    const overdueDebts = debts.filter(debt => 
      isPast(debt.dueDate) && debt.status !== 'paid' && debt.status !== 'cancelled'
    ).length;
    
    const overdueAmount = debts.reduce((sum, debt) => {
      if (isPast(debt.dueDate) && debt.status !== 'paid' && debt.status !== 'cancelled') {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }
      return sum;
    }, 0);
    
    const dueSoonDebts = debts.filter(debt => {
      const daysUntilDue = differenceInDays(debt.dueDate, new Date());
      return daysUntilDue <= 7 && daysUntilDue >= 0 && debt.status !== 'paid' && debt.status !== 'cancelled';
    }).length;
    
    const dueSoonAmount = debts.reduce((sum, debt) => {
      const daysUntilDue = differenceInDays(debt.dueDate, new Date());
      if (daysUntilDue <= 7 && daysUntilDue >= 0 && debt.status !== 'paid' && debt.status !== 'cancelled') {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }
      return sum;
    }, 0);
    
    const paidDebts = debts.filter(debt => debt.status === 'paid').length;
    
    const paidAmount = debts.reduce((sum, debt) => {
      if (debt.status === 'paid') {
        return sum + debt.currentAmount;
      }
      return sum;
    }, 0);

    // Breakdown por categoria
    const categoryBreakdown = debts.reduce((acc, debt) => {
      const category = debt.category;
      const amount = debt.status !== 'paid' && debt.status !== 'cancelled' 
        ? debt.currentAmount - (debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
        : 0;
      
      if (!acc[category]) {
        acc[category] = { count: 0, amount: 0 };
      }
      acc[category].count++;
      acc[category].amount += amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Breakdown por prioridade
    const priorityBreakdown = debts.reduce((acc, debt) => {
      const priority = debt.priority;
      const amount = debt.status !== 'paid' && debt.status !== 'cancelled' 
        ? debt.currentAmount - (debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
        : 0;
      
      if (!acc[priority]) {
        acc[priority] = { count: 0, amount: 0 };
      }
      acc[priority].count++;
      acc[priority].amount += amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Breakdown por status
    const statusBreakdown = debts.reduce((acc, debt) => {
      const status = debt.status;
      const amount = debt.currentAmount;
      
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalDebts,
      activeDebts,
      totalAmount,
      averageAmount,
      overdueDebts,
      overdueAmount,
      dueSoonDebts,
      dueSoonAmount,
      paidDebts,
      paidAmount,
      categoryBreakdown,
      priorityBreakdown,
      statusBreakdown
    };
  }, [debts]);

  // Handlers
  const handleCreateDebt = async (debtData: Omit<Debt, 'id' | 'createdDate' | 'payments'>) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🆕 Criando dívida via API...');
      
      const response = await fetch('/api/debts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          debt: debtData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Dívida criada com sucesso:', result.debt);
        
        // Adicionar a nova dívida ao estado local
        const newDebt: Debt = {
          ...result.debt,
          payments: []
        };
        
        setDebts(prevDebts => [...prevDebts, newDebt]);
        
        toast({
          title: "Dívida Criada!",
          description: `${debtData.creditorName} foi adicionada com sucesso.`,
        });
      } else {
        console.error('❌ Erro na resposta da API:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao criar dívida.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao criar dívida:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      });
    }
    
    setIsFormOpen(false);
  };

  const handleEditDebt = async (debtData: Omit<Debt, 'id' | 'createdDate' | 'payments'>) => {
    if (!selectedDebt || !user?.id) {
      toast({
        title: "Erro",
        description: "Dívida não selecionada ou usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📝 Atualizando dívida via API...');
      
      const response = await fetch('/api/debts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          debt_id: selectedDebt.id,
          debt: debtData
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Dívida atualizada com sucesso:', result.debt);
        
        // Atualizar a dívida no estado local
        const updatedDebts = debts.map(debt => 
          debt.id === selectedDebt.id 
            ? { ...result.debt, payments: debt.payments || [] }
            : debt
        );
        
        setDebts(updatedDebts);
        
        toast({
          title: "Dívida Atualizada!",
          description: `${debtData.creditorName} foi atualizada com sucesso.`,
        });
      } else {
        console.error('❌ Erro na resposta da API:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao atualizar dívida.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dívida:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      });
    }
    
    setSelectedDebt(null);
    setIsFormOpen(false);
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete || !user?.id) {
      toast({
        title: "Erro",
        description: "Dívida não selecionada ou usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🗑️ Deletando dívida via API...');
      
      const response = await fetch(`/api/debts/delete?id=${debtToDelete.id}&user_id=${user.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Dívida deletada com sucesso');
        
        // Recarregar a lista completa do banco de dados
        console.log('🔄 Recarregando lista de dívidas...');
        const refreshResponse = await fetch(`/api/debts/get?user_id=${user.id}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData.success && refreshData.debts) {
            setDebts(refreshData.debts);
            console.log('✅ Lista atualizada com', refreshData.debts.length, 'dívidas');
          } else {
            // Se não há dívidas, limpar a lista
            setDebts([]);
            console.log('✅ Lista limpa - nenhuma dívida encontrada');
          }
        }
        
        toast({
          title: "Dívida Removida!",
          description: `${debtToDelete.creditorName} foi removida com sucesso.`,
        });
      } else {
        console.error('❌ Erro na resposta da API:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao deletar dívida.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao deletar dívida:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      });
    }
    
    setDebtToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handlePayment = async (debt: Debt) => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('💳 Marcando dívida como paga via API...');
      
      // Criar uma versão atualizada da dívida
      const updatedDebtData = {
        ...debt,
        status: 'paid' as const,
        payments: [
          ...(debt.payments || []),
          {
            id: Date.now().toString(),
            debtId: debt.id,
            date: new Date(),
            amount: debt.currentAmount,
            paymentMethod: debt.paymentMethod || 'pix',
            notes: 'Pagamento registrado via botão Pagar'
          }
        ]
      };
      
      const response = await fetch('/api/debts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          debt_id: debt.id,
          debt: {
            creditorName: updatedDebtData.creditorName,
            description: updatedDebtData.description,
            originalAmount: updatedDebtData.originalAmount,
            currentAmount: updatedDebtData.currentAmount,
            interestRate: updatedDebtData.interestRate,
            dueDate: updatedDebtData.dueDate,
            category: updatedDebtData.category,
            priority: updatedDebtData.priority,
            status: updatedDebtData.status,
            paymentMethod: updatedDebtData.paymentMethod,
            installments: updatedDebtData.installments,
            payments: updatedDebtData.payments,
            notes: updatedDebtData.notes,
            tags: updatedDebtData.tags
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Dívida marcada como paga com sucesso');
        
        // Atualizar a dívida no estado local
        const updatedDebts = debts.map(d => 
          d.id === debt.id 
            ? { ...result.debt, payments: updatedDebtData.payments }
            : d
        );
        
        setDebts(updatedDebts);
        
        toast({
          title: "Pagamento Registrado!",
          description: `Dívida de ${debt.creditorName} foi marcada como paga.`,
        });
      } else {
        console.error('❌ Erro na resposta da API:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao registrar pagamento.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao registrar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/')}
            className="gap-2 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dívidas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie suas dívidas e compromissos financeiros</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2 w-full sm:w-auto">
          <PlusCircle className="h-4 w-4" />
          Nova Dívida
        </Button>
      </div>

      {/* Dashboard com Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Estatísticas Melhoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{stats.totalDebts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeDebts} ativas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold break-words">
                  {stats.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground break-words">
                  {stats.averageAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} média
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.overdueDebts}</div>
                <p className="text-xs text-muted-foreground break-words">
                  {stats.overdueAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium">Vencem em 7 dias</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.dueSoonDebts}</div>
                <p className="text-xs text-muted-foreground break-words">
                  {stats.dueSoonAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-medium">Pagas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.paidDebts}</div>
                <p className="text-xs text-muted-foreground break-words">
                  {stats.paidAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dívidas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-xs text-muted-foreground">{data.count} dívidas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Vencimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredDebts
                    .filter(debt => debt.status === 'pending' && !isPast(debt.dueDate))
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                    .slice(0, 5)
                    .map((debt) => (
                      <div key={debt.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <div className="font-medium text-sm">{debt.creditorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(debt.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {debt.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {differenceInDays(debt.dueDate, new Date())} dias
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.priorityBreakdown).map(([priority, data]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          priority === 'urgent' ? 'destructive' :
                          priority === 'high' ? 'default' :
                          priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {priority === 'urgent' ? 'Urgente' :
                           priority === 'high' ? 'Alta' :
                           priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-xs text-muted-foreground">{data.count} dívidas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status das Dívidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.statusBreakdown).map(([status, data]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          status === 'paid' ? 'default' :
                          status === 'overdue' ? 'destructive' :
                          status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {status === 'paid' ? 'Paga' :
                           status === 'overdue' ? 'Vencida' :
                           status === 'pending' ? 'Pendente' :
                           status === 'negotiating' ? 'Negociando' : 'Cancelada'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {data.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-xs text-muted-foreground">{data.count} dívidas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline de Vencimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDebts
                  .filter(debt => debt.status === 'pending')
                  .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                  .map((debt) => (
                    <div key={debt.id} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{debt.creditorName}</div>
                        <div className="text-sm text-muted-foreground">{debt.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {debt.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(debt.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por credor, descrição ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros em Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="loan">Empréstimo</SelectItem>
                  <SelectItem value="financing">Financiamento</SelectItem>
                  <SelectItem value="supplier">Fornecedor</SelectItem>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Data de Vencimento</SelectItem>
                  <SelectItem value="amount">Valor</SelectItem>
                  <SelectItem value="priority">Prioridade</SelectItem>
                  <SelectItem value="creditor">Credor</SelectItem>
                  <SelectItem value="createdDate">Data de Criação</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setPriorityFilter('all');
                  setSortBy('dueDate');
                }}
                className="gap-2 col-span-1 sm:col-span-2 lg:col-span-1"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar Filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            </div>

            {/* Resumo dos Filtros */}
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: "{searchTerm}"
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary">
                    Status: {statusFilter === 'pending' ? 'Pendente' :
                           statusFilter === 'overdue' ? 'Vencida' :
                           statusFilter === 'paid' ? 'Paga' :
                           statusFilter === 'negotiating' ? 'Negociando' : 'Cancelada'}
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary">
                    Categoria: {categoryFilter === 'credit_card' ? 'Cartão de Crédito' :
                              categoryFilter === 'loan' ? 'Empréstimo' :
                              categoryFilter === 'financing' ? 'Financiamento' :
                              categoryFilter === 'supplier' ? 'Fornecedor' :
                              categoryFilter === 'personal' ? 'Pessoal' : 'Outros'}
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary">
                    Prioridade: {priorityFilter === 'urgent' ? 'Urgente' :
                               priorityFilter === 'high' ? 'Alta' :
                               priorityFilter === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Dívidas */}
      <div className="space-y-4">
        {/* Resumo dos Resultados */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {filteredDebts.length} de {debts.length} dívidas
            </span>
            {filteredDebts.length !== debts.length && (
              <Badge variant="outline" className="text-xs">
                Filtrado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Dívida
            </Button>
          </div>
        </div>

        {filteredDebts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onEdit={(debt) => {
                  setSelectedDebt(debt);
                  setIsFormOpen(true);
                }}
                onDelete={(debt) => {
                  setDebtToDelete(debt);
                  setIsDeleteDialogOpen(true);
                }}
                onPayment={handlePayment}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12 sm:py-16 px-4">
              <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-medium mb-2">Nenhuma dívida encontrada</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Você não possui dívidas cadastradas."}
              </p>
              {!searchTerm && statusFilter === "all" && categoryFilter === "all" && priorityFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Primeira Dívida
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-full sm:max-w-3xl lg:max-w-5xl max-h-[95vh] overflow-hidden p-0 m-2 sm:m-6">
          <DialogTitle className="sr-only">
            {selectedDebt ? "Editar Dívida" : "Nova Dívida"}
          </DialogTitle>
          <div className="max-h-[95vh] overflow-y-auto">
            <DebtForm
              debt={selectedDebt || undefined}
              onSubmit={selectedDebt ? handleEditDebt : handleCreateDebt}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedDebt(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a dívida de "{debtToDelete?.creditorName}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}