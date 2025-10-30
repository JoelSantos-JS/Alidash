"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Briefcase,
  PiggyBank,
  Gift,
  Home,
  GraduationCap,
  Heart,
  Building,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import PersonalIncomeForm from "@/components/forms/personal-income-form";

interface PersonalIncome {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  is_recurring: boolean;
  is_taxable: boolean;
  tax_withheld?: number;
  notes?: string;
  created_at: string;
}

const INCOME_CATEGORIES = {
  salary: { label: 'Salário', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
  freelance: { label: 'Freelance', icon: User, color: 'bg-green-100 text-green-600' },
  investment: { label: 'Investimentos', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  rental: { label: 'Aluguel', icon: Home, color: 'bg-orange-100 text-orange-600' },
  bonus: { label: 'Bônus', icon: Gift, color: 'bg-yellow-100 text-yellow-600' },
  gift: { label: 'Presente', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  pension: { label: 'Pensão', icon: Building, color: 'bg-gray-100 text-gray-600' },
  benefit: { label: 'Benefício', icon: PiggyBank, color: 'bg-indigo-100 text-indigo-600' },
  other: { label: 'Outros', icon: DollarSign, color: 'bg-slate-100 text-slate-600' }
};

export default function PersonalIncomesPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<PersonalIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<PersonalIncome | null>(null);

  useEffect(() => {
    if (user) {
      loadIncomes();
    }
  }, [user]);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar receitas pessoais
      const incomesResponse = await fetch(`/api/personal/incomes?user_id=${supabaseUserId}&limit=50`);
      if (incomesResponse.ok) {
        const incomesResult = await incomesResponse.json();
        setIncomes(incomesResult.incomes || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as receitas pessoais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || income.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalIncomes = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  const monthlyRecurring = filteredIncomes.filter(income => income.is_recurring).reduce((sum, income) => sum + income.amount, 0);
  const taxableAmount = filteredIncomes.filter(income => income.is_taxable).reduce((sum, income) => sum + income.amount, 0);

  const getCategoryInfo = (category: string) => {
    return INCOME_CATEGORIES[category as keyof typeof INCOME_CATEGORIES] || INCOME_CATEGORIES.other;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
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
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                Receitas Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Gerencie suas fontes de renda pessoal</span>
                <span className="sm:hidden">Suas receitas pessoais</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Nova Receita</span>
            <span className="xs:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Cards de Resumo */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Receitas</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                {totalIncomes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredIncomes.length} receita(s) registrada(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Receitas Recorrentes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words">
                {monthlyRecurring.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas mensais fixas
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Receitas Tributáveis</CardTitle>
              <Building className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 break-words">
                {taxableAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sujeitas à tributação
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
                    placeholder="Buscar por descrição ou fonte..."
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
                  {Object.entries(INCOME_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Receitas */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Histórico de Receitas</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {filteredIncomes.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedCategory ? 'Nenhuma receita encontrada com os filtros aplicados.' : 'Nenhuma receita pessoal cadastrada ainda.'}
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Receita
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredIncomes.map((income) => {
                  const categoryInfo = getCategoryInfo(income.category);
                  const IconComponent = categoryInfo.icon;
                  
                  return (
                    <div key={income.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${categoryInfo.color} flex-shrink-0`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
                            <h3 className="font-medium text-sm sm:text-base truncate">{income.description}</h3>
                            <div className="flex flex-wrap gap-1">
                              {income.is_recurring && (
                                <Badge variant="secondary" className="text-xs">
                                  Recorrente
                                </Badge>
                              )}
                              {income.is_taxable && (
                                <Badge variant="outline" className="text-xs">
                                  Tributável
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(income.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="truncate">Fonte: {income.source}</span>
                            <Badge variant="secondary" className="text-xs w-fit">
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          {income.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{income.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right sm:text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-bold text-green-600 break-words">
                          +{income.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        {income.tax_withheld && income.tax_withheld > 0 && (
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            IR: -{income.tax_withheld.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de receita pessoal */}
        {isFormOpen && (
          <PersonalIncomeForm 
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingIncome(null);
            }}
            onSuccess={() => {
              loadIncomes();
              setIsFormOpen(false);
              setEditingIncome(null);
            }}
            editingIncome={editingIncome}
          />
        )}
      </div>
    </div>
  );
}