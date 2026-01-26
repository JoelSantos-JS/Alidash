"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  DollarSign,
  CreditCard,
  Home,
  Car,
  GraduationCap,
  ShoppingBag,
  Wallet,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import PersonalDebtForm from "@/components/forms/personal-debt-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

interface PersonalDebt {
  id: string;
  name: string;
  description?: string;
  total_amount: number;
  remaining_amount: number;
  paid_amount: number;
  interest_rate?: number;
  monthly_payment: number;
  due_date: string;
  start_date: string;
  category: string;
  creditor: string;
  status: 'active' | 'paid' | 'overdue' | 'paused';
  payment_method?: string;
  notes?: string;
  created_at: string;
}

const DEBT_CATEGORIES = {
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard, color: 'bg-red-100 text-red-600' },
  personal_loan: { label: 'Empréstimo Pessoal', icon: DollarSign, color: 'bg-orange-100 text-orange-600' },
  mortgage: { label: 'Financiamento Imobiliário', icon: Home, color: 'bg-blue-100 text-blue-600' },
  car_loan: { label: 'Financiamento Veicular', icon: Car, color: 'bg-green-100 text-green-600' },
  student_loan: { label: 'Financiamento Estudantil', icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
  installment: { label: 'Parcelamento', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
  other: { label: 'Outros', icon: Wallet, color: 'bg-gray-100 text-gray-600' }
};

const DEBT_STATUS = {
  active: { label: 'Ativa', color: 'bg-blue-100 text-blue-600', variant: 'default' as const },
  paid: { label: 'Quitada', color: 'bg-green-100 text-green-600', variant: 'secondary' as const },
  overdue: { label: 'Em Atraso', color: 'bg-red-100 text-red-600', variant: 'destructive' as const },
  paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-600', variant: 'outline' as const }
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE"
];

export default function PersonalDebtsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useState<PersonalDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<PersonalDebt | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (user) {
      loadDebts();
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 640px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const loadDebts = async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const supabaseUserId = user.id;
      const res = await fetch(`/api/debts/get?user_id=${encodeURIComponent(supabaseUserId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.details || err?.error || 'Falha ao buscar dívidas');
      }

      const data = await res.json();
      const apiDebts = (data?.debts || []) as any[];

      const mappedDebts: PersonalDebt[] = apiDebts.map((d) => {
        const total = Number(d.originalAmount ?? 0);
        const current = Number(d.currentAmount ?? 0); // saldo atual no banco
        const paid = Math.max(total - current, 0);

        return {
          id: d.id,
          name: d.description ? String(d.description) : String(d.creditorName || 'Dívida'),
          description: d.description || undefined,
          total_amount: total,
          remaining_amount: current,
          paid_amount: paid,
          interest_rate: d.interestRate ?? 0,
          monthly_payment: Number(d.installments?.amount ?? 0),
          due_date: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          start_date: d.createdDate ? new Date(d.createdDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          category: d.category || 'other',
          creditor: d.creditorName || '',
          status: d.status || 'active',
          payment_method: d.paymentMethod || undefined,
          notes: d.notes || undefined,
          created_at: d.createdDate ? new Date(d.createdDate).toISOString() : new Date().toISOString()
        };
      });

      setDebts(mappedDebts);
      
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar as dívidas pessoais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDebts = debts.filter(debt => {
    const matchesSearch = debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.creditor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || debt.category === selectedCategory;
    const matchesStatus = !selectedStatus || debt.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalDebt = filteredDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
  const totalPaid = filteredDebts.reduce((sum, debt) => sum + debt.paid_amount, 0);
  const monthlyPayments = filteredDebts
    .filter(debt => debt.status === 'active')
    .reduce((sum, debt) => sum + debt.monthly_payment, 0);
  const overdueDebts = filteredDebts.filter(debt => debt.status === 'overdue').length;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const payoffRate = useMemo(() => {
    const total = totalPaid + totalDebt;
    if (total <= 0) return 0;
    return (totalPaid / total) * 100;
  }, [totalPaid, totalDebt]);

  const categoryChartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of filteredDebts) {
      const key = d.category || 'other';
      totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(d.remaining_amount) ? d.remaining_amount : 0));
    }
    return Array.from(totals.entries())
      .map(([category, value]) => ({
        category,
        name: (DEBT_CATEGORIES[category as keyof typeof DEBT_CATEGORIES] || DEBT_CATEGORIES.other).label,
        value
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDebts]);

  const statusChartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of filteredDebts) {
      const key = d.status || 'active';
      totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(d.remaining_amount) ? d.remaining_amount : 0));
    }
    return Array.from(totals.entries())
      .map(([status, value]) => ({
        status,
        name: (DEBT_STATUS[status as keyof typeof DEBT_STATUS] || DEBT_STATUS.active).label,
        value
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDebts]);

  const creditorChartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const d of filteredDebts) {
      const key = (d.creditor || 'Sem credor').trim() || 'Sem credor';
      totals.set(key, (totals.get(key) ?? 0) + (Number.isFinite(d.remaining_amount) ? d.remaining_amount : 0));
    }
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredDebts]);

  const upcomingDebts = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    return filteredDebts
      .filter((d) => d.status !== 'paid')
      .map((d) => ({ debt: d, due: new Date(d.due_date) }))
      .filter(({ due }) => Number.isFinite(due.getTime()))
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .filter(({ due }) => due <= in30Days)
      .slice(0, 6);
  }, [filteredDebts]);

  const interestInsights = useMemo(() => {
    const debtsWithInterest = filteredDebts.filter((d) => (d.interest_rate ?? 0) > 0 && d.status !== 'paid');
    const weightedDen = debtsWithInterest.reduce((sum, d) => sum + d.remaining_amount, 0);
    const weightedNum = debtsWithInterest.reduce((sum, d) => sum + (d.remaining_amount * (d.interest_rate ?? 0)), 0);
    const weightedAvg = weightedDen > 0 ? weightedNum / weightedDen : 0;
    return {
      debtsWithInterestCount: debtsWithInterest.length,
      weightedAverageRate: weightedAvg
    };
  }, [filteredDebts]);

  const monthlyForecastData = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setHours(0, 0, 0, 0);

    const payingDebts = filteredDebts.filter((d) => d.status === 'active' || d.status === 'overdue');
    const monthly = payingDebts.reduce((sum, d) => sum + (Number.isFinite(d.monthly_payment) ? d.monthly_payment : 0), 0);

    const result: Array<{ month: string; value: number }> = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      result.push({ month: label.replace('.', ''), value: monthly });
    }
    return result;
  }, [filteredDebts]);

  const getCategoryInfo = (category: string) => {
    return DEBT_CATEGORIES[category as keyof typeof DEBT_CATEGORIES] || DEBT_CATEGORIES.other;
  };

  const getStatusInfo = (status: string) => {
    return DEBT_STATUS[status as keyof typeof DEBT_STATUS] || DEBT_STATUS.active;
  };

  const calculateProgress = (debt: PersonalDebt) => {
    if (debt.total_amount === 0) return 0;
    return (debt.paid_amount / debt.total_amount) * 100;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleViewDebt = (debt: PersonalDebt) => {
    setSelectedDebt(debt);
    setIsViewOpen(true);
  };

  const handleEditDebt = (debt: PersonalDebt) => {
    setSelectedDebt(debt);
    setIsFormOpen(true);
  };

  const handleDeleteDebt = async () => {
    if (!selectedDebt || !user?.id) {
      toast({
        title: "Erro",
        description: "Dívida não selecionada ou usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/debts/delete?id=${selectedDebt.id}&user_id=${user.id}`, {
        method: 'DELETE'
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && (result?.success || !result?.error)) {
        toast({
          title: "Dívida Removida!",
          description: `${selectedDebt.name} foi removida com sucesso.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedDebt(null);
        await loadDebts();
      } else {
        throw new Error(result?.details || result?.error || 'Falha ao deletar dívida');
      }
    } catch (error) {
      console.error('Erro ao deletar dívida:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar dívida.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Voltar ao Dashboard</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                Dívidas Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Controle suas dívidas e financiamentos pessoais</span>
                <span className="sm:hidden">Suas dívidas e financiamentos</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Nova Dívida</span>
            <span className="xs:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6">
        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <div className="-mx-2">
            <TabsList className="w-full overflow-x-auto whitespace-nowrap px-2 h-10 sm:h-11 justify-start gap-1">
              <TabsTrigger value="overview" className="text-base sm:text-base px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0 min-w-max">
                <span className="sm:hidden">Geral</span>
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="cadastro" className="text-base sm:text-base px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0 min-w-max">Cadastro</TabsTrigger>
              <TabsTrigger value="relatorios" className="text-base sm:text-base px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0 min-w-max">Relatórios</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Cards de Resumo */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total em Dívidas</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                    {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredDebts.filter(d => d.status === 'active').length} dívida(s) ativa(s)
                  </p>
                </CardContent>
              </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor já quitado
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pagamentos Mensais</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words">
                {monthlyPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comprometimento mensal
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Dívidas em Atraso</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                {overdueDebts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueDebts === 0 ? 'Nenhuma em atraso' : 'Requer atenção'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou credor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {Object.entries(DEBT_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(DEBT_STATUS).map(([key, status]) => (
                    <option key={key} value={key}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Dívidas */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Suas Dívidas Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {filteredDebts.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedCategory || selectedStatus 
                    ? 'Nenhuma dívida encontrada com os filtros aplicados.' 
                    : 'Nenhuma dívida pessoal cadastrada ainda.'}
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Dívida
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredDebts.map((debt) => {
                  const categoryInfo = getCategoryInfo(debt.category);
                  const statusInfo = getStatusInfo(debt.status);
                  const IconComponent = categoryInfo.icon;
                  const progress = calculateProgress(debt);
                  const overdue = isOverdue(debt.due_date) && debt.status === 'active';
                  
                  return (
                    <div key={debt.id} className={`p-3 sm:p-6 border rounded-xl hover:shadow-lg transition-all duration-200 bg-card ${
                      overdue ? 'border-destructive ring-2 ring-destructive/20' : ''
                    }`}>
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className={`p-2 sm:p-3 rounded-xl ${categoryInfo.color} shadow-sm flex-shrink-0`}>
                            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold truncate">{debt.name}</h3>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant={statusInfo.variant} className="text-xs">
                                  {statusInfo.label}
                                </Badge>
                                {overdue && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">
                                    Em Atraso
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {debt.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{debt.description}</p>
                            )}
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs w-fit">
                                {categoryInfo.label}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="truncate">Credor: {debt.creditor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 justify-end">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDebt(debt)}>
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditDebt(debt)}>
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => { setSelectedDebt(debt); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Amount Display */}
                      <div className="bg-card rounded-xl p-3 sm:p-5 mb-3 sm:mb-4 border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Valor Restante</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-destructive break-words">
                              {debt.remaining_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Original</p>
                            <p className="text-lg sm:text-xl font-bold text-foreground break-words">
                              {debt.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="bg-card rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border">
                        <div className="flex justify-between text-xs sm:text-sm mb-2 sm:mb-3">
                          <span className="font-medium text-foreground">Progresso do pagamento</span>
                          <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 sm:h-3">
                          <div 
                            className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Informações Adicionais */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                        <div className="bg-card rounded-lg p-2 sm:p-3 text-center border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2">Parcela Mensal</p>
                          <p className="text-sm sm:text-lg font-bold text-foreground break-words">
                            {debt.monthly_payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        {debt.interest_rate && debt.interest_rate > 0 && (
                          <div className="bg-card rounded-lg p-2 sm:p-3 text-center border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2">Taxa de Juros</p>
                            <p className="text-sm sm:text-lg font-bold text-foreground">{debt.interest_rate}% a.m.</p>
                          </div>
                        )}
                        <div className="bg-card rounded-lg p-2 sm:p-3 text-center border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2">Valor Pago</p>
                          <p className="text-sm sm:text-lg font-bold text-green-600 break-words">
                            {debt.paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="bg-card rounded-lg p-2 sm:p-3 text-center border">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 sm:mb-2">Data Início</p>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {new Date(debt.start_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    
                    {debt.notes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">{debt.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
          </TabsContent>

          <TabsContent value="cadastro" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar nova dívida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Organize o cadastro em um formulário com abas para facilitar o preenchimento.</p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Nova Dívida
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4 md:space-y-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Saldo Devedor</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                    {formatCurrency(totalDebt)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Base: {filteredDebts.length} dívida(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                    {formatCurrency(totalPaid)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Valor já quitado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Parcelas Mensais</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words">
                    {formatCurrency(monthlyPayments)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Somente dívidas ativas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Quitação</CardTitle>
                  <DollarSign className="h-4 w-4 text-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                      {payoffRate.toFixed(1)}%
                    </div>
                    <Badge variant={overdueDebts > 0 ? "destructive" : "secondary"} className="text-xs">
                      {overdueDebts > 0 ? `${overdueDebts} em atraso` : "Sem atraso"}
                    </Badge>
                  </div>
                  <Progress value={payoffRate} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Por categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
                  ) : (
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={isMobile ? 45 : 55} outerRadius={isMobile ? 75 : 90}>
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`${entry.category}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                          {!isMobile && <Legend />}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por status</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
                  ) : (
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={isMobile ? 45 : 55} outerRadius={isMobile ? 75 : 90}>
                            {statusChartData.map((entry, index) => (
                              <Cell key={`${entry.status}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                          {!isMobile && <Legend />}
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Maiores credores</CardTitle>
                </CardHeader>
                <CardContent>
                  {creditorChartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
                  ) : (
                    <div className="w-full h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={creditorChartData} layout="vertical" margin={{ left: isMobile ? 0 : 12, right: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} />
                          <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                            {creditorChartData.map((entry, index) => (
                              <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projeção de pagamentos (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyForecastData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Base: soma das parcelas de dívidas ativas e em atraso.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Próximos vencimentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum vencimento nos próximos 30 dias.</p>
                  ) : (
                    upcomingDebts.map(({ debt, due }) => {
                      const overdue = due < new Date() && debt.status !== 'paid';
                      return (
                        <div key={debt.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{debt.name}</span>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Atrasada
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {due.toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-foreground">
                              {formatCurrency(debt.remaining_amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">{debt.creditor || 'Sem credor'}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Dívidas em atraso</div>
                    <div className="font-semibold">{overdueDebts}</div>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Juros médio ponderado</div>
                    <div className="font-semibold">
                      {interestInsights.debtsWithInterestCount > 0 ? `${interestInsights.weightedAverageRate.toFixed(2)}% a.m.` : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Total original (estimado)</div>
                    <div className="font-semibold">{formatCurrency(totalPaid + totalDebt)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Formulário de dívida pessoal */}
        {isFormOpen && (
          <PersonalDebtForm 
             isOpen={isFormOpen}
             onClose={() => {
               setIsFormOpen(false);
               setSelectedDebt(null);
             }}
             onSuccess={() => {
               loadDebts();
               setIsFormOpen(false);
               setSelectedDebt(null);
             }}
             editingDebt={selectedDebt}
           />
        )}

        {/* Modal de Visualização */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Dívida</DialogTitle>
              <DialogDescription>Visualize os valores atuais e informações salvas.</DialogDescription>
            </DialogHeader>
            {selectedDebt && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedDebt.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credor</p>
                    <p className="font-medium">{selectedDebt.creditor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Original</p>
                    <p className="font-medium">{selectedDebt.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Restante</p>
                    <p className="font-medium">{selectedDebt.remaining_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Pago</p>
                    <p className="font-medium">{selectedDebt.paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Parcela Mensal</p>
                    <p className="font-medium">{selectedDebt.monthly_payment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{new Date(selectedDebt.due_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Início</p>
                    <p className="font-medium">{new Date(selectedDebt.start_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {selectedDebt.notes && (
                  <div>
                    <p className="text-muted-foreground">Observações</p>
                    <p className="font-medium">{selectedDebt.notes}</p>
                  </div>
                )}
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Debug</p>
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedDebt, null, 2)}
                  </pre>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
                  <Button onClick={() => { setIsViewOpen(false); if (selectedDebt) handleEditDebt(selectedDebt); }}>Editar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmação de Exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover dívida?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A dívida será removida do seu banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDebt}>Excluir</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
