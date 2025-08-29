"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Product, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction/transaction-form";
import { InstallmentManager } from "@/components/transaction/installment-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartphone Xiaomi",
    category: "Eletrônicos",
    supplier: "AliExpress",
    aliexpressLink: "https://example.com",
    imageUrl: "https://via.placeholder.com/300x200?text=Smartphone",
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
    imageUrl: "https://via.placeholder.com/300x200?text=Fone",
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
    imageUrl: "https://via.placeholder.com/300x200?text=Relogio",
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

export default function TransacoesPage() {
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
  


  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados de produtos e transações:', user.uid);
        
        // Carregar produtos do Firebase (mantendo compatibilidade)
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        let firebaseProducts: Product[] = [];
        let supabaseTransactions: Transaction[] = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log('📦 Dados encontrados no Firebase:', {
            products: userData.products?.length || 0
          });
          
          if (userData.products && userData.products.length > 0) {
            const data = userData.products;
            firebaseProducts = data.map((p: any) => ({
              ...p,
              purchaseDate: p.purchaseDate?.toDate ? p.purchaseDate.toDate() : new Date(p.purchaseDate),
              sales: p.sales ? p.sales.map((s: any) => ({
                ...s, 
                date: s.date?.toDate ? s.date.toDate() : 
                      typeof s.date === 'string' ? new Date(s.date) : 
                      new Date(s.date)
              })) : [],
            }));
          }
        }

        // Carregar transações do Supabase (PRINCIPAL)
        try {
          console.log('🔍 Tentando buscar transações do Supabase...');
          
          // Primeiro, buscar o usuário no Supabase usando API route
          const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
          
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            const supabaseUser = userResult.user;
            
            console.log('✅ Usuário encontrado no Supabase:', supabaseUser.id);
            
            // Agora buscar as transações usando API route
            const transactionsResponse = await fetch(`/api/transactions/get?user_id=${supabaseUser.id}`);
            
            if (transactionsResponse.ok) {
              const transactionsResult = await transactionsResponse.json();
              supabaseTransactions = transactionsResult.transactions.map((transaction: any) => {
                console.log('🔄 Convertendo transação:', {
                  id: transaction.id,
                  description: transaction.description,
                  isInstallment: transaction.isInstallment,
                  installmentInfo: transaction.installmentInfo,
                  hasInstallmentFields: 'isInstallment' in transaction && 'installmentInfo' in transaction
                });
                
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
                    console.error('❌ Erro ao processar installmentInfo no frontend:', {
                      error: parseError instanceof Error ? parseError.message : parseError,
                      raw_data: transaction.installmentInfo,
                      type: typeof transaction.installmentInfo
                    });
                    installmentInfo = null;
                  }
                }
                
                const convertedTransaction = {
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

                // Log específico para verificar se a conversão está correta
                if (convertedTransaction.isInstallment && convertedTransaction.installmentInfo) {
                  console.log('✅ Transação parcelada convertida corretamente:', {
                    id: convertedTransaction.id,
                    description: convertedTransaction.description,
                    isInstallment: convertedTransaction.isInstallment,
                    installmentInfo: convertedTransaction.installmentInfo,
                    hasInstallmentInfo: !!convertedTransaction.installmentInfo,
                    installmentInfoType: typeof convertedTransaction.installmentInfo
                  });
                } else if (convertedTransaction.isInstallment && !convertedTransaction.installmentInfo) {
                  console.log('❌ PROBLEMA: Transação marcada como parcelada mas sem installmentInfo:', {
                    id: convertedTransaction.id,
                    description: convertedTransaction.description,
                    isInstallment: convertedTransaction.isInstallment,
                    installmentInfo: convertedTransaction.installmentInfo,
                    original_installment_info: transaction.installmentInfo
                  });
                }
                
                console.log('✅ Transação convertida:', {
                  id: convertedTransaction.id,
                  description: convertedTransaction.description,
                  isInstallment: convertedTransaction.isInstallment,
                  installmentInfo: convertedTransaction.installmentInfo,
                  isInstallmentTransaction: convertedTransaction.isInstallment && convertedTransaction.installmentInfo
                });
                
                return convertedTransaction;
              });
              
              // Verificar transações parceladas
              const installmentTransactions = supabaseTransactions.filter(t => t.isInstallment && t.installmentInfo);
              console.log('📊 Análise das transações:', {
                total: supabaseTransactions.length,
                parceladas: installmentTransactions.length,
                naoParceladas: supabaseTransactions.length - installmentTransactions.length
              });
              
              if (installmentTransactions.length > 0) {
                console.log('🎉 Transações parceladas encontradas:', installmentTransactions.map(t => ({
                  id: t.id,
                  description: t.description,
                  amount: t.amount,
                  installmentInfo: t.installmentInfo
                })));
              } else {
                console.log('❌ Nenhuma transação parcelada encontrada!');
                console.log('Verificando todas as transações:');
                supabaseTransactions.forEach((t, index) => {
                  console.log(`  ${index + 1}. ${t.description}: isInstallment=${t.isInstallment}, installmentInfo=${t.installmentInfo ? 'presente' : 'ausente'}`);
                });
              }
              console.log('📊 Transações do Supabase:', supabaseTransactions.length);
            } else {
              const errorText = await transactionsResponse.text();
              console.error('❌ Erro ao buscar transações:', {
                status: transactionsResponse.status,
                statusText: transactionsResponse.statusText,
                error: errorText
              });
              
              // Tentar fazer parse do erro para mostrar detalhes
              try {
                const errorJson = JSON.parse(errorText);
                console.error('❌ Detalhes do erro:', errorJson);
              } catch (parseError) {
                console.error('❌ Erro não é JSON válido:', errorText);
              }
            }
          } else {
            console.log('⚠️ Usuário não encontrado no Supabase, usando apenas Firebase');
          }
        } catch (error) {
          console.error('❌ Erro ao buscar transações do Supabase:', error);
          console.log('📥 Continuando apenas com dados do Firebase');
        }

        let finalProducts = firebaseProducts;
        if (finalProducts.length === 0) {
          console.log('📥 Nenhum produto encontrado, usando dados de exemplo');
          finalProducts = initialProducts;
        } else {
          console.log('✅ Usando produtos reais do banco de dados');
        }

        setProducts(finalProducts);
        setTransactions(supabaseTransactions);
        console.log('📊 Dados carregados:', {
          produtos: finalProducts.length,
          transacoes: supabaseTransactions.length,
          fonte_transacoes: 'Supabase'
        });

      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        console.log('📥 Usando dados de exemplo devido ao erro');
        setProducts(initialProducts);
        setTransactions([]);
      }
      setIsLoading(false);
    }
    
    fetchData();
  }, [user, authLoading]);

  // Removido o useEffect que salvava automaticamente as transações
  // para evitar loops e duplicação de dados

  const handleSaveTransaction = async (transactionData: Transaction) => {
    if (transactionToEdit) {
      // Editar transação existente
      const updatedTransactions = transactions.map(t => 
        t.id === transactionToEdit.id ? { ...t, ...transactionData, id: t.id } : t
      );
      setTransactions(updatedTransactions);
      
      toast({
        title: "Transação Atualizada!",
        description: `${transactionData.description} - Atualizada com sucesso`,
      });
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
        // Primeiro, buscar o usuário no Supabase
        const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user?.uid}&email=${user?.email}`);
        
        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const supabaseUser = userResult.user;
          
          // Criar transação no Supabase
          const createResponse = await fetch('/api/transactions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: supabaseUser.id,
              transaction: newTransaction
            })
          });
          
          if (createResponse.ok) {
            const result = await createResponse.json();
            console.log('✅ Transação criada no Supabase:', result.transaction.id);
            
            toast({
              title: "Transação Adicionada!",
              description: `${transactionData.description} - Salva no Supabase com sucesso`,
            });
          } else {
            console.error('❌ Erro ao criar transação no Supabase:', await createResponse.text());
            toast({
              title: "Transação Adicionada!",
              description: `A transação "${transactionData.description}" foi adicionada localmente.`,
            });
          }
        } else {
          console.error('❌ Usuário não encontrado no Supabase');
          toast({
            title: "Transação Adicionada!",
            description: `A transação "${transactionData.description}" foi adicionada localmente.`,
          });
        }
      } catch (error) {
        console.error('Erro ao salvar no Supabase:', error);
        toast({
          title: "Transação Adicionada!",
          description: `A transação "${transactionData.description}" foi adicionada localmente.`,
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
    // Usar useEffect para navegação em vez de chamar durante render
    useEffect(() => {
      router.push('/login');
    }, [router]);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            
            <div>
              <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                Transações
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
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

          <div className="flex items-center justify-between md:gap-4">
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

            {/* Add New Transaction Button */}
            <Button
              onClick={() => {
                setTransactionToEdit(null);
                setIsFormOpen(true);
              }}
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Adicionar Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
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