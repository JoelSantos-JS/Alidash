"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useData } from "@/contexts/data-context";
import { RevenueSection } from "@/components/dashboard/revenue-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Product, Revenue } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RevenueForm } from "@/components/revenue/revenue-form";
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

export default function ReceitasPage() {
  const { user, loading: authLoading } = useAuth();
  const { revenues, addRevenue, refreshData, isLoading: dataLoading } = useData();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("month");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [revenueToEdit, setRevenueToEdit] = useState<Revenue | null>(null);

  useEffect(() => {
    if (!user?.id) return;

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
          setProducts(supabaseProducts.length > 0 ? supabaseProducts : initialProducts);
        } else {
          console.log('❌ Erro ao buscar produtos do Supabase, usando produtos iniciais');
          setProducts(initialProducts);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        setProducts(initialProducts);
      }
    };

    fetchProducts();
  }, [user?.id]);



  const handleSaveRevenue = async (revenueData: Revenue) => {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: "Erro de Autenticação",
        description: "Usuário não autenticado.",
      });
      return;
    }

    if (revenueToEdit) {
      // Editar receita existente
      try {
        const response = await fetch('/api/revenues/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: revenueToEdit.id,
            user_id: user.id,
            description: revenueData.description,
            amount: revenueData.amount,
            category: revenueData.category,
            source: revenueData.source,
            notes: revenueData.notes,
            product_id: revenueData.productId,
            date: revenueData.date.toISOString(),
          }),
        });

        if (response.ok) {
          // Atualizar dados no contexto global
          refreshData();
          
          toast({
            title: "Receita Atualizada!",
            description: `${revenueData.description} - Atualizada com sucesso`,
          });
        } else {
          const errorData = await response.text();
          toast({
            variant: 'destructive',
            title: "Erro ao Atualizar Receita",
            description: `Falha na atualização: ${errorData}`,
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar receita:', error);
        toast({
          variant: 'destructive',
          title: "Erro ao Atualizar Receita",
          description: "Não foi possível atualizar a receita.",
        });
      }
    } else {
      // Adicionar nova receita
      try {
        const response = await fetch('/api/revenues/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            description: revenueData.description,
            amount: revenueData.amount,
            category: revenueData.category,
            source: revenueData.source,
            notes: revenueData.notes,
            product_id: revenueData.productId,
            date: revenueData.date.toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const newRevenue: Revenue = {
            ...revenueData,
            id: result.revenue.id,
          };
          addRevenue(newRevenue);

          try {
            const productsResponse = await fetch(`/api/products/get?user_id=${user.id}`);
            if (productsResponse.ok) {
              const productsData = await productsResponse.json();
              setProducts(productsData.products || []);
            }
          } catch (_) {}
          
          toast({
            title: "Receita Adicionada!",
            description: `${revenueData.description} - Criada com sucesso`,
          });
        } else {
          const errorData = await response.text();
          toast({
            variant: 'destructive',
            title: "Erro ao Criar Receita",
            description: `Falha na criação: ${errorData}`,
          });
        }
      } catch (error) {
        console.error('Erro ao criar receita:', error);
        toast({
          variant: 'destructive',
          title: "Erro ao Criar Receita",
          description: "Não foi possível criar a receita.",
        });
      }
    }

    setIsFormOpen(false);
    setRevenueToEdit(null);
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
                <ArrowUp className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                Receitas
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Análise completa das suas receitas de produtos</span>
                <span className="sm:hidden">Suas receitas de produtos</span>
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

            {/* Add New Revenue Button */}
            <Button
              onClick={() => {
                setRevenueToEdit(null);
                setIsFormOpen(true);
              }}
              size="sm"
              className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Adicionar Nova Receita</span>
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
          <RevenueSection 
            products={products}
            periodFilter={periodFilter}
            revenues={revenues}
          />
        )}
      </main>

      {/* Revenue Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {revenueToEdit ? "Editar Receita" : "Nova Receita"}
            </DialogTitle>
          </DialogHeader>
          <RevenueForm 
            onSave={handleSaveRevenue}
            onCancel={() => {
              setIsFormOpen(false);
              setRevenueToEdit(null);
            }}
            revenueToEdit={revenueToEdit}
            products={products}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
