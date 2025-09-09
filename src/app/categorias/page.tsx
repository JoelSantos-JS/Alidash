"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { format } from "date-fns";
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

import { 
  PlusCircle, 
  Search, 
  Filter,
  ArrowLeft,
  Tag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Palette,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  BookOpen,
  Gamepad2,
  Plane,
  Gift,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Wifi,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryForm } from "@/components/category/category-form";

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  description?: string;
  budget?: number;
  spent?: number;
  transactions?: number;
  createdDate: Date;
  isDefault?: boolean;
}

// Categorias padrão
const defaultCategories: Category[] = [
  // Receitas
  {
    id: "income-salary",
    name: "Salário",
    type: "income",
    color: "#10B981",
    icon: "DollarSign",
    description: "Rendimentos do trabalho principal",
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "income-freelance",
    name: "Freelance",
    type: "income",
    color: "#3B82F6",
    icon: "Briefcase",
    description: "Trabalhos extras e projetos",
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "income-investments",
    name: "Investimentos",
    type: "income",
    color: "#8B5CF6",
    icon: "TrendingUp",
    description: "Rendimentos de aplicações financeiras",
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "income-other",
    name: "Outras Receitas",
    type: "income",
    color: "#F59E0B",
    icon: "Gift",
    description: "Outras fontes de renda",
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },

  // Despesas
  {
    id: "expense-food",
    name: "Alimentação",
    type: "expense",
    color: "#EF4444",
    icon: "Utensils",
    description: "Refeições, supermercado e delivery",
    budget: 800,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-transport",
    name: "Transporte",
    type: "expense",
    color: "#F97316",
    icon: "Car",
    description: "Combustível, transporte público, Uber",
    budget: 400,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-housing",
    name: "Moradia",
    type: "expense",
    color: "#06B6D4",
    icon: "Home",
    description: "Aluguel, condomínio, IPTU",
    budget: 1200,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-health",
    name: "Saúde",
    type: "expense",
    color: "#EC4899",
    icon: "Stethoscope",
    description: "Plano de saúde, medicamentos, consultas",
    budget: 300,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-education",
    name: "Educação",
    type: "expense",
    color: "#8B5CF6",
    icon: "GraduationCap",
    description: "Cursos, livros, mensalidades",
    budget: 500,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-entertainment",
    name: "Entretenimento",
    type: "expense",
    color: "#F59E0B",
    icon: "Gamepad2",
    description: "Cinema, shows, jogos, hobbies",
    budget: 200,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-shopping",
    name: "Compras",
    type: "expense",
    color: "#10B981",
    icon: "ShoppingCart",
    description: "Roupas, eletrônicos, produtos pessoais",
    budget: 300,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  },
  {
    id: "expense-services",
    name: "Serviços",
    type: "expense",
    color: "#6B7280",
    icon: "Wifi",
    description: "Internet, telefone, streaming",
    budget: 150,
    spent: 0,
    transactions: 0,
    createdDate: new Date(),
    isDefault: true
  }
];

