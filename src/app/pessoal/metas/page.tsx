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
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Home,
  Car,
  GraduationCap,
  Heart,
  Plane,
  PiggyBank,
  CreditCard,
  Building,
  Gift,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PersonalGoalForm } from "@/components/goals/personal-goal-form";

interface PersonalGoal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  target_date: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  monthly_contribution?: number;
  notes?: string;
  created_at: string;
}

const GOAL_CATEGORIES = {
  emergency_fund: { label: 'Reserva de Emergência', icon: PiggyBank, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  house: { label: 'Casa Própria', icon: Home, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  car: { label: 'Veículo', icon: Car, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
  education: { label: 'Educação', icon: GraduationCap, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  health: { label: 'Saúde', icon: Heart, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
  travel: { label: 'Viagem', icon: Plane, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  investment: { label: 'Investimento', icon: TrendingUp, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  retirement: { label: 'Aposentadoria', icon: Building, color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800' },
  debt_payoff: { label: 'Quitação de Dívidas', icon: CreditCard, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
  gift: { label: 'Presente/Evento', icon: Gift, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  other: { label: 'Outros', icon: Target, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800' }
};

const GOAL_STATUS = {
  active: { label: 'Ativa', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', variant: 'default' as const },
  completed: { label: 'Concluída', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', variant: 'secondary' as const },
  paused: { label: 'Pausada', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', variant: 'outline' as const },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', variant: 'destructive' as const }
};

const PRIORITY_LEVELS = {
  high: { label: 'Alta', color: 'text-red-600 dark:text-red-400', variant: 'destructive' as const },
  medium: { label: 'Média', color: 'text-yellow-600 dark:text-yellow-400', variant: 'outline' as const },
  low: { label: 'Baixa', color: 'text-green-600 dark:text-green-400', variant: 'secondary' as const }
};

export default function PersonalGoalsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PersonalGoal | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<PersonalGoal | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PersonalGoal>>({});
  const [isEditLoading, setIsEditLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar metas pessoais da API real
      const goalsResponse = await fetch(`/api/personal/goals?user_id=${supabaseUserId}`);
      if (!goalsResponse.ok) {
        throw new Error('Erro ao buscar metas pessoais');
      }
      
      const goalsResult = await goalsResponse.json();
      const apiGoals = goalsResult.goals || [];
      
      // Converter formato da API para o formato esperado pelo componente
      const formattedGoals: PersonalGoal[] = apiGoals.map((goal: any) => ({
        id: goal.id,
        title: goal.name,
        description: goal.description,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount || 0,
        category: goal.type, // API usa 'type', componente espera 'category'
        priority: goal.priority || 'medium',
        target_date: goal.deadline,
        status: goal.status || 'active',
        monthly_contribution: goal.monthly_contribution,
        notes: goal.notes,
        created_at: goal.created_at
      }));
      
      console.log('✅ Metas carregadas da API:', formattedGoals.length);
      setGoals(formattedGoals);
      
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas pessoais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewGoal = (goal: PersonalGoal) => {
    setSelectedGoal(goal);
    setIsViewModalOpen(true);
  };

  const handleEditGoal = (goal: PersonalGoal) => {
    setSelectedGoal(goal);
    setEditFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      category: goal.category,
      priority: goal.priority,
      target_date: goal.target_date,
      status: goal.status,
      monthly_contribution: goal.monthly_contribution || 0,
      notes: goal.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = async () => {
     if (!selectedGoal || !user) return;
     
     try {
       setIsEditLoading(true);
       
       // Buscar usuário Supabase para obter o ID
       const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.id}&email=${user?.email}`);
       if (!userResponse.ok) {
         throw new Error('Usuário não encontrado');
       }
       
       const userResult = await userResponse.json();
       const supabaseUserId = userResult.user.id;
       
       // Atualizar via API real
       const updateResponse = await fetch(`/api/personal/goals`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           id: selectedGoal.id,
           user_id: supabaseUserId,
           title: editFormData.title,
           description: editFormData.description,
           target_amount: editFormData.target_amount,
           current_amount: editFormData.current_amount,
           category: editFormData.category,
           priority: editFormData.priority,
           target_date: editFormData.target_date,
           status: editFormData.status,
           monthly_contribution: editFormData.monthly_contribution,
           notes: editFormData.notes
         })
       });
       
       if (!updateResponse.ok) {
         const errorResult = await updateResponse.json();
         throw new Error(errorResult.error || 'Erro ao atualizar meta');
       }
       
       // Atualizar no estado local
       setGoals(prev => prev.map(g => 
         g.id === selectedGoal.id 
           ? {
               ...g,
               title: editFormData.title || g.title,
               description: editFormData.description,
               target_amount: editFormData.target_amount || g.target_amount,
               current_amount: editFormData.current_amount || g.current_amount,
               category: editFormData.category || g.category,
               priority: editFormData.priority || g.priority,
               target_date: editFormData.target_date || g.target_date,
               status: editFormData.status || g.status,
               monthly_contribution: editFormData.monthly_contribution,
               notes: editFormData.notes
             }
           : g
       ));
       
       toast({
         title: "Meta Atualizada!",
         description: `Meta "${editFormData.title}" foi atualizada com sucesso.`,
       });
       
       setIsEditModalOpen(false);
       setSelectedGoal(null);
       setEditFormData({});
     } catch (error) {
       toast({
         variant: 'destructive',
         title: "Erro ao Atualizar",
         description: error instanceof Error ? error.message : "Não foi possível atualizar a meta.",
       });
     } finally {
       setIsEditLoading(false);
     }
   };

  const handleDeleteGoal = (goal: PersonalGoal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !user) return;
    
    try {
      // Buscar usuário Supabase para obter o ID
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Deletar via API real
      const deleteResponse = await fetch(`/api/personal/goals?id=${goalToDelete.id}&user_id=${supabaseUserId}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        const errorResult = await deleteResponse.json();
        throw new Error(errorResult.error || 'Erro ao deletar meta');
      }
      
      // Remove do estado local
      setGoals(prev => prev.filter(g => g.id !== goalToDelete.id));
      
      toast({
        title: "Meta Deletada!",
        description: `Meta "${goalToDelete.title}" foi removida com sucesso.`,
      });
      
      setIsDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Deletar",
        description: error instanceof Error ? error.message : "Não foi possível deletar a meta.",
      });
    }
  };

  const handleSaveNewGoal = async (goalData: any) => {
    if (!user) return;
    
    try {
      // Buscar usuário Supabase para obter o ID
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Mapear campos do formulário para a API
      const apiData = {
        user_id: supabaseUserId,
        name: goalData.title, // API espera 'name', formulário envia 'title'
        description: goalData.description,
        type: goalData.category, // API espera 'type', formulário envia 'category'
        target_amount: goalData.target_amount,
        current_amount: goalData.current_amount || 0,
        monthly_contribution: goalData.monthly_contribution,
        deadline: goalData.target_date, // API espera 'deadline', formulário envia 'target_date'
        priority: goalData.priority,
        status: goalData.status || 'active',
        notes: goalData.notes
      };
      
      // Criar nova meta via API
      const createResponse = await fetch('/api/personal/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });
      
      if (!createResponse.ok) {
        const errorResult = await createResponse.json();
        throw new Error(errorResult.error || 'Erro ao criar meta');
      }
      
      const newGoal = await createResponse.json();
      
      // Mapear resposta da API para o formato do componente
      const formattedGoal: PersonalGoal = {
        id: newGoal.goal.id,
        title: newGoal.goal.name,
        description: newGoal.goal.description,
        target_amount: newGoal.goal.target_amount,
        current_amount: newGoal.goal.current_amount || 0,
        category: newGoal.goal.type,
        priority: newGoal.goal.priority || 'medium',
        target_date: newGoal.goal.deadline,
        status: newGoal.goal.status || 'active',
        monthly_contribution: newGoal.goal.monthly_contribution,
        notes: newGoal.goal.notes,
        created_at: newGoal.goal.created_at
      };
      
      // Adicionar ao estado local
      setGoals(prev => [formattedGoal, ...prev]);
      
      toast({
        title: "Meta Criada!",
        description: `Meta "${goalData.title}" foi criada com sucesso.`,
      });
      
      setIsFormOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Criar Meta",
        description: error instanceof Error ? error.message : "Não foi possível criar a meta.",
      });
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || goal.category === selectedCategory;
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalTargetAmount = filteredGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = filteredGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalMonthlyContribution = filteredGoals
    .filter(goal => goal.status === 'active')
    .reduce((sum, goal) => sum + (goal.monthly_contribution || 0), 0);
  const completedGoals = filteredGoals.filter(goal => goal.status === 'completed').length;
  const activeGoals = filteredGoals.filter(goal => goal.status === 'active').length;

  const getCategoryInfo = (category: string) => {
    return GOAL_CATEGORIES[category as keyof typeof GOAL_CATEGORIES] || GOAL_CATEGORIES.other;
  };

  const getStatusInfo = (status: string) => {
    return GOAL_STATUS[status as keyof typeof GOAL_STATUS] || GOAL_STATUS.active;
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS] || PRIORITY_LEVELS.medium;
  };

  const calculateProgress = (goal: PersonalGoal) => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const calculateMonthsToTarget = (goal: PersonalGoal) => {
    if (!goal.monthly_contribution || goal.monthly_contribution === 0) return null;
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / goal.monthly_contribution);
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && new Date(targetDate).getTime() !== new Date('2025-12-31').getTime();
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
            <Skeleton key={i} className="h-40" />
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
                <Target className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                Metas Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Defina e acompanhe seus objetivos financeiros</span>
                <span className="sm:hidden">Seus objetivos financeiros</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Nova Meta</span>
            <span className="xs:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 max-w-7xl">

        {/* Cards de Resumo */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Valor Total das Metas</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words">
                {totalTargetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredGoals.length} meta(s) registrada(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Valor Acumulado</CardTitle>
              <PiggyBank className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                {totalCurrentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((totalCurrentAmount / totalTargetAmount) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Contribuição Mensal</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 break-words">
                {totalMonthlyContribution.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeGoals} meta(s) ativa(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Metas Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {completedGoals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((completedGoals / filteredGoals.length) * 100 || 0).toFixed(1)}% de sucesso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por título ou descrição..."
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
                  {Object.entries(GOAL_CATEGORIES).map(([key, category]) => (
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
                  {Object.entries(GOAL_STATUS).map(([key, status]) => (
                    <option key={key} value={key}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Metas */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Suas Metas Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Target className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedCategory || selectedStatus 
                    ? 'Nenhuma meta encontrada com os filtros aplicados.' 
                    : 'Nenhuma meta pessoal cadastrada ainda.'}
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {filteredGoals.map((goal) => {
                  const categoryInfo = getCategoryInfo(goal.category);
                  const statusInfo = getStatusInfo(goal.status);
                  const priorityInfo = getPriorityInfo(goal.priority);
                  const IconComponent = categoryInfo.icon;
                  const progress = calculateProgress(goal);
                  const monthsToTarget = calculateMonthsToTarget(goal);
                  const overdue = isOverdue(goal.target_date) && goal.status === 'active';
                  
                  return (
                    <div key={goal.id} className={`p-5 sm:p-6 lg:p-8 border rounded-xl hover:bg-muted/50 transition-all duration-200 hover:shadow-md ${
                      overdue ? 'border-destructive bg-destructive/5' : 'bg-muted/20 hover:border-primary/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${categoryInfo.color} flex-shrink-0 shadow-sm`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
                              <h3 className="font-semibold text-base sm:text-lg truncate">{goal.title}</h3>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={`text-xs border ${statusInfo.color} shadow-sm`}>
                                  {statusInfo.label}
                                </Badge>
                                <Badge className={`text-xs border ${priorityInfo.color} shadow-sm`}>
                                  {priorityInfo.label}
                                </Badge>
                                {overdue && (
                                  <Badge variant="destructive" className="text-xs shadow-sm">
                                    Atrasada
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {goal.description && (
                              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5 line-clamp-2">{goal.description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 text-sm sm:text-base text-muted-foreground">
                              <Badge className={`text-xs w-fit border ${categoryInfo.color} shadow-sm flex-shrink-0`}>
                                {categoryInfo.label}
                              </Badge>
                              <span className="flex items-center gap-2 min-w-0">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="break-words">Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}</span>
                              </span>
                              {goal.monthly_contribution && goal.monthly_contribution > 0 && (
                                <span className="break-words min-w-0">
                                  Mensal: {goal.monthly_contribution.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-4 sm:gap-6">
                          <div className="text-left xs:text-right">
                            <div className="text-lg sm:text-xl font-bold text-blue-600 break-words">
                              {goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-sm sm:text-base text-muted-foreground break-words">
                              de {goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewGoal(goal)}
                              title="Visualizar detalhes"
                              className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditGoal(goal)}
                              title="Editar meta"
                              className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteGoal(goal)}
                              title="Excluir meta"
                              className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-muted-foreground font-medium">Progresso da meta</span>
                          <span className="font-semibold text-primary">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3 sm:h-4" />
                      </div>
                      
                      {/* Informações Adicionais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 pt-5 sm:pt-6 border-t">
                        <div className="bg-card p-4 sm:p-5 rounded-lg border hover:shadow-sm transition-shadow min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground font-medium truncate">Faltam</p>
                          </div>
                          <p className="font-semibold text-red-600 text-sm sm:text-base break-words">
                            {(goal.target_amount - goal.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        
                        {monthsToTarget !== null && (
                          <div className="bg-card p-4 sm:p-5 rounded-lg border hover:shadow-sm transition-shadow min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground font-medium truncate">Tempo Estimado</p>
                            </div>
                            <p className="font-semibold text-sm sm:text-base text-blue-600 break-words">
                              {monthsToTarget === 0 ? 'Concluída!' : `${monthsToTarget} mês(es)`}
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-card p-4 sm:p-5 rounded-lg border hover:shadow-sm transition-shadow min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground font-medium truncate">Prioridade</p>
                          </div>
                          <p className={`font-semibold text-sm sm:text-base break-words ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </p>
                        </div>
                        
                        <div className="bg-card p-4 sm:p-5 rounded-lg border hover:shadow-sm transition-shadow min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground font-medium truncate">Prazo</p>
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-green-600 break-words">
                            {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                            {overdue && <span className="block text-red-600 font-normal text-xs mt-1">(Atrasada)</span>}
                          </div>
                        </div>
                      </div>
                    
                      {goal.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">{goal.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição de Meta */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nova Meta Pessoal
            </DialogTitle>
            <DialogDescription>
              Defina uma nova meta pessoal para alcançar seus objetivos financeiros.
            </DialogDescription>
          </DialogHeader>
          <PersonalGoalForm
            onSave={handleSaveNewGoal}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Meta</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="font-medium">{selectedGoal.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p>{getCategoryInfo(selectedGoal.category).label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Atual</label>
                  <p className="font-bold text-lg text-blue-600">
                    {selectedGoal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Meta</label>
                  <p className="font-bold text-lg text-green-600">
                    {selectedGoal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Meta</label>
                  <p>{new Date(selectedGoal.target_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={`border ${getStatusInfo(selectedGoal.status).color}`}>
                    {getStatusInfo(selectedGoal.status).label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <Badge className={`border ${getPriorityInfo(selectedGoal.priority).color}`}>
                    {getPriorityInfo(selectedGoal.priority).label}
                  </Badge>
                </div>
                {selectedGoal.monthly_contribution && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contribuição Mensal</label>
                    <p>{selectedGoal.monthly_contribution.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                )}
              </div>
              {selectedGoal.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedGoal.description}</p>
                </div>
              )}
              {selectedGoal.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedGoal.notes}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Progresso</label>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso atual</span>
                    <span className="font-medium">{calculateProgress(selectedGoal).toFixed(1)}%</span>
                  </div>
                  <Progress value={calculateProgress(selectedGoal)} className="h-3" />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={editFormData.title || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome da meta"
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da meta (opcional)"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Categoria *</label>
                  <select
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {Object.entries(GOAL_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prioridade *</label>
                  <select
                    value={editFormData.priority || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione a prioridade</option>
                    {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                      <option key={key} value={key}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Valor Meta (R$) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.target_amount || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, target_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Valor Atual (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.current_amount || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, current_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Data Meta *</label>
                  <Input
                    type="date"
                    value={editFormData.target_date || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, target_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Status *</label>
                  <select
                    value={editFormData.status || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'paused' | 'cancelled' }))}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecione o status</option>
                    {Object.entries(GOAL_STATUS).map(([key, status]) => (
                      <option key={key} value={key}>{status.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Contribuição Mensal (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.monthly_contribution || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, monthly_contribution: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Input
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais (opcional)"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedGoal(null);
                    setEditFormData({});
                  }}
                  variant="outline" 
                  className="flex-1"
                  disabled={isEditLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateGoal}
                  className="flex-1"
                  disabled={isEditLoading || !editFormData.title || !editFormData.target_amount || !editFormData.category || !editFormData.priority || !editFormData.target_date || !editFormData.status}
                >
                  {isEditLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goalToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteGoal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}