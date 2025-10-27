"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function PersonalDebtsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [debts, setDebts] = useState<PersonalDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadDebts();
    }
  }, [user]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      
      // Simular dados de dívidas pessoais para demonstração
      // TODO: Implementar API real para dívidas pessoais
      const mockDebts: PersonalDebt[] = [
        {
          id: '1',
          name: 'Cartão de Crédito Nubank',
          description: 'Fatura do cartão de crédito',
          total_amount: 2500.00,
          remaining_amount: 1800.00,
          paid_amount: 700.00,
          interest_rate: 12.5,
          monthly_payment: 300.00,
          due_date: '2025-02-15',
          start_date: '2024-08-15',
          category: 'credit_card',
          creditor: 'Nubank',
          status: 'active',
          payment_method: 'automatic_debit',
          notes: 'Pagamento automático configurado',
          created_at: '2024-08-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Financiamento do Apartamento',
          description: 'Financiamento habitacional Caixa',
          total_amount: 180000.00,
          remaining_amount: 165000.00,
          paid_amount: 15000.00,
          interest_rate: 8.5,
          monthly_payment: 1200.00,
          due_date: '2025-02-10',
          start_date: '2024-01-10',
          category: 'mortgage',
          creditor: 'Caixa Econômica Federal',
          status: 'active',
          payment_method: 'bank_transfer',
          notes: 'Financiamento em 240 parcelas',
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: '3',
          name: 'Empréstimo Pessoal',
          description: 'Empréstimo para reforma da casa',
          total_amount: 15000.00,
          remaining_amount: 8500.00,
          paid_amount: 6500.00,
          interest_rate: 15.0,
          monthly_payment: 850.00,
          due_date: '2025-02-20',
          start_date: '2024-06-20',
          category: 'personal_loan',
          creditor: 'Banco do Brasil',
          status: 'active',
          payment_method: 'bank_slip',
          notes: 'Empréstimo para reforma',
          created_at: '2024-06-20T10:00:00Z'
        },
        {
          id: '4',
          name: 'Parcelamento Notebook',
          description: 'MacBook Pro parcelado em 12x',
          total_amount: 12000.00,
          remaining_amount: 0.00,
          paid_amount: 12000.00,
          interest_rate: 0,
          monthly_payment: 1000.00,
          due_date: '2024-12-15',
          start_date: '2024-01-15',
          category: 'installment',
          creditor: 'Apple Store',
          status: 'paid',
          payment_method: 'credit_card',
          notes: 'Parcelamento sem juros',
          created_at: '2024-01-15T10:00:00Z'
        }
      ];
      
      setDebts(mockDebts);
      
    } catch (error) {
      console.error('Erro ao carregar dívidas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as dívidas pessoais.",
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

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
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

        {/* Formulário de dívida pessoal */}
        {isFormOpen && (
          <PersonalDebtForm 
             isOpen={isFormOpen}
             onClose={() => {
               setIsFormOpen(false);
             }}
             onSuccess={() => {
               loadDebts();
               setIsFormOpen(false);
             }}
             editingDebt={null}
           />
        )}
      </div>
    </div>
  );
}