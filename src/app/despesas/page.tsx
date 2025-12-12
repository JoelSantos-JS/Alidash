"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useData } from "@/contexts/data-context";
import { ExpensesSection } from "@/components/dashboard/expenses-section";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product, Expense } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function DespesasPage() {
  const { user, loading: authLoading } = useAuth();
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading: dataLoading } = useData();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  


  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      if (!user?.id) return;

      try {
        console.log('🔄 Iniciando busca de produtos para usuário:', user.id);

        // Buscar produtos do Supabase
        const productsResponse = await fetch(`/api/products/get?user_id=${user.id}`);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const supabaseProducts = productsData.products || [];
          console.log('📦 Produtos do Supabase:', supabaseProducts.length);
          setProducts(supabaseProducts);
        } else {
          console.log('❌ Erro ao buscar produtos do Supabase');
          setProducts([]);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [user?.id]);



  const handleSaveExpense = async (expenseData: Expense) => {
    if (!user?.id) return;

    try {
      if (expenseToEdit) {
        // Editar despesa existente - implementar quando necessário
        toast({
          variant: 'destructive',
          title: "Funcionalidade em desenvolvimento",
          description: "A edição de despesas será implementada em breve.",
        });
      } else {
        // Atualização otimista: adiciona imediatamente na UI
        addExpense(expenseData);

        // Sincroniza com a API em background
        const response = await fetch(`/api/expenses/create?user_id=${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.expense) {
            // Atualiza o registro otimista com dados definitivos (ex.: transactionId)
            const serverExpense: Expense = {
              ...expenseData,
              id: result.expense.id, // normalmente igual ao enviado
              transactionId: result.expense.transaction_id,
            };
            // Se o id retornado for diferente, removemos o otimista e adicionamos o oficial
            if (serverExpense.id !== expenseData.id) {
              // Reverter o item otimista e adicionar o oficial para manter consistência
              deleteExpense(expenseData.id);
              addExpense(serverExpense);
            } else {
              updateExpense(serverExpense);
            }

            toast({
              title: "Despesa adicionada!",
              description: `${expenseData.description} - Criada com sucesso`,
            });
          } else {
            // Falha lógica da API: reverter otimista
            deleteExpense(expenseData.id);
            throw new Error(result.error || 'Erro ao criar despesa');
          }
        } else {
          // Falha HTTP: reverter otimista
          deleteExpense(expenseData.id);
          throw new Error('Erro na requisição');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast({
        variant: 'destructive',
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido ao salvar despesa.",
      });
    }

    setIsFormOpen(false);
    setExpenseToEdit(null);
  };

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    router.replace('/login');
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
                <ArrowDown className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                Despesas
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Controle detalhado das suas despesas de produtos</span>
                <span className="sm:hidden">Suas despesas de produtos</span>
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

            {/* Date Navigator */}
            <PeriodSelector 
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              className="ml-2 hidden sm:flex"
            />

            {/* Add New Expense Button */}
            <Button
              onClick={() => {
                setExpenseToEdit(null);
                setIsFormOpen(true);
              }}
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Adicionar Nova Despesa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 md:p-6">
        {dataLoading ? (
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] md:h-[116px] w-full" />
              ))}
            </div>
            <Skeleton className="h-[300px] md:h-[400px] w-full" />
          </div>
        ) : (
          <ExpensesSection 
            products={products}
            periodFilter={periodFilter}
            expenses={expenses}
            currentDate={currentDate}
          />
        )}
      </main>

      {/* Expense Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
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