const iconMap: Record<string, any> = {
  DollarSign,
  Briefcase,
  TrendingUp,
  Gift,
  Utensils,
  Car,
  Home,
  Stethoscope,
  GraduationCap,
  Gamepad2,
  ShoppingCart,
  Wifi,
  Zap,
  Palette,
  Heart,
  BookOpen,
  Plane
};

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "spent" | "transactions">("name");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Carregar categorias do Supabase
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchCategories = async () => {
      try {
        console.log('🔍 Carregando categorias do Supabase para usuário:', user.uid);
        
        // Carregar categorias diretamente da API do Supabase
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
          const supabaseCategories = data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            type: c.type,
            color: c.color,
            icon: c.icon,
            budget: c.budget || 0,
            spent: c.spent || 0,
            transactions: c.transactions || 0,
            isDefault: c.is_default,
            createdDate: new Date(c.created_at)
          }));
          setCategories(supabaseCategories);
          console.log('✅ Categorias carregadas do Supabase:', supabaseCategories.length);
        } else {
          console.log('⚠️ Nenhuma categoria encontrada no Supabase');
          setCategories([]);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar categorias:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [user, authLoading]);

  // Salvar categoria no Supabase
   const saveCategory = async (category: Category, isUpdate: boolean = false) => {
     if (!user) return;
     
     try {
       const method = isUpdate ? 'PUT' : 'POST';
       
       const requestBody = isUpdate 
         ? { categoryId: category.id, updates: category }
         : { firebase_uid: user.uid, categoryData: category };
       
       const response = await fetch('/api/categories', {
         method,
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(requestBody),
       });
       
       const data = await response.json();
       
       if (!data.success) {
         throw new Error(data.error || 'Erro ao salvar categoria');
       }
       
       return data.category;
     } catch (error) {
       console.error("Erro ao salvar categoria:", error);
       toast({
         variant: 'destructive',
         title: "Erro ao Salvar",
         description: "Não foi possível salvar a categoria.",
       });
       throw error;
     }
   };

  // Filtrar e ordenar categorias
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(category => category.type === typeFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "budget":
          return (b.budget || 0) - (a.budget || 0);
        case "spent":
          return (b.spent || 0) - (a.spent || 0);
        case "transactions":
          return (b.transactions || 0) - (a.transactions || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [categories, searchTerm, typeFilter, sortBy]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const incomeCategories = categories.filter(c => c.type === 'income').length;
    const expenseCategories = categories.filter(c => c.type === 'expense').length;
    
    const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = categories.reduce((sum, c) => sum + (c.spent || 0), 0);
    const totalTransactions = categories.reduce((sum, c) => sum + (c.transactions || 0), 0);
    
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const averageBudget = expenseCategories > 0 ? totalBudget / expenseCategories : 0;
    const averageSpent = expenseCategories > 0 ? totalSpent / expenseCategories : 0;

    return {
      totalCategories,
      incomeCategories,
      expenseCategories,
      totalBudget,
      totalSpent,
      totalTransactions,
      budgetUtilization,
      averageBudget,
      averageSpent
    };
  }, [categories]);

  // Handlers
  const handleCreateCategory = async (categoryData: Omit<Category, 'id' | 'createdDate'>) => {
    setIsFormLoading(true);
    try {
      const newCategory: Category = {
        ...categoryData,
        id: Date.now().toString(),
        createdDate: new Date(),
        transactions: 0,
        spent: 0
      };
      
      const savedCategory = await saveCategory(newCategory, false);
      
      if (savedCategory) {
        const updatedCategories = [...categories, {
          ...newCategory,
          id: savedCategory.id
        }];
        setCategories(updatedCategories);
      }
      
      setIsFormOpen(false);
      
      toast({
        title: "Categoria Criada!",
        description: `Categoria "${categoryData.name}" foi adicionada.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Criar",
        description: "Não foi possível criar a categoria.",
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleEditCategory = async (categoryData: Omit<Category, 'id' | 'createdDate'>) => {
    if (!selectedCategory) return;
    
    setIsFormLoading(true);
    try {
      const updatedCategory = {
        ...selectedCategory,
        ...categoryData
      };
      
      await saveCategory(updatedCategory, true);
      
      const updatedCategories = categories.map(category => 
        category.id === selectedCategory.id 
          ? updatedCategory
          : category
      );
      
      setCategories(updatedCategories);
      setSelectedCategory(null);
      setIsFormOpen(false);
      
      toast({
        title: "Categoria Atualizada!",
        description: `Categoria "${categoryData.name}" foi atualizada.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar a categoria.",
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    // Não permitir deletar categorias padrão
    if (categoryToDelete.isDefault) {
      toast({
        variant: 'destructive',
        title: "Não é possível excluir",
        description: "Categorias padrão não podem ser excluídas.",
      });
      setCategoryToDelete(null);
      setIsDeleteDialogOpen(false);
      return;
    }
    
    try {
       const response = await fetch(`/api/categories?categoryId=${categoryToDelete.id}`, {
         method: 'DELETE',
       });
       
       const data = await response.json();
       
       if (!data.success) {
         throw new Error(data.error || 'Erro ao deletar categoria');
       }
      
      const updatedCategories = categories.filter(category => category.id !== categoryToDelete.id);
      setCategories(updatedCategories);
      setCategoryToDelete(null);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Categoria Removida!",
        description: `Categoria "${categoryToDelete.name}" foi removida.`,
      });
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast({
        variant: 'destructive',
        title: "Erro ao Deletar",
        description: "Não foi possível deletar a categoria.",
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">Organize suas receitas e despesas por categorias</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Dashboard com Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="budget">Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
                <Tag className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.incomeCategories} receitas, {stats.expenseCategories} despesas
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média: {stats.averageBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.budgetUtilization.toFixed(1)}% do orçamento
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Total de movimentações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo por Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorias de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories
                    .filter(c => c.type === 'income')
                    .map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color }}
                          >
                            {iconMap[category.icon] && React.createElement(iconMap[category.icon], { className: "h-4 w-4 text-white" })}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{category.name}</div>
                            <div className="text-xs text-muted-foreground">{category.transactions || 0} transações</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600">
                            {category.spent?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorias de Despesa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories
                    .filter(c => c.type === 'expense')
                    .map((category) => {
                      const utilization = category.budget && category.budget > 0 
                        ? ((category.spent || 0) / category.budget) * 100 
                        : 0;
                      
                      return (
                        <div key={category.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: category.color }}
                            >
                              {iconMap[category.icon] && React.createElement(iconMap[category.icon], { className: "h-4 w-4 text-white" })}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{category.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {utilization.toFixed(1)}% do orçamento
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-red-600">
                              {category.spent?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              / {category.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        Receitas
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stats.incomeCategories}</div>
                      <div className="text-xs text-muted-foreground">categorias</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        Despesas
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{stats.expenseCategories}</div>
                      <div className="text-xs text-muted-foreground">categorias</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Utilização de Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilização Geral</span>
                    <span className="text-sm font-semibold">{stats.budgetUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full transition-all duration-300", {
                        "bg-green-500": stats.budgetUtilization <= 80,
                        "bg-yellow-500": stats.budgetUtilization > 80 && stats.budgetUtilization <= 100,
                        "bg-red-500": stats.budgetUtilization > 100
                      })}
                      style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de {stats.totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Controle de Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories
                  .filter(c => c.type === 'expense' && c.budget)
                  .map((category) => {
                    const utilization = category.budget && category.budget > 0 
                      ? ((category.spent || 0) / category.budget) * 100 
                      : 0;
                    
                    return (
                      <div key={category.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: category.color }}
                            >
                              {iconMap[category.icon] && React.createElement(iconMap[category.icon], { className: "h-4 w-4 text-white" })}
                            </div>
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-muted-foreground">{category.description}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {utilization.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {category.spent?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'} / {category.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full transition-all duration-300", {
                              "bg-green-500": utilization <= 80,
                              "bg-yellow-500": utilization > 80 && utilization <= 100,
                              "bg-red-500": utilization > 100
                            })}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={typeFilter} onValueChange={(value: "all" | "income" | "expense") => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: "name" | "budget" | "spent" | "transactions") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="budget">Orçamento</SelectItem>
                  <SelectItem value="spent">Gasto</SelectItem>
                  <SelectItem value="transactions">Transações</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setSortBy('name');
                }}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {filteredCategories.length} de {categories.length} categorias
            </span>
            {filteredCategories.length !== categories.length && (
              <Badge variant="outline" className="text-xs">
                Filtrado
              </Badge>
            )}
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const utilization = category.budget && category.budget > 0 
                ? ((category.spent || 0) / category.budget) * 100 
                : 0;
              
              return (
                <Card key={category.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          {iconMap[category.icon] && React.createElement(iconMap[category.icon], { className: "h-5 w-5 text-white" })}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Transações</p>
                        <p className="font-semibold">{category.transactions || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className={cn("font-semibold", category.type === 'income' ? "text-green-600" : "text-red-600")}>
                          {(category.spent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                    
                    {category.budget && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Orçamento</span>
                          <span className="font-semibold">
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full transition-all duration-300", {
                              "bg-green-500": utilization <= 80,
                              "bg-yellow-500": utilization > 80 && utilization <= 100,
                              "bg-red-500": utilization > 100
                            })}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{category.spent?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</span>
                          <span>{category.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {!category.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Você não possui categorias cadastradas."}
              </p>
              {!searchTerm && typeFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Primeira Categoria
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">
            {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold">
                {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? "Atualize as informações da categoria selecionada."
                  : "Crie uma nova categoria para organizar suas receitas e despesas."
                }
              </p>
            </div>
            
            <CategoryForm
              category={selectedCategory}
              onSubmit={selectedCategory ? handleEditCategory : handleCreateCategory}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedCategory(null);
              }}
              isLoading={isFormLoading}
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
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}