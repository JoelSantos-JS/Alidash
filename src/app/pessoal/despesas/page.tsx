"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Search,
  Filter,
  TrendingDown,
  Calendar,
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
  CreditCard,
  Wallet,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import PersonalExpenseForm from "@/components/forms/personal-expense-form";

interface PersonalExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  payment_method: string;
  is_essential: boolean;
  is_recurring: boolean;
  location?: string;
  merchant?: string;
  notes?: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = {
  housing: { label: 'Moradia', icon: Home, color: 'bg-blue-100 text-blue-600' },
  food: { label: 'Alimentação', icon: Utensils, color: 'bg-green-100 text-green-600' },
  transportation: { label: 'Transporte', icon: Car, color: 'bg-purple-100 text-purple-600' },
  healthcare: { label: 'Saúde', icon: Heart, color: 'bg-red-100 text-red-600' },
  education: { label: 'Educação', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600' },
  entertainment: { label: 'Entretenimento', icon: Gamepad2, color: 'bg-pink-100 text-pink-600' },
  clothing: { label: 'Vestuário', icon: Shirt, color: 'bg-yellow-100 text-yellow-600' },
  utilities: { label: 'Utilidades', icon: Zap, color: 'bg-orange-100 text-orange-600' },
  insurance: { label: 'Seguros', icon: Shield, color: 'bg-gray-100 text-gray-600' },
  personal_care: { label: 'Cuidados Pessoais', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  gifts: { label: 'Presentes', icon: Gift, color: 'bg-emerald-100 text-emerald-600' },
  savings: { label: 'Poupança', icon: PiggyBank, color: 'bg-teal-100 text-teal-600' },
  other: { label: 'Outros', icon: Wallet, color: 'bg-slate-100 text-slate-600' }
};

const PAYMENT_METHODS = {
  cash: { label: 'Dinheiro', icon: Wallet },
  debit_card: { label: 'Cartão de Débito', icon: CreditCard },
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  pix: { label: 'PIX', icon: Zap },
  bank_transfer: { label: 'Transferência', icon: CreditCard },
  automatic_debit: { label: 'Débito Automático', icon: CreditCard }
};

export default function PersonalExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterEssential, setFilterEssential] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar despesas pessoais
      const expensesResponse = await fetch(`/api/personal/expenses?user_id=${supabaseUserId}&limit=50`);
      if (expensesResponse.ok) {
        const expensesResult = await expensesResponse.json();
        setExpenses(expensesResult.expenses || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas pessoais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.merchant && expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    const matchesEssential = !filterEssential || 
                            (filterEssential === 'essential' && expense.is_essential) ||
                            (filterEssential === 'optional' && !expense.is_essential);
    return matchesSearch && matchesCategory && matchesEssential;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const essentialExpenses = filteredExpenses.filter(expense => expense.is_essential).reduce((sum, expense) => sum + expense.amount, 0);
  const optionalExpenses = totalExpenses - essentialExpenses;
  const recurringExpenses = filteredExpenses.filter(expense => expense.is_recurring).reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryInfo = (category: string) => {
    return EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES] || EXPENSE_CATEGORIES.other;
  };

  const getPaymentMethodInfo = (method: string) => {
    return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] || PAYMENT_METHODS.cash;
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
                <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                Despesas Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Controle seus gastos pessoais</span>
                <span className="sm:hidden">Seus gastos pessoais</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Nova Despesa</span>
            <span className="xs:hidden">Nova</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Cards de Resumo */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Gastos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredExpenses.length} despesa(s) registrada(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Gastos Essenciais</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 break-words">
                {essentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((essentialExpenses / totalExpenses) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Gastos Opcionais</CardTitle>
              <Gamepad2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words">
                {optionalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((optionalExpenses / totalExpenses) * 100 || 0).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Gastos Recorrentes</CardTitle>
              <PiggyBank className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 break-words">
                {recurringExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gastos mensais fixos
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
                    placeholder="Buscar por descrição ou estabelecimento..."
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
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <select
                  value={filterEssential}
                  onChange={(e) => setFilterEssential(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  <option value="essential">Essenciais</option>
                  <option value="optional">Opcionais</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Despesas */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Histórico de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <TrendingDown className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedCategory || filterEssential ? 'Nenhuma despesa encontrada com os filtros aplicados.' : 'Nenhuma despesa pessoal cadastrada ainda.'}
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Despesa
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  const paymentInfo = getPaymentMethodInfo(expense.payment_method);
                  const IconComponent = categoryInfo.icon;
                  const PaymentIcon = paymentInfo.icon;
                  
                  return (
                    <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${categoryInfo.color} flex-shrink-0`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
                            <h3 className="font-medium text-sm sm:text-base truncate">{expense.description}</h3>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={expense.is_essential ? 'destructive' : 'secondary'} className="text-xs">
                                {expense.is_essential ? 'Essencial' : 'Opcional'}
                              </Badge>
                              {expense.is_recurring && (
                                <Badge variant="outline" className="text-xs">
                                  Recorrente
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <PaymentIcon className="h-3 w-3" />
                              {paymentInfo.label}
                            </span>
                            <Badge variant="secondary" className="text-xs w-fit">
                              {categoryInfo.label}
                            </Badge>
                            {expense.location && (
                              <span className="truncate">{expense.location}</span>
                            )}
                          </div>
                          {expense.merchant && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1">Estabelecimento: {expense.merchant}</p>
                          )}
                          {expense.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{expense.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right sm:text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-bold text-red-600 break-words">
                          -{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulário de despesa pessoal */}
        {isFormOpen && (
          <PersonalExpenseForm 
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false);
              setEditingExpense(null);
            }}
            onSuccess={() => {
              loadExpenses();
              setIsFormOpen(false);
              setEditingExpense(null);
            }}
            editingExpense={editingExpense}
          />
        )}
      </div>
    </div>
  );
}