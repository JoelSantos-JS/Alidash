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
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import Link from "next/link";
import PersonalTransactionForm from "@/components/forms/personal-transaction-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PeriodSelector } from "@/components/dashboard/period-selector";

interface PersonalTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  source?: string; // Para receitas
  payment_method?: string; // Para despesas
  is_essential?: boolean; // Para despesas
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

const TRANSACTION_TYPES = {
  income: { label: 'Receita', icon: ArrowUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  expense: { label: 'Despesa', icon: ArrowDown, color: 'text-red-600', bgColor: 'bg-red-100' }
};

export default function PersonalTransactionsPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PersonalTransaction | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<PersonalTransaction | null>(null);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Buscar receitas e despesas em paralelo
      const [incomesResponse, expensesResponse] = await Promise.all([
        fetch(`/api/personal/incomes?user_id=${supabaseUserId}&limit=100`),
        fetch(`/api/personal/expenses?user_id=${supabaseUserId}&limit=100`)
      ]);
      
      const allTransactions: PersonalTransaction[] = [];
      
      // Processar receitas
      if (incomesResponse.ok) {
        const incomesResult = await incomesResponse.json();
        const incomes = incomesResult.incomes || [];
        
        incomes.forEach((income: any) => {
          allTransactions.push({
            id: `income_${income.id}`,
            date: income.date,
            description: income.description,
            amount: income.amount,
            type: 'income',
            category: income.category,
            source: income.source,
            is_recurring: income.is_recurring,
            notes: income.notes,
            created_at: income.created_at
          });
        });
      }
      
      // Processar despesas
      if (expensesResponse.ok) {
        const expensesResult = await expensesResponse.json();
        const expenses = expensesResult.expenses || [];
        
        expenses.forEach((expense: any) => {
          allTransactions.push({
            id: `expense_${expense.id}`,
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            payment_method: expense.payment_method,
            is_essential: expense.is_essential,
            is_recurring: expense.is_recurring,
            notes: expense.notes,
            created_at: expense.created_at
          });
        });
      }
      
      // Ordenar por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações pessoais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: PersonalTransaction) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  const handleEditTransaction = (transaction: PersonalTransaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: PersonalTransaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete || !user) return;
    
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?user_id=${user?.id}&email=${user?.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      // Determinar o tipo e ID real da transação
      const [type, realId] = transactionToDelete.id.split('_');
      const endpoint = type === 'income' ? '/api/personal/incomes' : '/api/personal/expenses';
      
      // Deletar via API
      const response = await fetch(`${endpoint}?id=${realId}&user_id=${supabaseUserId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar transação');
      }
      
      toast({
        title: "Transação Deletada!",
        description: `Transação "${transactionToDelete.description}" foi removida com sucesso.`,
      });
      
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
      // Recarregar dados
      loadTransactions();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Erro ao Deletar",
        description: error instanceof Error ? error.message : "Não foi possível deletar a transação.",
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.source && transaction.source.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !selectedType || transaction.type === selectedType;
    
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const transactionDate = new Date(transaction.date);
      const anchor = currentDate;
      switch (selectedPeriod) {
        case 'today':
          matchesPeriod = transactionDate.getFullYear() === anchor.getFullYear() &&
            transactionDate.getMonth() === anchor.getMonth() &&
            transactionDate.getDate() === anchor.getDate();
          break;
        case 'week': {
          const weekAgo = new Date(anchor.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesPeriod = transactionDate >= weekAgo && transactionDate <= anchor;
          break;
        }
        case 'month':
          matchesPeriod = transactionDate.getMonth() === anchor.getMonth() &&
            transactionDate.getFullYear() === anchor.getFullYear();
          break;
        case 'year':
          matchesPeriod = transactionDate.getFullYear() === anchor.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  const transactionCount = filteredTransactions.length;

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
          {[...Array(8)].map((_, i) => (
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
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                Transações Pessoais
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Histórico completo de receitas e despesas pessoais</span>
                <span className="sm:hidden">Histórico de receitas e despesas</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nova Transação</span>
              <span className="xs:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Cards de Resumo */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.filter(t => t.type === 'income').length} receita(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 break-words">
                {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.filter(t => t.type === 'expense').length} despesa(s)
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Saldo Líquido</CardTitle>
              <DollarSign className={`h-4 w-4 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold break-words ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total de Transações</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {transactionCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Movimentações registradas
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
              <div className="w-full sm:w-40">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
              </div>
              <div className="w-full sm:w-40">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Todos os períodos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Última semana</option>
                  <option value="month">Este mês</option>
                  <option value="year">Este ano</option>
                </select>
              </div>
              <div className="w-full sm:w-auto">
                <PeriodSelector
                  currentDate={currentDate}
                  onDateChange={(date) => {
                    setCurrentDate(date);
                    setSelectedPeriod('today');
                  }}
                  className="ml-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedType || selectedPeriod !== 'all' 
                    ? 'Nenhuma transação encontrada com os filtros aplicados.' 
                    : 'Nenhuma transação pessoal registrada ainda.'}
                </p>
                <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Transação
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredTransactions.map((transaction) => {
                  const typeInfo = TRANSACTION_TYPES[transaction.type];
                  const IconComponent = typeInfo.icon;
                  
                  return (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${typeInfo.bgColor} flex-shrink-0`}>
                          <IconComponent className={`h-4 w-4 ${typeInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-2">
                            <h3 className="font-medium text-sm sm:text-base truncate">{transaction.description}</h3>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              {transaction.is_recurring && (
                                <Badge variant="outline" className="text-xs">
                                  Recorrente
                                </Badge>
                              )}
                              {transaction.is_essential !== undefined && (
                                <Badge variant={transaction.is_essential ? 'destructive' : 'secondary'} className="text-xs">
                                  {transaction.is_essential ? 'Essencial' : 'Opcional'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </span>
                            <Badge variant="secondary" className="text-xs w-fit">
                              {transaction.category}
                            </Badge>
                            {transaction.source && (
                              <span className="truncate">Fonte: {transaction.source}</span>
                            )}
                            {transaction.payment_method && (
                              <span className="truncate">Pagamento: {transaction.payment_method}</span>
                            )}
                          </div>
                          {transaction.notes && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <div className="text-right">
                          <div className={`text-base sm:text-lg font-bold break-words ${typeInfo.color}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewTransaction(transaction)}
                            title="Visualizar detalhes"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            title="Editar transação"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction)}
                            title="Excluir transação"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Formulário de transação pessoal */}
      {isFormOpen && (
        <PersonalTransactionForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            loadTransactions();
            setIsFormOpen(false);
          }}
        />
      )}

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="font-medium">{selectedTransaction.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor</label>
                  <p className={`font-bold text-lg ${
                    selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}
                    {selectedTransaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <p>{new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <Badge variant={selectedTransaction.type === 'income' ? 'default' : 'destructive'}>
                    {TRANSACTION_TYPES[selectedTransaction.type].label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p>{selectedTransaction.category}</p>
                </div>
                {selectedTransaction.source && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fonte</label>
                    <p>{selectedTransaction.source}</p>
                  </div>
                )}
                {selectedTransaction.payment_method && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                    <p>{selectedTransaction.payment_method}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recorrente</label>
                  <p>{selectedTransaction.is_recurring ? 'Sim' : 'Não'}</p>
                </div>
                {selectedTransaction.is_essential !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Essencial</label>
                    <p>{selectedTransaction.is_essential ? 'Sim' : 'Não'}</p>
                  </div>
                )}
              </div>
              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {isEditModalOpen && selectedTransaction && (
        <PersonalTransactionForm 
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => {
            loadTransactions();
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          transactionToEdit={{
            id: selectedTransaction.id.split('_')[1], // ID real sem prefixo
            type: selectedTransaction.type,
            description: selectedTransaction.description,
            amount: selectedTransaction.amount,
            date: selectedTransaction.date,
            category: selectedTransaction.category,
            source: selectedTransaction.source,
            payment_method: selectedTransaction.payment_method,
            is_essential: selectedTransaction.is_essential,
            is_recurring: selectedTransaction.is_recurring,
            notes: selectedTransaction.notes
          }}
        />
      )}

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteTransaction}
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
