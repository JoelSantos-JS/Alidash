"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Search,
  Filter,
  Tag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  Gamepad2,
  Shirt,
  Zap,
  Shield,
  Gift,
  PiggyBank,
  Briefcase,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PersonalCategoryForm } from "@/components/category/personal-category-form";

// Mapeamento de ícones para componentes React
const ICON_MAP: Record<string, any> = {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  Gamepad2,
  Shirt,
  Zap,
  Shield,
  Gift,
  PiggyBank,
  Briefcase,
  User,
  Tag
};

interface CategoryStats {
  category: string;
  label: string;
  icon: any;
  color: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  percentage: number;
}

// Categorias padrão baseadas no SQL - serão usadas como fallback
const DEFAULT_CATEGORIES = {
  // Receitas
  salary: { label: 'Salário', icon: Briefcase, color: '#3B82F6', type: 'income' },
  freelance: { label: 'Freelance', icon: User, color: '#10B981', type: 'income' },
  investment: { label: 'Investimentos', icon: TrendingUp, color: '#8B5CF6', type: 'income' },
  rental: { label: 'Aluguel Recebido', icon: Home, color: '#F59E0B', type: 'income' },
  bonus: { label: 'Bônus', icon: Gift, color: '#EAB308', type: 'income' },
  
  // Despesas
  housing: { label: 'Moradia', icon: Home, color: '#3B82F6', type: 'expense' },
  food: { label: 'Alimentação', icon: Utensils, color: '#10B981', type: 'expense' },
  transportation: { label: 'Transporte', icon: Car, color: '#8B5CF6', type: 'expense' },
  healthcare: { label: 'Saúde', icon: Heart, color: '#EF4444', type: 'expense' },
  education: { label: 'Educação', icon: GraduationCap, color: '#6366F1', type: 'expense' },
  entertainment: { label: 'Entretenimento', icon: Gamepad2, color: '#EC4899', type: 'expense' },
  clothing: { label: 'Vestuário', icon: Shirt, color: '#EAB308', type: 'expense' },
  utilities: { label: 'Utilidades', icon: Zap, color: '#F97316', type: 'expense' },
  insurance: { label: 'Seguros', icon: Shield, color: '#6B7280', type: 'expense' },
  savings: { label: 'Poupança', icon: PiggyBank, color: '#14B8A6', type: 'expense' }
};

