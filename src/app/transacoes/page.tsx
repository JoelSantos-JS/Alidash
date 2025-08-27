"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TransactionsSection } from "@/components/dashboard/transactions-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDualSync } from '@/lib/dual-database-sync';
import { db } from "@/lib/firebase";
import type { Product, Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction/transaction-form";
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
  
  // Hook de sincronização dual
  const dualSync = useDualSync(user?.uid || '', 'BEST_EFFORT');

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados de produtos para transações:', user.uid);
        
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        let firebaseProducts: Product[] = [];
        let firebaseTransactions: Transaction[] = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log('📦 Dados encontrados no Firebase:', {
            products: userData.products?.length || 0,
            transactions: userData.transactions?.length || 0
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

          if (userData.transactions && userData.transactions.length > 0) {
            const data = userData.transactions;
            firebaseTransactions = data.map((t: any) => ({
              ...t,
              date: t.date?.toDate ? t.date.toDate() : new Date(t.date)
            }));
          }
        }

        let finalProducts = firebaseProducts;
        if (finalProducts.length === 0) {
          console.log('📥 Nenhum produto encontrado, usando dados de exemplo');
          finalProducts = initialProducts;
        } else {
          console.log('✅ Usando produtos reais do banco de dados');
        }

        setProducts(finalProducts);
        setTransactions(firebaseTransactions);
        console.log('📊 Transações carregadas com:', {
          produtos: finalProducts.length,
          transacoes: firebaseTransactions.length
        });

      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        console.log('📥 Usando dados de exemplo devido ao erro');
        setProducts(initialProducts);
      }
      setIsLoading(false);
    }
    
    fetchData();
  }, [user, authLoading]);

  // Salvar transações com sincronização dual
  useEffect(() => {
    if (isLoading || authLoading || !user) return;

    const saveData = async () => {
      try {
        // Para arrays de transações, ainda usamos Firebase como fallback
        // mas implementamos sincronização individual para novas transações
        const docRef = doc(db, "user-data", user.uid);
        await setDoc(docRef, { transactions }, { merge: true });
        console.log('✅ Transações salvas (Firebase + preparado para Supabase)');
      } catch (error) {
        console.error("Failed to save transactions", error);
        toast({
          variant: 'destructive',
          title: "Erro ao Salvar Dados",
          description: "Não foi possível salvar as transações na nuvem.",
        });
      }
    };
    
    saveData();
  }, [transactions, isLoading, user, authLoading, toast]);

  const handleSaveTransaction = async (transactionData: Transaction) => {
    if (transactionToEdit) {
      // Editar transação existente
      const updatedTransactions = transactions.map(t => 
        t.id === transactionToEdit.id ? { ...t, ...transactionData, id: t.id } : t
      );
      setTransactions(updatedTransactions);
      
      // Usar sincronização dual para atualizar
      try {
        // Como não temos updateTransaction no dual sync ainda, usamos o estado local
        console.log('✅ Transação atualizada localmente (sincronização dual em desenvolvimento)');
        toast({
          title: "Transação Atualizada!",
          description: `${transactionData.description} - Atualizada localmente`,
        });
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({
          title: "Transação Atualizada!",
          description: `A transação "${transactionData.description}" foi atualizada localmente.`,
        });
      }
    } else {
      // Adicionar nova transação
      const newTransaction: Transaction = {
        ...transactionData,
        id: new Date().getTime().toString(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Usar sincronização dual para criar
      try {
        const result = await dualSync.createTransaction(newTransaction);
        console.log(`Transação criada - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
        
        toast({
          title: "Transação Adicionada!",
          description: `${transactionData.description} - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        });
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({
          title: "Transação Adicionada!",
          description: `A transação "${transactionData.description}" foi adicionada localmente.`,
        });
      }
    }

    setIsFormOpen(false);
    setTransactionToEdit(null);
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
          <TransactionsSection 
            products={products}
            periodFilter={periodFilter}
            transactions={transactions}
          />
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