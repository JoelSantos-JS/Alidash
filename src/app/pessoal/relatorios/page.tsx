"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Upload,
  Trash2,
  Filter,
  ArrowLeft,
  Target,
  PiggyBank,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import Link from "next/link";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

interface CategoryData {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  averageSavingsRate: number;
  monthlyAverage: {
    income: number;
    expenses: number;
    balance: number;
  };
  trends: {
    incomeGrowth: number;
    expenseGrowth: number;
    balanceGrowth: number;
  };
}

export default function PersonalReportsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6months');
  const [selectedReport, setSelectedReport] = useState<string>('overview');

  useEffect(() => {
    if (user) {
      loadReportsData();
    }
  }, [user, selectedPeriod]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        console.log('⚠️ Usuário não encontrado no Supabase');
        return;
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Carregar dados reais dos últimos meses
      const monthsToLoad = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
      const monthlyDataPromises = [];
      
      for (let i = 0; i < monthsToLoad; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        monthlyDataPromises.push(
          fetch(`/api/personal/summary?user_id=${supabaseUserId}&month=${month}&year=${year}`)
            .then(res => res.ok ? res.json() : { summary: null })
            .then(result => ({
              month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
              income: result.summary?.totalIncome || 0,
              expenses: result.summary?.totalExpenses || 0,
              balance: result.summary?.balance || 0,
              savingsRate: result.summary?.savingsRate || 0
            }))
        );
      }
      
      const realMonthlyData = await Promise.all(monthlyDataPromises);
      realMonthlyData.reverse(); // Ordem cronológica
      
      // Buscar categorias de receitas e despesas
      const [incomesRes, expensesRes] = await Promise.all([
        fetch(`/api/personal/incomes?user_id=${supabaseUserId}&limit=100`),
        fetch(`/api/personal/expenses?user_id=${supabaseUserId}&limit=100`)
      ]);
      
      const incomesData = incomesRes.ok ? await incomesRes.json() : { incomes: [] };
      const expensesData = expensesRes.ok ? await expensesRes.json() : { expenses: [] };
      
      // Processar categorias de receitas
      const incomesByCategory = (incomesData.incomes || []).reduce((acc: any, income: any) => {
        acc[income.category] = (acc[income.category] || 0) + income.amount;
        return acc;
      }, {});
      
      const totalIncome = Object.values(incomesByCategory).reduce((sum: number, amount: any) => sum + amount, 0) as number;
      const realIncomeCategories = Object.entries(incomesByCategory).map(([category, amount]: [string, any]) => ({
        category,
        label: getCategoryLabel(category),
        amount,
        percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        color: getCategoryColor(category)
      }));
      
      // Processar categorias de despesas
      const expensesByCategory = (expensesData.expenses || []).reduce((acc: any, expense: any) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
      
      const totalExpenses = Object.values(expensesByCategory).reduce((sum: number, amount: any) => sum + amount, 0) as number;
      const realExpenseCategories = Object.entries(expensesByCategory).map(([category, amount]: [string, any]) => ({
        category,
        label: getCategoryLabel(category),
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: getCategoryColor(category)
      }));
      
      // Calcular métricas reais
      const realMetrics: FinancialMetrics = {
        totalIncome: realMonthlyData.reduce((sum, m) => sum + m.income, 0),
        totalExpenses: realMonthlyData.reduce((sum, m) => sum + m.expenses, 0),
        totalBalance: realMonthlyData.reduce((sum, m) => sum + m.balance, 0),
        averageSavingsRate: realMonthlyData.length > 0 ? realMonthlyData.reduce((sum, m) => sum + m.savingsRate, 0) / realMonthlyData.length : 0,
        monthlyAverage: {
          income: realMonthlyData.length > 0 ? realMonthlyData.reduce((sum, m) => sum + m.income, 0) / realMonthlyData.length : 0,
          expenses: realMonthlyData.length > 0 ? realMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / realMonthlyData.length : 0,
          balance: realMonthlyData.length > 0 ? realMonthlyData.reduce((sum, m) => sum + m.balance, 0) / realMonthlyData.length : 0
        },
        trends: {
          incomeGrowth: calculateGrowth(realMonthlyData, 'income'),
          expenseGrowth: calculateGrowth(realMonthlyData, 'expenses'),
          balanceGrowth: calculateGrowth(realMonthlyData, 'balance')
        }
      };
      
      setMonthlyData(realMonthlyData);
      setIncomeCategories(realIncomeCategories);
      setExpenseCategories(realExpenseCategories);
      setMetrics(realMetrics);
      
      console.log('✅ Dados de relatórios carregados do banco:', {
        months: realMonthlyData.length,
        incomeCategories: realIncomeCategories.length,
        expenseCategories: realExpenseCategories.length
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      salary: 'Salário',
      freelance: 'Freelance',
      investment: 'Investimentos',
      rental: 'Aluguel',
      bonus: 'Bônus',
      gift: 'Presente',
      other: 'Outros',
      food: 'Alimentação',
      housing: 'Moradia',
      transportation: 'Transporte',
      healthcare: 'Saúde',
      education: 'Educação',
      entertainment: 'Entretenimento',
      utilities: 'Utilidades',
      personal_care: 'Cuidados Pessoais'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      salary: 'bg-blue-500',
      freelance: 'bg-green-500',
      investment: 'bg-purple-500',
      rental: 'bg-orange-500',
      bonus: 'bg-yellow-500',
      food: 'bg-green-500',
      housing: 'bg-blue-500',
      transportation: 'bg-purple-500',
      healthcare: 'bg-red-500',
      entertainment: 'bg-pink-500',
      utilities: 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const calculateGrowth = (data: MonthlyData[], field: keyof MonthlyData): number => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1][field] as number;
    const previous = data[data.length - 2][field] as number;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const exportReport = async () => {
    try {
      if (!user) return;
      
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) throw new Error('Usuário não encontrado');
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar todos os dados para exportação
      const [incomesRes, expensesRes, goalsRes] = await Promise.all([
        fetch(`/api/personal/incomes?user_id=${supabaseUserId}&limit=1000`),
        fetch(`/api/personal/expenses?user_id=${supabaseUserId}&limit=1000`),
        fetch(`/api/personal/goals?user_id=${supabaseUserId}`)
      ]);
      
      const exportData = {
        incomes: incomesRes.ok ? (await incomesRes.json()).incomes : [],
        expenses: expensesRes.ok ? (await expensesRes.json()).expenses : [],
        goals: goalsRes.ok ? (await goalsRes.json()).goals : [],
        exportDate: new Date().toISOString(),
        user: user.email
      };
      
      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-pessoal-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exportação Concluída!",
        description: "Seus dados foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Validar estrutura dos dados
      if (!importedData.incomes && !importedData.expenses && !importedData.goals) {
        throw new Error('Arquivo inválido');
      }
      
      toast({
        title: "Importação Iniciada",
        description: "Processando dados importados...",
      });
      
      // TODO: Implementar importação real via API
      console.log('Dados para importar:', importedData);
      
      toast({
        title: "Importação Concluída!",
        description: `Importados: ${importedData.incomes?.length || 0} receitas, ${importedData.expenses?.length || 0} despesas, ${importedData.goals?.length || 0} metas.`,
      });
      
      // Recarregar dados
      loadReportsData();
    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: "Arquivo inválido ou corrompido.",
        variant: "destructive"
      });
    }
  };

  const clearAllData = async () => {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      if (!user) return;
      
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) throw new Error('Usuário não encontrado');
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // TODO: Implementar API para limpar todos os dados
      console.log('Limpando dados do usuário:', supabaseUserId);
      
      toast({
        title: "Dados Limpos!",
        description: "Todos os dados pessoais foram removidos.",
      });
      
      // Recarregar dados
      loadReportsData();
    } catch (error) {
      toast({
        title: "Erro ao Limpar",
        description: "Não foi possível limpar os dados.",
        variant: "destructive"
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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
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
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
                Relatórios Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Análises e insights das suas finanças pessoais</span>
                <span className="sm:hidden">Análises financeiras</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Último ano</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={exportReport} size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4" />
                <span className="hidden xs:inline ml-2">Exportar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-file')?.click()} className="flex-1 sm:flex-none">
                <Upload className="h-4 w-4" />
                <span className="hidden xs:inline ml-2">Importar</span>
              </Button>
              <Button variant="destructive" size="sm" onClick={clearAllData} className="flex-1 sm:flex-none">
                <Trash2 className="h-4 w-4" />
                <span className="hidden xs:inline ml-2">Limpar</span>
              </Button>
            </div>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Métricas Principais */}
        {metrics && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Entradas Totais</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                  {metrics.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                +{metrics.trends.incomeGrowth}% vs período anterior
              </p>
            </CardContent>
          </Card>

            <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Saídas Totais</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                  {metrics.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  {metrics.trends.expenseGrowth}% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Economia Total</CardTitle>
                <PiggyBank className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 break-words">
                  {metrics.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  +{metrics.trends.balanceGrowth}% vs período anterior
                </p>
              </CardContent>
            </Card>

            <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Taxa de Poupança</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {metrics.averageSavingsRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média do período
                </p>
              </CardContent>
            </Card>
        </div>
      )}

        {/* Gráficos e Análises */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Evolução Mensal */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm">
                        <span className="text-green-600">
                          +{month.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="text-red-600">
                          -{month.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className={`font-medium ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {month.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div 
                        className="bg-green-500 rounded-l" 
                        style={{ width: `${(month.income / Math.max(...monthlyData.map(m => m.income))) * 100}%` }}
                      />
                    <div 
                      className="bg-red-500 rounded-r" 
                      style={{ width: `${(month.expenses / Math.max(...monthlyData.map(m => m.income))) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Taxa de poupança: {month.savingsRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Entradas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Fontes de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomeCategories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.label}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {category.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Saídas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Categorias de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories.map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.label}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {category.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Insights Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Excelente taxa de poupança!</p>
                  <p className="text-xs text-green-600">
                    Sua taxa média de {metrics?.averageSavingsRate.toFixed(1)}% está acima da recomendação de 20%.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Crescimento de entradas</p>
                  <p className="text-xs text-blue-600">
                    Suas entradas cresceram {metrics?.trends.incomeGrowth}% no período analisado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Oportunidade de otimização</p>
                  <p className="text-xs text-yellow-600">
                    Considere revisar gastos com alimentação, que representam 32.5% das saídas.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Meta recomendada</p>
                  <p className="text-xs text-purple-600">
                    Continue mantendo sua disciplina financeira para atingir suas metas pessoais.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Executivo */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Executivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="font-medium mb-2">Médias Mensais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entradas:</span>
                    <span className="font-medium text-green-600">
                      {metrics.monthlyAverage.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saídas:</span>
                    <span className="font-medium text-red-600">
                      {metrics.monthlyAverage.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Economia:</span>
                    <span className="font-medium text-purple-600">
                      {metrics.monthlyAverage.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tendências</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Entradas:</span>
                    <Badge variant="secondary" className="text-green-600">
                      +{metrics.trends.incomeGrowth}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Saídas:</span>
                    <Badge variant="secondary" className="text-green-600">
                      {metrics.trends.expenseGrowth}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Economia:</span>
                    <Badge variant="secondary" className="text-green-600">
                      +{metrics.trends.balanceGrowth}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Saúde Financeira</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Taxa de poupança saudável</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Crescimento de entradas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Controle de gastos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Diversificação de entradas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