export default function PersonalCategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryStats | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryStats | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartCategory, setChartCategory] = useState<CategoryStats | null>(null);

  const handleCreateCategory = async (categoryData: any) => {
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Criar categoria personalizada via API
      const response = await fetch('/api/personal/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: supabaseUserId,
          ...categoryData
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar categoria');
      }
      
      toast({
        title: "Categoria Criada!",
        description: `Categoria "${categoryData.name}" foi criada com sucesso.`,
      });
      
      setIsFormOpen(false);
      // Recarregar dados
      loadCategoryStats();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Criar",
        description: error instanceof Error ? error.message : "Não foi possível criar a categoria.",
      });
    }
  };

  const handleShowChart = async (category: CategoryStats) => {
    setChartCategory(category);
    setIsChartModalOpen(true);
    
    // Buscar transações específicas da categoria
    try {
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) return;
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar receitas e despesas da categoria específica
      const [incomesResponse, expensesResponse] = await Promise.all([
        fetch(`/api/personal/incomes?user_id=${supabaseUserId}&category=${category.category}&limit=50`),
        fetch(`/api/personal/expenses?user_id=${supabaseUserId}&category=${category.category}&limit=50`)
      ]);
      
      const transactions = [];
      
      if (incomesResponse.ok) {
        const incomesResult = await incomesResponse.json();
        const incomes = incomesResult.incomes || [];
        transactions.push(...incomes.map((income: any) => ({
          ...income,
          type: 'income',
          amount: income.amount
        })));
      }
      
      if (expensesResponse.ok) {
        const expensesResult = await expensesResponse.json();
        const expenses = expensesResult.expenses || [];
        transactions.push(...expenses.map((expense: any) => ({
          ...expense,
          type: 'expense',
          amount: expense.amount
        })));
      }
      
      // Ordenar por data (mais recente primeiro)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setChartCategory(prev => prev ? { ...prev, transactions } : null);
    } catch (error) {
      console.error('Erro ao buscar transações da categoria:', error);
    }
  };

  const handleEditCategory = (category: CategoryStats) => {
    setSelectedCategory(category);
    setIsEditFormOpen(true);
  };

  const handleDeleteCategory = (category: CategoryStats) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || !user) return;
    
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Deletar categoria via API
      const response = await fetch(`/api/personal/categories?id=${categoryToDelete.category}&user_id=${supabaseUserId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar categoria');
      }
      
      toast({
        title: "Categoria Deletada!",
        description: `Categoria "${categoryToDelete.label}" foi removida com sucesso.`,
      });
      
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      // Recarregar dados
      loadCategoryStats();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Deletar",
        description: error instanceof Error ? error.message : "Não foi possível deletar a categoria.",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadCategoryStats();
    }
  }, [user]);

  const loadCategoryStats = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar receitas, despesas e categorias personalizadas em paralelo
      const [incomesResponse, expensesResponse, customCategoriesResponse] = await Promise.all([
        fetch(`/api/personal/incomes?user_id=${supabaseUserId}&limit=1000`),
        fetch(`/api/personal/expenses?user_id=${supabaseUserId}&limit=1000`),
        fetch(`/api/personal/categories?user_id=${supabaseUserId}`)
      ]);
      
      // Processar categorias personalizadas
      const customCategories: Record<string, any> = {};
      if (customCategoriesResponse.ok) {
        const customCategoriesResult = await customCategoriesResponse.json();
        const categories = customCategoriesResult.categories || [];
        
        categories.forEach((cat: any) => {
          // Usar apenas o nome da categoria personalizada como chave única
          customCategories[cat.name] = {
            label: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: cat.type,
            category: cat.category,
            is_essential: cat.is_essential,
            budget_limit: cat.budget_limit
          };
        });
      }
      
      const categoryStats: Record<string, CategoryStats> = {};
      
      // Processar receitas
      if (incomesResponse.ok) {
        const incomesResult = await incomesResponse.json();
        const incomes = incomesResult.incomes || [];
        
        incomes.forEach((income: any) => {
          const category = income.category;
          if (!categoryStats[category]) {
            // Primeiro tentar categorias personalizadas, depois padrão
            const categoryInfo = customCategories[category] || DEFAULT_CATEGORIES[category as keyof typeof DEFAULT_CATEGORIES];
            if (categoryInfo) {
              categoryStats[category] = {
                category,
                label: categoryInfo.label,
                icon: categoryInfo.icon,
                color: categoryInfo.color,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0,
                transactionCount: 0,
                percentage: 0
              };
            }
          }
          
          if (categoryStats[category]) {
            categoryStats[category].totalIncome += income.amount;
            categoryStats[category].transactionCount += 1;
          }
        });
      }
      
      // Processar despesas
      if (expensesResponse.ok) {
        const expensesResult = await expensesResponse.json();
        const expenses = expensesResult.expenses || [];
        
        expenses.forEach((expense: any) => {
          const category = expense.category;
          if (!categoryStats[category]) {
            // Primeiro tentar categorias personalizadas, depois padrão
            const categoryInfo = customCategories[category] || DEFAULT_CATEGORIES[category as keyof typeof DEFAULT_CATEGORIES];
            if (categoryInfo) {
              categoryStats[category] = {
                category,
                label: categoryInfo.label,
                icon: categoryInfo.icon,
                color: categoryInfo.color,
                totalIncome: 0,
                totalExpenses: 0,
                balance: 0,
                transactionCount: 0,
                percentage: 0
              };
            }
          }
          
          if (categoryStats[category]) {
            categoryStats[category].totalExpenses += expense.amount;
            categoryStats[category].transactionCount += 1;
          }
        });
      }
      
      // Adicionar categorias personalizadas que não têm transações ainda
      Object.entries(customCategories).forEach(([categoryName, categoryInfo]) => {
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = {
            category: categoryName,
            label: categoryInfo.label,
            icon: categoryInfo.icon,
            color: categoryInfo.color,
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            transactionCount: 0,
            percentage: 0
          };
        }
      });
      
      // Calcular saldos e percentuais
      const totalAmount = Object.values(categoryStats).reduce((sum, cat) => 
        sum + cat.totalIncome + cat.totalExpenses, 0
      );
      
      Object.values(categoryStats).forEach(cat => {
        cat.balance = cat.totalIncome - cat.totalExpenses;
        cat.percentage = totalAmount > 0 ? ((cat.totalIncome + cat.totalExpenses) / totalAmount) * 100 : 0;
      });
      
      // Ordenar por valor total (receitas + despesas)
      const sortedCategories = Object.values(categoryStats)
        .sort((a, b) => (b.totalIncome + b.totalExpenses) - (a.totalIncome + a.totalExpenses));
      
      setCategories(sortedCategories);
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas de categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas das categorias.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || 
                       (selectedType === 'income' && category.totalIncome > 0) ||
                       (selectedType === 'expense' && category.totalExpenses > 0);
    return matchesSearch && matchesType;
  });

  const totalIncome = categories.reduce((sum, cat) => sum + cat.totalIncome, 0);
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.totalExpenses, 0);
  const totalBalance = totalIncome - totalExpenses;
  const activeCategories = categories.filter(cat => cat.transactionCount > 0).length;

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
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
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
            <h1 className="text-2xl font-bold text-foreground">Categorias Pessoais</h1>
            <p className="text-muted-foreground">Análise de gastos e ganhos por categoria</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className={`h-4 w-4 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBalance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              Com movimentação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType 
                  ? 'Nenhuma categoria encontrada com os filtros aplicados.' 
                  : 'Nenhuma movimentação encontrada nas categorias.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const IconComponent = ICON_MAP[category.icon] || Tag;
                const hasIncome = category.totalIncome > 0;
                const hasExpense = category.totalExpenses > 0;
                
                return (
                  <div key={category.category} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{category.label}</h3>
                            {hasIncome && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">
                                Receita
                              </Badge>
                            )}
                            {hasExpense && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-600">
                                Despesa
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {category.transactionCount} transação(ões) • {category.percentage.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleShowChart(category)}
                          title="Ver gráfico detalhado"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          title="Editar categoria"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Valores por tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      {hasIncome && (
                        <div className="text-center p-3 bg-muted/30 border rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            +{category.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <p className="text-xs text-muted-foreground">Receitas</p>
                        </div>
                      )}
                      
                      {hasExpense && (
                        <div className="text-center p-3 bg-muted/30 border rounded-lg">
                          <div className="text-lg font-bold text-red-600">
                            -{category.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <p className="text-xs text-muted-foreground">Despesas</p>
                        </div>
                      )}
                      
                      <div className="text-center p-3 bg-muted/30 border rounded-lg">
                        <div className={`text-lg font-bold ${category.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {category.balance >= 0 ? '+' : ''}{category.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <p className="text-xs text-muted-foreground">Saldo</p>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Participação no total</span>
                        <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nova Categoria Pessoal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
            {/* Header com Menu de Navegação */}
            <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Nova Categoria Pessoal
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Crie uma nova categoria para organizar suas finanças pessoais.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
              
              {/* Menu de Navegação */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Pessoal
                </span>
                <span>›</span>
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Categorias
                </span>
                <span>›</span>
                <span className="text-foreground font-medium">
                  Nova Categoria
                </span>
              </div>
            </div>
            
            <CardContent className="p-6 pt-0">
               <PersonalCategoryForm
                 onSubmit={handleCreateCategory}
                 onCancel={() => setIsFormOpen(false)}
                 isLoading={false}
               />
             </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Edição */}
      {isEditFormOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Categorias
                </span>
                <span>›</span>
                <span className="text-foreground font-medium">
                  Editar {selectedCategory.label}
                </span>
              </div>
            </div>
            
            <CardContent className="p-6 pt-0">
               <PersonalCategoryForm
                 category={{
                   name: selectedCategory.label,
                   type: selectedCategory.totalIncome > 0 ? 'income' : 'expense',
                   category: selectedCategory.category,
                   description: '',
                   color: selectedCategory.color,
                   icon: selectedCategory.icon
                 }}
                 onSubmit={async (data) => {
                    try {
                      // Buscar usuário Supabase
                      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
                      if (!userResponse.ok) {
                        throw new Error('Usuário não encontrado');
                      }
                      
                      const userResult = await userResponse.json();
                      const supabaseUserId = userResult.user.id;
                      
                      // Atualizar categoria via API
                      const response = await fetch('/api/personal/categories', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          id: selectedCategory.category,
                          user_id: supabaseUserId,
                          ...data
                        })
                      });
                      
                      const result = await response.json();
                      
                      if (!result.success) {
                        throw new Error(result.error || 'Erro ao atualizar categoria');
                      }
                      
                      toast({
                        title: "Categoria Atualizada!",
                        description: `Categoria "${data.name}" foi atualizada com sucesso.`,
                      });
                      
                      setIsEditFormOpen(false);
                      setSelectedCategory(null);
                      // Recarregar dados
                      loadCategoryStats();
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: "Erro ao Atualizar",
                        description: error instanceof Error ? error.message : "Não foi possível atualizar a categoria.",
                      });
                    }
                  }}
                 onCancel={() => setIsEditFormOpen(false)}
                 isLoading={false}
               />
             </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.label}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>

       {/* Modal de Gráfico */}
       {isChartModalOpen && chartCategory && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <BarChart3 className="h-4 w-4" />
                   Gráficos
                 </span>
                 <span>›</span>
                 <span className="text-foreground font-medium">
                   {chartCategory.label}
                 </span>
               </div>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => setIsChartModalOpen(false)}
               >
                 ✕
               </Button>
             </div>
             
             <CardContent className="p-6">
               <div className="space-y-6">
                 {/* Resumo da Categoria */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {chartCategory.totalIncome > 0 && (
                     <div className="text-center p-4 bg-muted/30 border rounded-lg">
                       <div className="text-2xl font-bold text-green-600">
                         +{chartCategory.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </div>
                       <p className="text-sm text-muted-foreground">Total de Receitas</p>
                     </div>
                   )}
                   
                   {chartCategory.totalExpenses > 0 && (
                     <div className="text-center p-4 bg-muted/30 border rounded-lg">
                       <div className="text-2xl font-bold text-red-600">
                         -{chartCategory.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </div>
                       <p className="text-sm text-muted-foreground">Total de Despesas</p>
                     </div>
                   )}
                   
                   <div className="text-center p-4 bg-muted/30 border rounded-lg">
                     <div className={`text-2xl font-bold ${chartCategory.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       {chartCategory.balance >= 0 ? '+' : ''}{chartCategory.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                     </div>
                     <p className="text-sm text-muted-foreground">Saldo</p>
                   </div>
                 </div>

                 {/* Estatísticas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Estatísticas</h3>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center p-3 bg-muted/30 border rounded">
                         <span className="text-sm text-muted-foreground">Transações</span>
                         <span className="font-medium">{chartCategory.transactionCount}</span>
                       </div>
                       <div className="flex justify-between items-center p-3 bg-muted/30 border rounded">
                         <span className="text-sm text-muted-foreground">Participação no Total</span>
                         <span className="font-medium">{chartCategory.percentage.toFixed(1)}%</span>
                       </div>
                       <div className="flex justify-between items-center p-3 bg-muted/30 border rounded">
                         <span className="text-sm text-muted-foreground">Tipo</span>
                         <div className="flex gap-2">
                           {chartCategory.totalIncome > 0 && (
                             <Badge variant="secondary" className="text-xs bg-green-100 text-green-600">
                               Receita
                             </Badge>
                           )}
                           {chartCategory.totalExpenses > 0 && (
                             <Badge variant="secondary" className="text-xs bg-red-100 text-red-600">
                               Despesa
                             </Badge>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Progresso</h3>
                     <div className="space-y-3">
                       <div>
                         <div className="flex justify-between text-sm mb-2">
                           <span>Participação no Total</span>
                           <span>{chartCategory.percentage.toFixed(1)}%</span>
                         </div>
                         <Progress value={chartCategory.percentage} className="h-2" />
                       </div>
                       
                       {chartCategory.totalExpenses > 0 && chartCategory.totalIncome > 0 && (
                         <div>
                           <div className="flex justify-between text-sm mb-2">
                             <span>Taxa de Receita vs Despesa</span>
                             <span>{((chartCategory.totalIncome / (chartCategory.totalIncome + chartCategory.totalExpenses)) * 100).toFixed(1)}%</span>
                           </div>
                           <Progress 
                             value={(chartCategory.totalIncome / (chartCategory.totalIncome + chartCategory.totalExpenses)) * 100} 
                             className="h-2" 
                           />
                         </div>
                       )}
                     </div>
                   </div>
                 </div>

                 {/* Lista de Transações */}
                  {chartCategory.transactions && chartCategory.transactions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Transações Recentes</h3>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {chartCategory.transactions.map((transaction: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{transaction.description || 'Sem descrição'}</span>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    transaction.type === 'income' 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-red-100 text-red-600'
                                  }`}
                                >
                                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                                {transaction.payment_method && (
                                  <span className="ml-2">• {transaction.payment_method}</span>
                                )}
                              </div>
                            </div>
                            <div className={`text-lg font-bold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {Math.abs(transaction.amount).toLocaleString('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {chartCategory.transactions.length >= 50 && (
                        <div className="text-center text-sm text-muted-foreground">
                          Mostrando as 50 transações mais recentes
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center text-sm text-muted-foreground">
                    💡 Gráficos mais detalhados serão implementados em futuras versões
                  </div>
               </div>
             </CardContent>
           </Card>
         </div>
       )}
    </div>
  );
}