"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

import { DebtCard } from "@/components/debt/debt-card";
import { DebtForm } from "@/components/debt/debt-form";
import { 
  PlusCircle, 
  Search, 
  Filter,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  CreditCard
} from "lucide-react";
import type { Debt, DebtPayment } from "@/types";

// Dados de exemplo
const initialDebts: Debt[] = [
  {
    id: "1",
    creditorName: "Banco do Brasil",
    description: "Cartão de crédito - fatura dezembro",
    originalAmount: 2500,
    currentAmount: 2650,
    interestRate: 12.5,
    dueDate: new Date(2024, 11, 25),
    createdDate: new Date(2024, 10, 25),
    category: "credit_card",
    priority: "high",
    status: "pending",
    paymentMethod: "pix",
    notes: "Fatura com compras do mês de dezembro",
    tags: ["cartão", "banco"]
  },
  {
    id: "2",
    creditorName: "Financeira Itaú",
    description: "Empréstimo pessoal",
    originalAmount: 15000,
    currentAmount: 12800,
    interestRate: 3.2,
    dueDate: new Date(2025, 0, 15),
    createdDate: new Date(2024, 5, 15),
    category: "loan",
    priority: "medium",
    status: "pending",
    installments: {
      total: 24,
      paid: 8,
      amount: 750
    },
    payments: [
      {
        id: "p1",
        debtId: "2",
        date: new Date(2024, 11, 15),
        amount: 750,
        paymentMethod: "bank_transfer",
        notes: "Parcela 8/24"
      }
    ],
    notes: "Empréstimo para capital de giro",
    tags: ["empréstimo", "itaú"]
  },
  {
    id: "3",
    creditorName: "AliExpress Supplier",
    description: "Fornecedor - produtos eletrônicos",
    originalAmount: 3200,
    currentAmount: 3200,
    dueDate: new Date(2024, 11, 20),
    createdDate: new Date(2024, 11, 5),
    category: "supplier",
    priority: "urgent",
    status: "overdue",
    paymentMethod: "bank_transfer",
    notes: "Pagamento de produtos importados",
    tags: ["fornecedor", "importação"]
  },
  {
    id: "4",
    creditorName: "João Silva",
    description: "Empréstimo pessoal",
    originalAmount: 1000,
    currentAmount: 1000,
    dueDate: new Date(2024, 11, 30),
    createdDate: new Date(2024, 11, 1),
    category: "personal",
    priority: "low",
    status: "paid",
    paymentMethod: "pix",
    payments: [
      {
        id: "p2",
        debtId: "4",
        date: new Date(2024, 11, 18),
        amount: 1000,
        paymentMethod: "pix",
        notes: "Pagamento integral"
      }
    ],
    notes: "Empréstimo de emergência",
    tags: ["pessoal", "emergência"]
  }
];

