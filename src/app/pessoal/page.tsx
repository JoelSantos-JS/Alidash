"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  Calendar,
  Plus,
  ArrowLeft,
  Building
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

export default function PersonalDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PersonalSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    savingsRate: 0,
    essentialExpenses: 0,
    nonEssentialExpenses: 0
  });
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (authLoading || !user) return;
    
    loadPersonalData();
  }, [user, authLoading]);

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) {
        console.log('⚠️ Usuário não encontrado no Supabase');
        return;
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Carregar dados pessoais em paralelo
      const [summaryResult, goalsResult] = await Promise.allSettled([
        fetch(`/api/personal/summary?user_id=${supabaseUserId}&month=${currentMonth}&year=${currentYear}`)
          .then(res => res.ok ? res.json() : { summary: null }),
        fetch(`/api/personal/goals?user_id=${supabaseUserId}`)
          .then(res => res.ok ? res.json() : { goals: [] })
      ]);
      
      // Processar resultados
      if (summaryResult.status === 'fulfilled' && summaryResult.value.summary) {
        setSummary(summaryResult.value.summary);
      }
      
      if (goalsResult.status === 'fulfilled' && goalsResult.value.goals) {
        setGoals(goalsResult.value.goals);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados pessoais:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar o dashboard pessoal.</p>
          <Link href="/login">
            <Button>Fazer Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Pessoal</h1>
                <p className="text-muted-foreground">
                  {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/?mode=business">
                <Button variant="outline" size="sm">
                  <Building className="h-4 w-4 mr-2" />
                  Voltar ao Empresarial
                </Button>
              </Link>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {/* Loading Skeletons */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Receitas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              {/* Gastos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {summary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              {/* Saldo */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>

              {/* Taxa de Poupança */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
                  <PiggyBank className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.savingsRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </CardContent>
              </Card>
            </div>

            {/* Metas Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metas Financeiras
                </CardTitle>
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
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de{' '}
                              {goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                              {goal.progress_percentage.toFixed(0)}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(goal.deadline), 'dd/MM/yyyy')}
                            </p>
                          </div>
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

            {/* Gastos Essenciais vs Não Essenciais */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Gastos Essenciais</span>
                        <span className="text-sm text-muted-foreground">
                          {summary.essentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <Progress 
                        value={summary.totalExpenses > 0 ? (summary.essentialExpenses / summary.totalExpenses) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Gastos Não Essenciais</span>
                        <span className="text-sm text-muted-foreground">
                          {summary.nonEssentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <Progress 
                        value={summary.totalExpenses > 0 ? (summary.nonEssentialExpenses / summary.totalExpenses) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de Receitas:</span>
                      <span className="font-medium text-green-600">
                        {summary.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total de Gastos:</span>
                      <span className="font-medium text-red-600">
                        {summary.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between">
                      <span className="font-medium">Saldo Final:</span>
                      <span className={`font-bold ${
                        summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {summary.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}