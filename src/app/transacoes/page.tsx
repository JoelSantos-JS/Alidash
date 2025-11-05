"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/use-supabase-auth';
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction/transaction-form";
import { InstallmentManager } from "@/components/transaction/installment-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PeriodSelector } from "@/components/dashboard/period-selector";

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Xiaomi",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Smartphone de última geração",
    purchasePrice: 800,
    shippingCost: 50,
    importTaxes: 120,
    packagingCost: 10,
    marketingCost: 30,
    otherCosts: 20,
    totalCost: 1030,
    sellingPrice: 1500,
    expectedProfit: 470,
    profitMargin: 31.3,
    sales: [
      {
        id: "sale1",
        date: new Date(2024, 11, 15),
        quantity: 1,
        buyerName: "João Silva",
        productId: "1"
      }
    ],
    quantity: 3,
    quantitySold: 1,
    status: 'selling',
    purchaseDate: new Date(2024, 11, 1),
    roi: 45.6,
    actualProfit: 470
  },
  {
    id: "2",
    name: "Fone de Ouvido Bluetooth",
    category: "Acessórios",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Fone sem fio de alta qualidade",
    purchasePrice: 120,
    shippingCost: 15,
    importTaxes: 18,
    packagingCost: 5,
    marketingCost: 10,
    otherCosts: 5,
    totalCost: 173,
    sellingPrice: 250,
    expectedProfit: 77,
    profitMargin: 30.8,
    sales: [],
    quantity: 5,
    quantitySold: 0,
    status: 'received',
    purchaseDate: new Date(2024, 11, 10),
    roi: 0,
    actualProfit: 0
  },
  {
    id: "3",
    name: "Relógio Smart",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "/placeholder-product.svg",
    description: "Relógio inteligente com monitor cardíaco",
    purchasePrice: 200,
    shippingCost: 25,
    importTaxes: 30,
    packagingCost: 8,
    marketingCost: 15,
    otherCosts: 7,
    totalCost: 285,
    sellingPrice: 450,
    expectedProfit: 165,
    profitMargin: 36.7,
    sales: [
      {
        id: "sale2",
        date: new Date(2024, 11, 20),
        quantity: 1,
        buyerName: "Maria Santos",
        productId: "3"
      }
    ],
    quantity: 2,
    quantitySold: 1,
    status: 'selling',
    purchaseDate: new Date(2024, 11, 5),
    roi: 57.9,
    actualProfit: 165
  }
];

function TransacoesPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  


  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Carregando dados de produtos e transações:', user.id);
        }
        
        let products: Product[] = [];
        let transactions: Transaction[] = [];

        // Carregar produtos do Supabase
        try {
          const productsResponse = await fetch(`/api/products/get?user_id=${user.id}`);
          
          if (productsResponse.ok) {
            const productsResult = await productsResponse.json();
            products = productsResult.products || [];
            
            if (process.env.NODE_ENV === 'development') {
              console.log('📦 Produtos do Supabase:', products.length);
            }
          } else if (productsResponse.status === 404) {
            // Em produção, tratar 404 como "nenhum produto" sem erro
            products = [];
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Produtos não encontrados (404). Usando lista vazia.');
            }
          } else {
            // Logar detalhadamente apenas em desenvolvimento
            if (process.env.NODE_ENV === 'development') {
              console.error('❌ Erro ao buscar produtos:', productsResponse.status);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro ao buscar produtos do Supabase:', error);
          }
        }

        // Carregar transações do Supabase
        try {
          const transactionsResponse = await fetch(`/api/transactions/get?user_id=${user.id}`);
            
          if (transactionsResponse.ok) {
            const transactionsResult = await transactionsResponse.json();
            transactions = transactionsResult.transactions.map((transaction: any) => {
              // Tratar installmentInfo com segurança
              let installmentInfo = null;
              
              if (transaction.installmentInfo !== null && transaction.installmentInfo !== undefined) {
                try {
                  // Se já é um objeto, usar diretamente
                  if (typeof transaction.installmentInfo === 'object' && transaction.installmentInfo !== null) {
                    installmentInfo = transaction.installmentInfo;
                  } 
                  // Se é string, fazer parse JSON
                  else if (typeof transaction.installmentInfo === 'string' && transaction.installmentInfo.trim() !== '') {
                    installmentInfo = JSON.parse(transaction.installmentInfo);
                  }
                  // Se é qualquer outro tipo, usar como está
                  else {
                    installmentInfo = transaction.installmentInfo;
                  }
                } catch (parseError) {
                  console.error('❌ Erro ao processar installmentInfo:', parseError);
                  installmentInfo = null;
                }
              }
              
              return {
                id: transaction.id,
                date: new Date(transaction.date),
                description: transaction.description,
                amount: parseFloat(transaction.amount),
                type: transaction.type,
                category: transaction.category,
                subcategory: transaction.subcategory,
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
                notes: transaction.notes,
                tags: transaction.tags,
                productId: transaction.productId,
                isInstallment: transaction.isInstallment || false,
                installmentInfo: installmentInfo
              };
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log('📊 Transações do Supabase:', transactions.length);
            }
          } else if (transactionsResponse.status === 404) {
            // Tratar 404 como ausência de transações
            transactions = [];
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Nenhuma transação encontrada (404).');
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              const errorText = await transactionsResponse.text();
              console.error('❌ Erro ao buscar transações:', {
                status: transactionsResponse.status,
                statusText: transactionsResponse.statusText,
                error: errorText
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Erro ao buscar transações do Supabase:', error);
          }
        }

        // Se não há produtos reais, usar dados de exemplo
        const finalProducts = products.length > 0
          ? products
          : (process.env.NODE_ENV === 'development' ? initialProducts : []);
        
        setProducts(finalProducts);
        setTransactions(transactions);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Dados carregados:', {
            produtos: finalProducts.length,
            transacoes: transactions.length,
            fonte: 'Supabase'
          });
        }

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Erro ao carregar dados:', error);
        }
        setProducts(process.env.NODE_ENV === 'development' ? initialProducts : []);
        setTransactions([]);
      }
      setIsLoading(false);
    }
    
    fetchData();
  }, [user, authLoading]);

  // Removido o useEffect que salvava automaticamente as transações
  // para evitar loops e duplicação de dados
  
  // Função para carregar transações de um período específico
  const loadTransactionsForPeriod = async (date: Date) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const month = date.getMonth() + 1; // Mês começa em 0, então adicionamos 1
      const year = date.getFullYear();
      
      console.log(`Carregando transações para ${month}/${year}`);
      
      // Definir o primeiro e último dia do mês
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Log adicional para debug
      console.log("Usuário autenticado:", user.id);
      
      // Buscar transações do período
      const transactionsResponse = await fetch(`/api/transactions/get?user_id=${user.id}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
        
      if (transactionsResponse.ok) {
        const transactionsResult = await transactionsResponse.json();
        const periodTransactions = transactionsResult.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          amount: parseFloat(t.amount),
          installmentInfo: t.installmentInfo ? 
            (typeof t.installmentInfo === 'string' ? JSON.parse(t.installmentInfo) : t.installmentInfo) : 
            null
        }));
        
        setTransactions(periodTransactions);
        console.log("Transações carregadas com sucesso:", periodTransactions.length);
        
        toast({
          title: "Transações carregadas",
          description: `${periodTransactions.length} transações encontradas para ${month}/${year}`,
        });
      } else if (transactionsResponse.status === 404) {
        // Sem transações no período: tratar silenciosamente em produção
        setTransactions([]);
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Nenhuma transação encontrada para ${month}/${year} (404)`);
        }
        toast({
          title: "Sem transações",
          description: `Nenhuma transação registrada em ${month}/${year}`,
        });
      } else {
        throw new Error("Falha ao buscar transações do período");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erro ao carregar transações:", error);
      }
      toast({
        title: "Erro ao carregar transações",
        description: "Não foi possível carregar as transações para o período selecionado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar transações do período atual quando o componente montar ou a data mudar
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🔄 Carregando transações para o período:', currentDate);
      loadTransactionsForPeriod(currentDate);
    }
  }, [user, authLoading, currentDate]);
  
  // Adicionar log para verificar se as transações estão sendo carregadas corretamente
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('✅ Transações carregadas com sucesso:', transactions.length);
      console.log('📊 Primeira transação:', transactions[0]);
    } else {
      console.log('⚠️ Nenhuma transação carregada');
    }
  }, [transactions]);

  const handleSaveTransaction = async (transactionData: Transaction) => {
    // Garantia de segurança: usuário pode ser null para o TS
    const currentUserId = user?.id;
    if (!currentUserId) {
      toast({
        variant: "destructive",
        title: "Sessão expirada",
        description: "Faça login novamente para salvar a transação.",
      });
      return;
    }
    if (transactionToEdit) {
      // Editar transação existente
      try {
        const updateResponse = await fetch('/api/transactions/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUserId,
            transaction: { ...transactionData, id: transactionToEdit.id }
          })
        });

        if (updateResponse.ok) {
          const updatedTransactions = transactions.map(t => 
            t.id === transactionToEdit.id ? { ...t, ...transactionData, id: t.id } : t
          );
          setTransactions(updatedTransactions);
          
          toast({
            title: "Transação Atualizada!",
            description: `${transactionData.description} - Atualizada com sucesso`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar a transação no servidor.",
          });
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar transação:', error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: "Ocorreu um erro ao atualizar a transação.",
        });
      }
    } else {
      // Adicionar nova transação
      const newTransaction: Transaction = {
        ...transactionData,
        id: new Date().getTime().toString(),
      };
      
      // Adicionar ao estado local
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Salvar no Supabase
      try {
        const createResponse = await fetch('/api/transactions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUserId,
            transaction: newTransaction
          })
        });
        
        if (createResponse.ok) {
          const result = await createResponse.json();
          console.log('✅ Transação criada no Supabase:', result.transaction?.id);
          
          toast({
            title: "Transação Adicionada!",
            description: `${transactionData.description} - Salva com sucesso`,
          });
        } else {
          const errorText = await createResponse.text();
          console.error('❌ Erro ao criar transação:', errorText);
          
          toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: `A transação foi adicionada localmente, mas não foi salva no servidor.`,
          });
        }
      } catch (error) {
        console.error('❌ Erro ao salvar transação:', error);
        
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: `A transação foi adicionada localmente, mas ocorreu um erro ao salvar no servidor.`,
        });
      }
    }

    setIsFormOpen(false);
    setTransactionToEdit(null);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    const updatedTransactions = transactions.map(t => 
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
    setTransactions(updatedTransactions);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3">
          {/* Primeira linha: Título e botão de adicionar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                  Transações
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  <span className="hidden sm:inline">Histórico completo de todas as transações financeiras</span>
                  <span className="sm:hidden">Histórico de transações</span>
                  {products.length > 0 && products !== initialProducts && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <span className="w-2 h-2 bg-green-500 rounded-full block"></span>
                      <span className="hidden sm:inline">Dados Reais</span>
                      <span className="sm:hidden">Real</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Add New Transaction Button - sempre visível */}
            <Button
              onClick={() => {
                setTransactionToEdit(null);
                setIsFormOpen(true);
              }}
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm flex-shrink-0 ml-2"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Adicionar Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>

          {/* Segunda linha: Filtros de período */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-1 md:gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={periodFilter === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodFilter("day")}
                className="text-xs md:text-sm px-2 md:px-3"
              >
                Dia
              </Button>
              <Button
                variant={periodFilter === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodFilter("week")}
                className="text-xs md:text-sm px-2 md:px-3"
              >
                Semana
              </Button>
              <Button
                variant={periodFilter === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodFilter("month")}
                className="text-xs md:text-sm px-2 md:px-3"
              >
                Mês
              </Button>
            </div>
            
            {/* Seletor de mês/ano para visualizar transações de períodos anteriores */}
            <PeriodSelector 
              currentDate={currentDate}
              onDateChange={(date) => {
                setCurrentDate(date);
                loadTransactionsForPeriod(date);
              }}
              className="ml-0"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 md:p-6">
        {isLoading ? (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] md:h-[116px] w-full" />
              ))}
            </div>
            <Skeleton className="h-[300px] md:h-[400px] w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Todas as Transações</TabsTrigger>
              <TabsTrigger value="installments">Compras Parceladas</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-6">
              <TransactionsSection 
                products={products}
                periodFilter={periodFilter}
                transactions={transactions}
              />
            </TabsContent>

            <TabsContent value="installments" className="space-y-6">
              <InstallmentManager
                transactions={transactions}
                onSaveTransaction={handleSaveTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Transaction Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {transactionToEdit ? "Editar Transação" : "Nova Transação"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm 
            onSave={handleSaveTransaction}
            onCancel={() => {
              setIsFormOpen(false);
              setTransactionToEdit(null);
            }}
            transactionToEdit={transactionToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TransacoesPage() {
  try {
    return <TransacoesPageContent />;
  } catch (error) {
    // Se o provider não estiver disponível, mostra loading
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
}