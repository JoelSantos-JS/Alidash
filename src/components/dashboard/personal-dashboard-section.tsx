"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExpensesChart } from "./expenses-chart";
import MonthlyIncomeForm from "@/components/forms/monthly-income-form";
import SalarySettingsForm from "@/components/forms/salary-settings-form";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import type { Goal } from "@/types";
import { getCache, setCache } from "@/lib/client-cache";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  User,
  Wallet,
  CreditCard,
  Home,
  Car,
  ShoppingBag,
  Coffee,
  Gamepad2,
  Heart,
  GraduationCap,
  Plane,
  Utensils,
  Zap,
  Shield,
  Shirt,
  Gift,
  Plus,
  Settings
} from "lucide-react";

interface PersonalSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
}



interface PersonalExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  is_essential: boolean;
  payment_method: string;
}

interface PersonalIncome {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  source: string;
}

interface PersonalDashboardSectionProps {
  user: any;
  periodFilter: string;
  isLoading: boolean;
  viewMode?: "all" | "day";
  selectedDate?: Date | null;
}

export function PersonalDashboardSection({ user, periodFilter, isLoading, viewMode = "all", selectedDate = null }: PersonalDashboardSectionProps) {
  const router = useRouter();
  const [personalSummary, setPersonalSummary] = useState<PersonalSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    savingsRate: 0,
    essentialExpenses: 0,
    nonEssentialExpenses: 0
  });
  const [recentExpenses, setRecentExpenses] = useState<PersonalExpense[]>([]);
  const [recentIncomes, setRecentIncomes] = useState<PersonalIncome[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = useState<PersonalIncome[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<PersonalExpense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showSalarySettings, setShowSalarySettings] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const CACHE_TTL_MS = 30_000; // 30 segundos
  const [animatingCard, setAnimatingCard] = useState<null | 'income' | 'expenses'>(null);

  // Unificar receitas e despesas e ordenar por data desc (top-level Hook)
  const recentTransactions = useMemo(() => {
    const incomeItems = (recentIncomes || []).map(income => ({
      ...income,
      __type: 'income' as const
    }));
    const expenseItems = (recentExpenses || []).map(expense => ({
      ...expense,
      __type: 'expense' as const
    }));
    const merged = [...incomeItems, ...expenseItems];
    merged.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return merged;
  }, [recentIncomes, recentExpenses]);

  useEffect(() => {
    if (!user) return;
    loadPersonalData();
  }, [user, periodFilter, viewMode, selectedDate]);

  // Cancelar requisições ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadPersonalData = async () => {
    if (!user?.id) return;
    
    // Cancelar requisições anteriores em troca rápida de modo
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);
      const supabaseUserId = user.id;

      // Chaves de cache
      const summaryKey = `personal:summary:${supabaseUserId}:${currentMonth}:${currentYear}`;
      const expensesKey = `personal:expenses:${supabaseUserId}:recent:5`;
      const incomesKey = `personal:incomes:${supabaseUserId}:recent:4`;
      const goalsKey = `personal:goals:${supabaseUserId}`;
      const monthlyExpensesKey = `personal:expenses:${supabaseUserId}:monthly:${currentMonth}:${currentYear}`;
      const monthlyIncomesKey = `personal:incomes:${supabaseUserId}:monthly:${currentMonth}:${currentYear}`;

      // Aplicar cache imediato quando disponível
      const cachedSummary = getCache<PersonalSummary>(summaryKey, CACHE_TTL_MS);
      if (cachedSummary) setPersonalSummary(cachedSummary);
      const cachedExpenses = getCache<PersonalExpense[]>(expensesKey, CACHE_TTL_MS);
      if (cachedExpenses) setRecentExpenses(cachedExpenses);
      const cachedMonthlyExpenses = getCache<PersonalExpense[]>(monthlyExpensesKey, CACHE_TTL_MS);
      if (cachedMonthlyExpenses) setMonthlyExpenses(cachedMonthlyExpenses);
      const cachedIncomes = getCache<PersonalIncome[]>(incomesKey, CACHE_TTL_MS);
      if (cachedIncomes) setRecentIncomes(cachedIncomes);
      const cachedMonthlyIncomes = getCache<PersonalIncome[]>(monthlyIncomesKey, CACHE_TTL_MS);
      if (cachedMonthlyIncomes) setMonthlyIncomes(cachedMonthlyIncomes);
      const cachedGoals = getCache<Goal[]>(goalsKey, CACHE_TTL_MS);
      if (cachedGoals) setGoals(cachedGoals);

      // Preparar fetches paralelos somente do que falta
      const summaryPromise = cachedSummary
        ? Promise.resolve(cachedSummary)
        : fetch(`/api/personal/summary?user_id=${supabaseUserId}&month=${currentMonth}&year=${currentYear}`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.summary) {
                setPersonalSummary(data.summary);
                setCache(summaryKey, data.summary);
                return data.summary as PersonalSummary;
              }
              return null;
            });

      const expensesPromise = cachedExpenses
        ? Promise.resolve(cachedExpenses)
        : fetch(`/api/personal/expenses/recent?user_id=${supabaseUserId}&limit=5`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              const list = (data?.expenses || []) as PersonalExpense[];
              setRecentExpenses(list);
              setCache(expensesKey, list);
              return list;
            });

      const monthlyExpensesPromise = cachedMonthlyExpenses
        ? Promise.resolve(cachedMonthlyExpenses)
        : fetch(`/api/personal/expenses?user_id=${supabaseUserId}&month=${currentMonth}&year=${currentYear}`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              const list = (data?.expenses || []) as PersonalExpense[];
              setMonthlyExpenses(list);
              setCache(monthlyExpensesKey, list);
              return list;
            });

      const incomesPromise = cachedIncomes
        ? Promise.resolve(cachedIncomes)
        : fetch(`/api/personal/incomes/recent?user_id=${supabaseUserId}&limit=4`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              const list = (data?.incomes || []) as PersonalIncome[];
              setRecentIncomes(list);
              setCache(incomesKey, list);
              return list;
            });

      // Receitas do mês (consulta por mês/ano)
      const monthlyIncomesPromise = cachedMonthlyIncomes
        ? Promise.resolve(cachedMonthlyIncomes)
        : fetch(`/api/personal/incomes?user_id=${supabaseUserId}&month=${currentMonth}&year=${currentYear}`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              const list = (data?.incomes || []) as PersonalIncome[];
              setMonthlyIncomes(list);
              setCache(monthlyIncomesKey, list);
              return list;
            });

      const goalsPromise = cachedGoals
        ? Promise.resolve(cachedGoals)
        : fetch(`/api/personal/goals?user_id=${supabaseUserId}`, { signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.goals) {
                const formattedGoals: Goal[] = data.goals.map((goal: any) => ({
                  id: goal.id,
                  name: goal.name,
                  description: goal.description,
                  category: goal.type === 'savings' ? 'financial' : 'personal',
                  type: goal.type || 'savings',
                  targetValue: goal.target_amount,
                  currentValue: goal.current_amount || 0,
                  unit: 'BRL',
                  deadline: new Date(goal.deadline),
                  createdDate: new Date(goal.created_at),
                  priority: goal.priority || 'medium',
                  status: goal.status || 'active',
                  notes: goal.notes,
                  tags: []
                }));
                setGoals(formattedGoals);
                setCache(goalsKey, formattedGoals);
                return formattedGoals;
              }
              return [] as Goal[];
            });

      await Promise.allSettled([summaryPromise, expensesPromise, monthlyExpensesPromise, incomesPromise, monthlyIncomesPromise, goalsPromise]);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Troca rápida de modo; ignorar erros abortados
        return;
      }
      console.error('❌ Erro ao carregar dados pessoais:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    console.log('📝 Criando dados de exemplo para demonstração...');
    
    // Dados de exemplo para demonstração
    setPersonalSummary({
      totalIncome: 5500.00,
      totalExpenses: 3200.00,
      balance: 2300.00,
      savingsRate: 41.8,
      essentialExpenses: 2100.00,
      nonEssentialExpenses: 1100.00
    });
    

    
    setRecentExpenses([
      { id: '1', description: 'Supermercado Extra', amount: 285.50, category: 'food', date: '2025-01-10', is_essential: true, payment_method: 'debit_card' },
      { id: '2', description: 'Combustível Posto Shell', amount: 120.00, category: 'transportation', date: '2025-01-09', is_essential: true, payment_method: 'credit_card' },
      { id: '3', description: 'Netflix + Spotify', amount: 49.90, category: 'entertainment', date: '2025-01-08', is_essential: false, payment_method: 'credit_card' },
      { id: '4', description: 'Farmácia Droga Raia', amount: 67.80, category: 'healthcare', date: '2025-01-07', is_essential: true, payment_method: 'debit_card' },
      { id: '5', description: 'Almoço Restaurante', amount: 45.00, category: 'food', date: '2025-01-06', is_essential: false, payment_method: 'pix' }
    ]);
    
    setRecentIncomes([
      { id: '1', description: 'Salário Janeiro', amount: 4500.00, category: 'salary', date: '2025-01-05', source: 'Empresa XYZ Ltda' },
      { id: '2', description: 'Freelance Design', amount: 800.00, category: 'freelance', date: '2025-01-03', source: 'Cliente ABC' },
      { id: '3', description: 'Dividendos Ações', amount: 150.00, category: 'investment', date: '2025-01-02', source: 'Corretora XP' },
      { id: '4', description: 'Cashback Cartão', amount: 50.00, category: 'bonus', date: '2025-01-01', source: 'Banco Inter' }
    ]);
  };

  // Cores por categoria (alinhadas com ExpensesChart)
  const CATEGORY_COLORS: Record<string, string> = {
    housing: '#ef4444',
    food: '#f97316',
    transportation: '#eab308',
    healthcare: '#22c55e',
    entertainment: '#3b82f6',
    clothing: '#8b5cf6',
    utilities: '#06b6d4',
    insurance: '#84cc16',
    gifts: '#f59e0b',
    other: '#6b7280'
  };

  // Utilitários e dados derivados para modo "Dia específico"
  const isSameDay = (dateStr: string, dateObj: Date | null) => {
    if (!dateObj) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth() && d.getDate() === dateObj.getDate();
  };

  const displayExpenses = useMemo<PersonalExpense[]>(() => {
    if (viewMode === 'day' && selectedDate) {
      return (monthlyExpenses || []).filter(e => isSameDay(e.date, selectedDate));
    }
    return monthlyExpenses || [];
  }, [monthlyExpenses, viewMode, selectedDate]);

  const displayIncomes = useMemo<PersonalIncome[]>(() => {
    if (viewMode === 'day' && selectedDate) {
      return (monthlyIncomes || []).filter(i => isSameDay(i.date, selectedDate));
    }
    return monthlyIncomes && monthlyIncomes.length > 0 ? monthlyIncomes : recentIncomes;
  }, [monthlyIncomes, recentIncomes, viewMode, selectedDate]);

  const summaryForDisplay = useMemo<PersonalSummary>(() => {
    if (viewMode === 'day' && selectedDate) {
      const totalExpenses = displayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const essentialExpenses = displayExpenses.filter(e => !!e.is_essential).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const nonEssentialExpenses = totalExpenses - essentialExpenses;
      const totalIncome = displayIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
      return { totalIncome, totalExpenses, balance, savingsRate, essentialExpenses, nonEssentialExpenses };
    }
    return personalSummary;
  }, [viewMode, selectedDate, displayExpenses, displayIncomes, personalSummary]);

  // Recalcular dados por categoria com base nas despesas exibidas
  useEffect(() => {
    const total = summaryForDisplay.totalExpenses || 0;
    if (!displayExpenses || displayExpenses.length === 0 || total <= 0) {
      setExpensesByCategory([]);
      return;
    }

    const grouped = displayExpenses.reduce((acc: Record<string, { amount: number; isEssential: boolean }>, exp) => {
      const key = exp.category || 'other';
      if (!acc[key]) {
        acc[key] = { amount: 0, isEssential: !!exp.is_essential };
      }
      acc[key].amount += Number(exp.amount) || 0;
      acc[key].isEssential = acc[key].isEssential || !!exp.is_essential;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([category, info]) => ({
      category,
      amount: info.amount,
      percentage: total > 0 ? (info.amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
      icon: category,
      isEssential: info.isEssential
    }));

    result.sort((a, b) => b.amount - a.amount);
    setExpensesByCategory(result);
  }, [displayExpenses, summaryForDisplay.totalExpenses]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      housing: Home,
      food: Utensils,
      transportation: Car,
      healthcare: Heart,
      education: GraduationCap,
      entertainment: Gamepad2,
      clothing: Shirt,
      utilities: Zap,
      insurance: Shield,
      gifts: Gift,
      other: Wallet
    };
    const IconComponent = icons[category] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };



  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, any> = {
      credit_card: CreditCard,
      debit_card: CreditCard,
      pix: DollarSign,
      cash: Wallet,
      bank_transfer: DollarSign
    };
    const IconComponent = icons[method] || Wallet;
    return <IconComponent className="h-3 w-3" />;
  };

  if (loading || isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Financeiro Pessoal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className={cn(
            "transform-gpu hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95",
            animatingCard === 'income' ? "animate-pulse ring-2 ring-green-500" : ""
          )}
          onClick={() => {
            setAnimatingCard('income');
            setTimeout(() => router.push('/pessoal/receitas'), 180);
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAnimatingCard('income');
              setTimeout(() => router.push('/pessoal/receitas'), 180);
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{viewMode === 'day' ? 'Ganhos do Dia' : 'Ganhos do Mês'}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setShowIncomeForm(true) }}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Renda
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setShowSalarySettings(true) }}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-6 px-2 text-xs"
                title="Configurar Salário Fixo"
              >
                <Settings className="h-3 w-3" />
              </Button>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryForDisplay.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Salário + extras</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "transform-gpu hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95",
            animatingCard === 'expenses' ? "animate-pulse ring-2 ring-red-500" : ""
          )}
          onClick={() => {
            setAnimatingCard('expenses');
            setTimeout(() => router.push('/pessoal/despesas'), 180);
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAnimatingCard('expenses');
              setTimeout(() => router.push('/pessoal/despesas'), 180);
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{viewMode === 'day' ? 'Gastos do Dia' : 'Gastos do Mês'}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryForDisplay.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Contas + despesas</p>
          </CardContent>
        </Card>

        {/* Economia */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summaryForDisplay.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summaryForDisplay.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryForDisplay.savingsRate.toFixed(1)}% do ganho
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal - Gráfico de Gastos e Transações Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Gastos e Despesas */}
        <ExpensesChart 
          totalExpenses={summaryForDisplay.totalExpenses}
          essentialExpenses={summaryForDisplay.essentialExpenses}
          nonEssentialExpenses={summaryForDisplay.nonEssentialExpenses}
          totalIncome={summaryForDisplay.totalIncome}
          expensesByCategory={expensesByCategory}
        />

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transações Recentes
            </CardTitle>
            <p className="text-sm text-muted-foreground">Últimas movimentações financeiras</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(
                viewMode === 'day' && selectedDate
                  ? [...(displayIncomes || []).map((i: PersonalIncome) => ({ ...i, __type: 'income' as const })), ...(displayExpenses || []).map((e: PersonalExpense) => ({ ...e, __type: 'expense' as const }))]
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  : recentTransactions
                ).slice(0, 5).map((tx: any) => {
                const isIncome = tx.__type === 'income';
                if (isIncome) {
                  return (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.source || 'Não informado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {tx.category}
                        </Badge>
                      </div>
                    </div>
                  );
                }

                const isEssential = !!tx.is_essential;
                const pmIcon = tx.payment_method ? getPaymentMethodIcon(tx.payment_method) : null;
                return (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEssential ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                          {pmIcon}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        -{Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <Badge variant={isEssential ? 'destructive' : 'secondary'} className="text-xs">
                        {isEssential ? 'Essencial' : 'Opcional'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget de Metas */}
      <GoalsWidget goals={goals} className="col-span-full" />

      {/* Orçamento Pessoal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Orçamento Pessoal
          </CardTitle>
          <p className="text-sm text-muted-foreground">Controle suas despesas pessoais</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/30 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {(summaryForDisplay.totalIncome * 0.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Orçamento Mensal</p>
            </div>
            <div className="text-center p-4 bg-muted/30 border rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {summaryForDisplay.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Gastos Realizados</p>
            </div>
            <div className="text-center p-4 bg-muted/30 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {((summaryForDisplay.totalIncome * 0.6) - summaryForDisplay.totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Disponível</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Renda Mensal */}
      {showIncomeForm && (
        <MonthlyIncomeForm
          isOpen={showIncomeForm}
          onClose={() => setShowIncomeForm(false)}
          onSuccess={() => {
            setShowIncomeForm(false);
            loadPersonalData(); // Recarrega os dados após cadastrar nova renda
          }}
        />
      )}

      {/* Modal de Configuração de Salário */}
      {showSalarySettings && (
        <SalarySettingsForm
          isOpen={showSalarySettings}
          onClose={() => setShowSalarySettings(false)}
          onSuccess={() => {
            setShowSalarySettings(false);
            loadPersonalData(); // Recarrega os dados após configurar salário
          }}
        />
      )}
    </div>
  );
}
