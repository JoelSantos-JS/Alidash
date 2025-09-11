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
  Plane,
  Utensils,
  Zap,
  Shield,
  Shirt,
  Gift
} from "lucide-react";

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
}

export function PersonalDashboardSection({ user, periodFilter, isLoading }: PersonalDashboardSectionProps) {
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
  const [recentIncomes, setRecentIncomes] = useState<PersonalIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(1); // Janeiro para usar os dados de teste
  const [currentYear] = useState(2025);

  useEffect(() => {
    if (!user) return;
    loadPersonalData();
  }, [user, periodFilter]);

  const loadPersonalData = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        console.log('⚠️ Usuário não encontrado no Supabase');
        return;
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Carregar resumo pessoal
      const summaryResponse = await fetch(`/api/personal/summary?user_id=${supabaseUserId}&month=9&year=2025`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        if (summaryData.summary) {
          setPersonalSummary(summaryData.summary);
        }
      }
      
      // Carregar metas
      const goalsResponse = await fetch(`/api/personal/goals?user_id=${supabaseUserId}`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData.goals || []);
      }
      
      // Carregar despesas recentes
      const expensesResponse = await fetch(`/api/personal/expenses/recent?user_id=${supabaseUserId}&limit=5`);
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setRecentExpenses(expensesData.expenses || []);
      }
      
      // Carregar receitas recentes
      const incomesResponse = await fetch(`/api/personal/incomes/recent?user_id=${supabaseUserId}&limit=4`);
      if (incomesResponse.ok) {
        const incomesData = await incomesResponse.json();
        setRecentIncomes(incomesData.incomes || []);
      }
      
    } catch (error) {
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
    
    setGoals([
      {
        id: '1',
        name: 'Reserva de Emergência',
        target_amount: 15000.00,
        current_amount: 8500.00,
        deadline: '2025-12-31',
        progress_percentage: 56.7,
        status: 'active',
        type: 'emergency_fund'
      },
      {
        id: '2',
        name: 'Viagem para Europa',
        target_amount: 8000.00,
        current_amount: 3200.00,
        deadline: '2025-07-15',
        progress_percentage: 40.0,
        status: 'active',
        type: 'vacation'
      },
      {
        id: '3',
        name: 'Novo Notebook',
        target_amount: 4500.00,
        current_amount: 2800.00,
        deadline: '2025-03-30',
        progress_percentage: 62.2,
        status: 'active',
        type: 'purchase'
      }
    ]);
    
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
        {/* Receitas/Ganhos */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {personalSummary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Salário + extras</p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {personalSummary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
              personalSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {personalSummary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {personalSummary.savingsRate.toFixed(1)}% do ganho
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Principal - Metas e Transações Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Metas Financeiras */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas Pessoais
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Suas metas financeiras pessoais</p>
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

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transações Recentes
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Últimas movimentações financeiras</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Receitas Recentes */}
              {recentIncomes.slice(0, 2).map((income) => (
                <div key={income.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{income.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(income.date).toLocaleDateString('pt-BR')} • {income.source}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +{income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {income.category}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {/* Gastos Recentes */}
              {recentExpenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      expense.is_essential ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                        {getPaymentMethodIcon(expense.payment_method)}
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
                {(personalSummary.totalIncome * 0.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Orçamento Mensal</p>
            </div>
            <div className="text-center p-4 bg-muted/30 border rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {personalSummary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Gastos Realizados</p>
            </div>
            <div className="text-center p-4 bg-muted/30 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {((personalSummary.totalIncome * 0.6) - personalSummary.totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-sm text-muted-foreground">Disponível</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}