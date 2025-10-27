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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  emergency_fund: { label: 'Reserva de Emergência', icon: PiggyBank, color: 'bg-muted/30 text-red-600' },
  house: { label: 'Casa Própria', icon: Home, color: 'bg-muted/30 text-blue-600' },
  car: { label: 'Veículo', icon: Car, color: 'bg-muted/30 text-green-600' },
  education: { label: 'Educação', icon: GraduationCap, color: 'bg-muted/30 text-purple-600' },
  health: { label: 'Saúde', icon: Heart, color: 'bg-muted/30 text-pink-600' },
  travel: { label: 'Viagem', icon: Plane, color: 'bg-muted/30 text-orange-600' },
  investment: { label: 'Investimento', icon: TrendingUp, color: 'bg-muted/30 text-indigo-600' },
  retirement: { label: 'Aposentadoria', icon: Building, color: 'bg-muted/30 text-muted-foreground' },
  debt_payoff: { label: 'Quitação de Dívidas', icon: CreditCard, color: 'bg-muted/30 text-yellow-600' },
  gift: { label: 'Presente/Evento', icon: Gift, color: 'bg-muted/30 text-teal-600' },
  other: { label: 'Outros', icon: Target, color: 'bg-muted/30 text-muted-foreground' }
};

const GOAL_STATUS = {
  active: { label: 'Ativa', color: 'bg-blue-100 text-blue-600', variant: 'default' as const },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-600', variant: 'secondary' as const },
  paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-600', variant: 'outline' as const },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-600', variant: 'destructive' as const }
};

const PRIORITY_LEVELS = {
  high: { label: 'Alta', color: 'text-red-600', variant: 'destructive' as const },
  medium: { label: 'Média', color: 'text-yellow-600', variant: 'outline' as const },
  low: { label: 'Baixa', color: 'text-green-600', variant: 'secondary' as const }
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

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.uid}&email=${user?.email}`);
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
    setIsEditModalOpen(true);
  };

  const handleDeleteGoal = (goal: PersonalGoal) => {
    setGoalToDelete(goal);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete || !user) return;
    
    try {
      // Buscar usuário Supabase para obter o ID
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
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

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Cards de Resumo */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Valor Total das Metas</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
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
            <CardContent className="p-3 sm:p-6">
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
            <CardContent className="p-3 sm:p-6">
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
            <CardContent className="p-3 sm:p-6">
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
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
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
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Suas Metas Financeiras</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
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
              <div className="space-y-3 sm:space-y-4">
                {filteredGoals.map((goal) => {
                  const categoryInfo = getCategoryInfo(goal.category);
                  const statusInfo = getStatusInfo(goal.status);
                  const priorityInfo = getPriorityInfo(goal.priority);
                  const IconComponent = categoryInfo.icon;
                  const progress = calculateProgress(goal);
                  const monthsToTarget = calculateMonthsToTarget(goal);
                  const overdue = isOverdue(goal.target_date) && goal.status === 'active';
                  
                  return (
                    <div key={goal.id} className={`p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                      overdue ? 'border-destructive bg-destructive/5' : 'bg-muted/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${categoryInfo.color} flex-shrink-0`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                              <h3 className="font-medium text-sm sm:text-base truncate">{goal.title}</h3>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant={statusInfo.variant} className="text-xs">
                                  {statusInfo.label}
                                </Badge>
                                <Badge variant={priorityInfo.variant} className="text-xs">
                                  {priorityInfo.label}
                                </Badge>
                                {overdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Atrasada
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {goal.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{goal.description}</p>
                            )}
                            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs w-fit">
                                {categoryInfo.label}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                              </span>
                              {goal.monthly_contribution && goal.monthly_contribution > 0 && (
                                <span className="truncate">
                                  Mensal: {goal.monthly_contribution.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-3">
                          <div className="text-left xs:text-right">
                            <div className="text-base sm:text-lg font-bold text-blue-600 break-words">
                              {goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground break-words">
                              de {goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                          <div className="flex gap-1 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewGoal(goal)}
                              title="Visualizar detalhes"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditGoal(goal)}
                              title="Editar meta"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteGoal(goal)}
                              title="Excluir meta"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de Progresso */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Progresso da meta</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 sm:h-3" />
                      </div>
                      
                      {/* Informações Adicionais */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 pt-3 border-t">
                        <div className="bg-card p-2 sm:p-3 rounded-lg border">
                          <p className="text-xs text-muted-foreground">Faltam</p>
                          <p className="font-medium text-red-600 text-sm sm:text-base break-words">
                            {(goal.target_amount - goal.current_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        
                        {monthsToTarget !== null && (
                          <div className="bg-card p-2 sm:p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground">Tempo Estimado</p>
                            <p className="font-medium text-sm sm:text-base">
                              {monthsToTarget === 0 ? 'Concluída!' : `${monthsToTarget} mês(es)`}
                            </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Prioridade</p>
                        <p className={`font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground">Criada em</p>
                        <p className="font-medium">
                          {new Date(goal.created_at).toLocaleDateString('pt-BR')}
                        </p>
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

      {/* TODO: Adicionar formulário de meta pessoal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Meta Pessoal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Formulário de meta pessoal será implementado em breve.
              </p>
              <Button onClick={() => setIsFormOpen(false)} className="w-full">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <Badge variant={getStatusInfo(selectedGoal.status).variant}>
                    {getStatusInfo(selectedGoal.status).label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <Badge variant={getPriorityInfo(selectedGoal.priority).variant}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Funcionalidade de edição será implementada em breve.
            </p>
            <Button onClick={() => setIsEditModalOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
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