export default function DebtsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  // Carregar dados do Firebase
  useEffect(() => {
    const loadDebts = async () => {
      if (!user?.uid) return;
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.debts && Array.isArray(userData.debts)) {
            const loadedDebts = userData.debts.map((debt: any) => ({
              ...debt,
              dueDate: debt.dueDate?.toDate ? debt.dueDate.toDate() : new Date(debt.dueDate),
              createdDate: debt.createdDate?.toDate ? debt.createdDate.toDate() : new Date(debt.createdDate),
              payments: debt.payments?.map((payment: any) => ({
                ...payment,
                date: payment.date?.toDate ? payment.date.toDate() : new Date(payment.date)
              })) || []
            }));
            setDebts(loadedDebts);
          } else {
            // Se não há dados, usar dados de exemplo
            setDebts(initialDebts);
            await saveDebts(initialDebts);
          }
        } else {
          // Primeiro acesso, usar dados de exemplo
          setDebts(initialDebts);
          await saveDebts(initialDebts);
        }
      } catch (error) {
        console.error("Erro ao carregar dívidas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as dívidas.",
          variant: "destructive",
        });
        // Em caso de erro, usar dados de exemplo
        setDebts(initialDebts);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadDebts();
    }
  }, [user, authLoading, toast]);

  // Salvar dados no Firebase
  const saveDebts = async (debtsToSave: Debt[]) => {
    if (!user?.uid) return;
    
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(docRef, {
        ...existingData,
        debts: debtsToSave,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao salvar dívidas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  // Filtrar e ordenar dívidas
  const filteredDebts = useMemo(() => {
    let filtered = debts.filter(debt => {
      const matchesSearch = debt.creditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           debt.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || debt.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || debt.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || debt.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return a.dueDate.getTime() - b.dueDate.getTime();
        case "amount":
          return b.currentAmount - a.currentAmount;
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case "creditor":
          return a.creditorName.localeCompare(b.creditorName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [debts, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalDebts = debts.length;
    const totalAmount = debts.reduce((sum, debt) => {
      if (debt.status !== 'paid' && debt.status !== 'cancelled') {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }
      return sum;
    }, 0);
    const overdueDebts = debts.filter(debt => 
      isPast(debt.dueDate) && debt.status !== 'paid' && debt.status !== 'cancelled'
    ).length;
    const dueSoonDebts = debts.filter(debt => {
      const daysUntilDue = differenceInDays(debt.dueDate, new Date());
      return daysUntilDue <= 7 && daysUntilDue >= 0 && debt.status !== 'paid' && debt.status !== 'cancelled';
    }).length;
    const paidDebts = debts.filter(debt => debt.status === 'paid').length;

    return {
      totalDebts,
      totalAmount,
      overdueDebts,
      dueSoonDebts,
      paidDebts
    };
  }, [debts]);

  // Handlers
  const handleCreateDebt = async (debtData: Omit<Debt, 'id' | 'createdDate' | 'payments'>) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      createdDate: new Date(),
      payments: []
    };
    
    const updatedDebts = [...debts, newDebt];
    setDebts(updatedDebts);
    await saveDebts(updatedDebts);
    setIsFormOpen(false);
    
    toast({
      title: "Dívida Criada!",
      description: `Dívida de ${debtData.creditorName} foi adicionada.`,
    });
  };

  const handleEditDebt = async (debtData: Omit<Debt, 'id' | 'createdDate' | 'payments'>) => {
    if (!selectedDebt) return;
    
    const updatedDebts = debts.map(debt => 
      debt.id === selectedDebt.id 
        ? { ...debt, ...debtData }
        : debt
    );
    
    setDebts(updatedDebts);
    await saveDebts(updatedDebts);
    setSelectedDebt(null);
    setIsFormOpen(false);
    
    toast({
      title: "Dívida Atualizada!",
      description: `Dívida de ${debtData.creditorName} foi atualizada.`,
    });
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;
    
    const updatedDebts = debts.filter(debt => debt.id !== debtToDelete.id);
    setDebts(updatedDebts);
    await saveDebts(updatedDebts);
    setDebtToDelete(null);
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Dívida Removida!",
      description: `Dívida de ${debtToDelete.creditorName} foi removida.`,
    });
  };

  const handlePayment = (debt: Debt) => {
    // Aqui você pode implementar um modal de pagamento
    // Por enquanto, vamos marcar como paga
    const updatedDebts = debts.map(d => 
      d.id === debt.id 
        ? { ...d, status: 'paid' as const }
        : d
    );
    
    setDebts(updatedDebts);
    saveDebts(updatedDebts);
    
    toast({
      title: "Pagamento Registrado!",
      description: `Dívida de ${debt.creditorName} foi marcada como paga.`,
    });
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
            <h1 className="text-3xl font-bold">Dívidas</h1>
            <p className="text-muted-foreground">Gerencie suas dívidas e compromissos financeiros</p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Dívida
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDebts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueDebts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.dueSoonDebts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidDebts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por credor ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="negotiating">Negociando</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="loan">Empréstimo</SelectItem>
                <SelectItem value="financing">Financiamento</SelectItem>
                <SelectItem value="supplier">Fornecedor</SelectItem>
                <SelectItem value="personal">Pessoal</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Data de Vencimento</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="creditor">Credor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Dívidas */}
      {filteredDebts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={(debt) => {
                setSelectedDebt(debt);
                setIsFormOpen(true);
              }}
              onDelete={(debt) => {
                setDebtToDelete(debt);
                setIsDeleteDialogOpen(true);
              }}
              onPayment={handlePayment}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Nenhuma dívida encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"
                ? "Tente ajustar os filtros de busca."
                : "Você não possui dívidas cadastradas."}
            </p>
            {!searchTerm && statusFilter === "all" && categoryFilter === "all" && priorityFilter === "all" && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Adicionar Primeira Dívida
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DebtForm
            debt={selectedDebt || undefined}
            onSubmit={selectedDebt ? handleEditDebt : handleCreateDebt}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedDebt(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a dívida de "{debtToDelete?.creditorName}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDebt} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}