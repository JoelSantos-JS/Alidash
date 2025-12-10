"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  Plus,
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
  Plane
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

interface PersonalSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
}

interface PersonalGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  progress_percentage: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  type: string;
}

interface PersonalExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  is_essential: boolean;
}

interface PersonalDashboardProps {
  summaryStats: any;
  isLoading: boolean;
  periodFilter: string;
}

export function PersonalDashboard({ summaryStats, isLoading, periodFilter }: PersonalDashboardProps) {
  const { user } = useSupabaseAuth();
  const [personalSummary, setPersonalSummary] = useState<PersonalSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    savingsRate: 0,
    essentialExpenses: 0,
    nonEssentialExpenses: 0
  });
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user) return;
    loadPersonalData();
  }, [user, periodFilter]);

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      
      const supabaseUserId = user!.id;
      
      // Carregar dados pessoais em paralelo
      const [summaryResult, goalsResult] = await Promise.allSettled([
        fetch(`/api/personal/summary?user_id=${supabaseUserId}&month=${currentMonth}&year=${currentYear}`)
          .then(res => res.ok ? res.json() : { summary: null }),
        fetch(`/api/personal/goals?user_id=${supabaseUserId}`)
          .then(res => res.ok ? res.json() : { goals: [] })
      ]);
      
      // Processar resultados
      if (summaryResult.status === 'fulfilled' && summaryResult.value.summary) {
        setPersonalSummary(summaryResult.value.summary);
      }
      
      if (goalsResult.status === 'fulfilled' && goalsResult.value.goals) {
        setGoals(goalsResult.value.goals);
      }
      
      // Simular algumas despesas recentes para demonstração
      setRecentExpenses([
        { id: '1', description: 'Supermercado', amount: 150.00, category: 'food', date: '2025-01-10', is_essential: true },
        { id: '2', description: 'Combustível', amount: 80.00, category: 'transportation', date: '2025-01-09', is_essential: true },
        { id: '3', description: 'Netflix', amount: 29.90, category: 'entertainment', date: '2025-01-08', is_essential: false },
        { id: '4', description: 'Farmácia', amount: 45.50, category: 'healthcare', date: '2025-01-07', is_essential: true },
      ]);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados pessoais:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      housing: Home,
      food: ShoppingBag,
      transportation: Car,
      healthcare: Heart,
      education: GraduationCap,
      entertainment: Gamepad2,
      travel: Plane,
      other: Wallet
    };
    const IconComponent = icons[category] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  const getGoalIcon = (type: string) => {
    const icons: Record<string, any> = {
      emergency_fund: PiggyBank,
      savings: DollarSign,
      investment: TrendingUp,
      purchase: ShoppingBag,
      vacation: Plane,
      home_purchase: Home,
      other: Target
    };
    const IconComponent = icons[type] || Target;
    return <IconComponent className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receitas */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pessoais</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {personalSummary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Pessoais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {personalSummary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pessoal</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {personalSummary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        {/* Taxa de Poupança */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {personalSummary.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal - Metas e Gastos Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Metas Financeiras */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas Financeiras
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma meta financeira encontrada</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getGoalIcon(goal.type)}
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de{' '}
                            {goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.progress_percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={goal.progress_percentage} className="h-2" />
                  </div>
                ))}
                {goals.length > 3 && (
                  <Button variant="outline" className="w-full">
                    Ver todas as metas ({goals.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gastos Recentes
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Gasto
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      expense.is_essential ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      -{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <Badge variant={expense.is_essential ? 'destructive' : 'secondary'} className="text-xs">
                      {expense.is_essential ? 'Essencial' : 'Opcional'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Gastos Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Gastos Essenciais</span>
                <span className="text-sm text-muted-foreground">
                  {personalSummary.essentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <Progress 
                value={personalSummary.totalExpenses > 0 ? (personalSummary.essentialExpenses / personalSummary.totalExpenses) * 100 : 0} 
                className="h-2 mb-4" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Gastos Opcionais</span>
                <span className="text-sm text-muted-foreground">
                  {personalSummary.nonEssentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <Progress 
                value={personalSummary.totalExpenses > 0 ? (personalSummary.nonEssentialExpenses / personalSummary.totalExpenses) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
