"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Expense } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expense/expense-form";
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

export default function DespesasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        console.log('🔄 Carregando dados de produtos para despesas:', user.uid);
        
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        let firebaseProducts: Product[] = [];
        let firebaseExpenses: Expense[] = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log('📦 Dados encontrados no Firebase:', {
            products: userData.products?.length || 0,
            expenses: userData.expenses?.length || 0
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

          if (userData.expenses && userData.expenses.length > 0) {
            const data = userData.expenses;
            firebaseExpenses = data.map((e: any) => ({
              ...e,
              date: e.date?.toDate ? e.date.toDate() : new Date(e.date)
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
        setExpenses(firebaseExpenses);
        console.log('📊 Despesas carregadas com:', {
          produtos: finalProducts.length,
          despesas: firebaseExpenses.length
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

  // Salvar despesas no Firebase
  useEffect(() => {
    if (isLoading || authLoading || !user) return;

    const saveData = async () => {
      try {
        const docRef = doc(db, "user-data", user.uid);
        await setDoc(docRef, { expenses }, { merge: true });
      } catch (error) {
        console.error("Failed to save expenses to Firestore", error);
        toast({
          variant: 'destructive',
          title: "Erro ao Salvar Dados",
          description: "Não foi possível salvar as despesas na nuvem.",
        });
      }
    };
    
    saveData();
  }, [expenses, isLoading, user, authLoading, toast]);

  const handleSaveExpense = (expenseData: Expense) => {
    if (expenseToEdit) {
      // Editar
      const updatedExpenses = expenses.map(e => 
        e.id === expenseToEdit.id ? { ...e, ...expenseData, id: e.id } : e
      );
      setExpenses(updatedExpenses);
      toast({
        title: "Despesa Atualizada!",
        description: `A despesa "${expenseData.description}" foi atualizada com sucesso.`,
      });
    } else {
      // Adicionar
      const newExpense: Expense = {
        ...expenseData,
        id: new Date().getTime().toString(),
      };
      setExpenses(prev => [newExpense, ...prev]);
      toast({
        title: "Despesa Adicionada!",
        description: `A despesa "${expenseData.description}" foi adicionada com sucesso.`,
      });
    }

    setIsFormOpen(false);
    setExpenseToEdit(null);
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
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowDown className="h-6 w-6 text-red-500" />
                Despesas
              </h1>
              <p className="text-sm text-muted-foreground">
                Controle detalhado das suas despesas de produtos
                {products.length > 0 && products !== initialProducts && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full block"></span>
                    Dados Reais
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Add New Expense Button */}
            <Button
              onClick={() => {
                setExpenseToEdit(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Nova Despesa
            </Button>

            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={periodFilter === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriodFilter("day")}
            >
              Dia
            </Button>
            <Button
              variant={periodFilter === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriodFilter("week")}
            >
              Semana
            </Button>
            <Button
              variant={periodFilter === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriodFilter("month")}
            >
              Mês
            </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[116px] w-full" />
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <ExpensesSection 
            products={products}
            periodFilter={periodFilter}
            expenses={expenses}
          />
        )}
      </main>

      {/* Expense Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {expenseToEdit ? "Editar Despesa" : "Adicionar Nova Despesa"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            onSave={handleSaveExpense}
            onCancel={() => {
              setIsFormOpen(false);
              setExpenseToEdit(null);
            }}
            expenseToEdit={expenseToEdit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}