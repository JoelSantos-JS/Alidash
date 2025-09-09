"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
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
  const { user } = useAuth();
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
      
      // Simular dados de relatórios para demonstração
      // TODO: Implementar APIs reais para relatórios pessoais
      
      // Dados mensais simulados
      const mockMonthlyData: MonthlyData[] = [
        { month: 'Jul/24', income: 5200.00, expenses: 3100.00, balance: 2100.00, savingsRate: 40.4 },
        { month: 'Ago/24', income: 5500.00, expenses: 3300.00, balance: 2200.00, savingsRate: 40.0 },
        { month: 'Set/24', income: 5300.00, expenses: 3400.00, balance: 1900.00, savingsRate: 35.8 },
        { month: 'Out/24', income: 5800.00, expenses: 3200.00, balance: 2600.00, savingsRate: 44.8 },
        { month: 'Nov/24', income: 5600.00, expenses: 3500.00, balance: 2100.00, savingsRate: 37.5 },
        { month: 'Dez/24', income: 6200.00, expenses: 3800.00, balance: 2400.00, savingsRate: 38.7 },
        { month: 'Jan/25', income: 7071.30, expenses: 1078.95, balance: 5992.35, savingsRate: 84.7 }
      ];
      
      // Categorias de receitas simuladas
      const mockIncomeCategories: CategoryData[] = [
        { category: 'salary', label: 'Salário', amount: 5500.00, percentage: 77.8, color: 'bg-blue-500' },
        { category: 'freelance', label: 'Freelance', amount: 800.00, percentage: 11.3, color: 'bg-green-500' },
        { category: 'investment', label: 'Investimentos', amount: 125.50, percentage: 1.8, color: 'bg-purple-500' },
        { category: 'rental', label: 'Aluguel', amount: 600.00, percentage: 8.5, color: 'bg-orange-500' },
        { category: 'bonus', label: 'Cashback', amount: 45.80, percentage: 0.6, color: 'bg-yellow-500' }
      ];
      
      // Categorias de despesas simuladas
      const mockExpenseCategories: CategoryData[] = [
        { category: 'food', label: 'Alimentação', amount: 350.50, percentage: 32.5, color: 'bg-green-500' },
        { category: 'utilities', label: 'Contas', amount: 180.45, percentage: 16.7, color: 'bg-orange-500' },
        { category: 'transportation', label: 'Transporte', amount: 145.50, percentage: 13.5, color: 'bg-purple-500' },
        { category: 'healthcare', label: 'Saúde', amount: 157.70, percentage: 14.6, color: 'bg-red-500' },
        { category: 'entertainment', label: 'Entretenimento', amount: 139.80, percentage: 13.0, color: 'bg-pink-500' },
        { category: 'personal_care', label: 'Cuidados', amount: 105.00, percentage: 9.7, color: 'bg-blue-500' }
      ];
      
      // Métricas calculadas
      const mockMetrics: FinancialMetrics = {
        totalIncome: mockMonthlyData.reduce((sum, m) => sum + m.income, 0),
        totalExpenses: mockMonthlyData.reduce((sum, m) => sum + m.expenses, 0),
        totalBalance: mockMonthlyData.reduce((sum, m) => sum + m.balance, 0),
        averageSavingsRate: mockMonthlyData.reduce((sum, m) => sum + m.savingsRate, 0) / mockMonthlyData.length,
        monthlyAverage: {
          income: mockMonthlyData.reduce((sum, m) => sum + m.income, 0) / mockMonthlyData.length,
          expenses: mockMonthlyData.reduce((sum, m) => sum + m.expenses, 0) / mockMonthlyData.length,
          balance: mockMonthlyData.reduce((sum, m) => sum + m.balance, 0) / mockMonthlyData.length
        },
        trends: {
          incomeGrowth: 12.5,
          expenseGrowth: -8.2,
          balanceGrowth: 28.4
        }
      };
      
      setMonthlyData(mockMonthlyData);
      setIncomeCategories(mockIncomeCategories);
      setExpenseCategories(mockExpenseCategories);
      setMetrics(mockMetrics);
      
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

  const exportReport = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada em breve.",
    });
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Pessoais</h1>
            <p className="text-muted-foreground">Análises e insights das suas finanças pessoais</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="12months">Último ano</option>
          </select>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                +{metrics.trends.incomeGrowth}% vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Total</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                {metrics.trends.expenseGrowth}% vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
              <PiggyBank className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                +{metrics.trends.balanceGrowth}% vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.averageSavingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Média do período
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos e Análises */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((month, index) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{month.month}</span>
                    <div className="flex items-center gap-4 text-sm">
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

        {/* Distribuição de Receitas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Fontes de Receita
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

        {/* Distribuição de Despesas */}
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
                  <p className="text-sm font-medium text-blue-800">Crescimento de receitas</p>
                  <p className="text-xs text-blue-600">
                    Suas receitas cresceram {metrics?.trends.incomeGrowth}% no período analisado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Oportunidade de otimização</p>
                  <p className="text-xs text-yellow-600">
                    Considere revisar gastos com alimentação, que representam 32.5% das despesas.
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
                    <span className="text-muted-foreground">Receita:</span>
                    <span className="font-medium text-green-600">
                      {metrics.monthlyAverage.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Despesas:</span>
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
                    <span className="text-muted-foreground">Receitas:</span>
                    <Badge variant="secondary" className="text-green-600">
                      +{metrics.trends.incomeGrowth}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Despesas:</span>
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
                    <span>Crescimento de receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Controle de gastos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Diversificação de receitas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}