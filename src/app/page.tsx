"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import type { Product, Sale } from "@/types";
import { Header } from "@/components/layout/header";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductForm } from "@/components/product/product-form";
import { PasswordDialog } from "@/components/layout/password-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Target } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SaleForm } from "@/components/product/sale-form";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const initialProducts: Product[] = [];


export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().products) {
            const data = docSnap.data().products;
             const parsedProducts = data.map((p: any) => ({
                ...p,
                purchaseDate: p.purchaseDate?.toDate ? p.purchaseDate.toDate() : new Date(p.purchaseDate),
                sales: p.sales ? p.sales.map((s: any) => ({...s, date: s.date?.toDate ? s.date.toDate() : new Date(s.date)})) : [],
            }));
            setProducts(parsedProducts);
        } else {
            setProducts(initialProducts);
        }
        setIsLoading(false);
    }
    fetchData();

  }, [user, authLoading]);

  useEffect(() => {
    if(isLoading || authLoading || !user) return;
    
    const saveData = async () => {
        try {
            const docRef = doc(db, "user-data", user.uid);
            // We need to fetch existing data to not overwrite other fields
            const docSnap = await getDoc(docRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};
            await setDoc(docRef, { ...existingData, products });
        } catch (error) {
            console.error("Failed to save products to Firestore", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Dados",
                description: "Não foi possível salvar os produtos na nuvem. Suas alterações podem ser perdidas.",
            })
        }
    }
    
    saveData();
    
  }, [products, isLoading, user, authLoading, toast]);


  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const summaryStats = useMemo(() => {
    const totalInvested = products.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0);
    const totalActualProfit = products.reduce((acc, p) => acc + p.actualProfit, 0);
    const projectedProfit = products.reduce((acc, p) => acc + (p.expectedProfit * (p.quantity - p.quantitySold)), 0);
    const productsInStock = products.reduce((acc, p) => acc + (p.quantity - p.quantitySold), 0);
    const productsSolds = products.reduce((acc, p) => acc + p.quantitySold, 0);
    const averageMargin = products.length > 0 ? products.reduce((acc, p) => acc + p.profitMargin, 0) / products.length : 0;

    return {
        totalInvested,
        totalActualProfit,
        projectedProfit,
        productsInStock,
        productsSolds,
        averageMargin
    }
  }, [products]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const handleOpenForm = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsFormOpen(true);
    setSelectedProduct(null);
  };

  const handleSaveProduct = (productData: Product) => {
    if(productToEdit) {
      // Editar
      const updatedProducts = products.map(p => p.id === productToEdit.id ? { ...p, ...productData, id: p.id } : p)
      setProducts(updatedProducts);
       toast({
        title: "Produto Atualizado!",
        description: `O produto "${productData.name}" foi atualizado com sucesso.`,
      });
    } else {
       // Adicionar
      const newProduct: Product = {
        ...productData,
        id: new Date().getTime().toString(),
        sales: [],
      }
      setProducts(prev => [newProduct, ...prev]);
       toast({
        title: "Produto Adicionado!",
        description: `O produto "${productData.name}" foi adicionado com sucesso.`,
      });
    }

    setIsFormOpen(false);
    setProductToEdit(null);
  }

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setProducts(products.filter(p => p.id !== productId));
    setProductToDelete(null);
    setSelectedProduct(null);
    toast({
        variant: 'destructive',
        title: "Produto Excluído!",
        description: `O produto "${product.name}" foi excluído com sucesso.`,
    });
  }
  
  const handleRegisterSale = (product: Product, saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
        ...saleData,
        id: new Date().getTime().toString(),
        date: new Date(),
    }

    const updatedProducts = products.map(p => {
        if (p.id === product.id) {
            const newQuantitySold = p.quantitySold + saleData.quantity;
            const newActualProfit = p.expectedProfit * newQuantitySold;
            const newStatus = newQuantitySold >= p.quantity ? 'sold' : p.status;
            
            return {
                ...p,
                quantitySold: newQuantitySold,
                actualProfit: newActualProfit,
                status: newStatus,
                sales: [...(p.sales || []), newSale]
            }
        }
        return p;
    });

    setProducts(updatedProducts);
    setIsSaleFormOpen(false);
    setSelectedProduct(null);
     toast({
        title: "Venda Registrada!",
        description: `${saleData.quantity} unidade(s) de "${product.name}" vendida(s).`,
    });
  }

  const handlePasswordSuccess = (path: 'sonhos' | 'apostas') => {
    setIsPasswordDialogOpen(false);
    router.push(`/${path}`);
  };


  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header onSecretClick={() => setIsPasswordDialogOpen(true)} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-1">
                Dashboard de Produtos
              </h2>
              <p className="text-muted-foreground">
                Gerencie seus produtos, custos e analise sua rentabilidade.
              </p>
            </div>
            <Button size="lg" onClick={() => handleOpenForm()} className="w-full md:w-auto">
                <PlusCircle className="mr-2"/>
                Adicionar Produto
            </Button>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                 {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[116px] w-full" />
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <SummaryCard 
                    title="Total Investido"
                    value={summaryStats.totalInvested}
                    icon={DollarSign}
                    isCurrency
                />
                <SummaryCard 
                    title="Lucro Realizado"
                    value={summaryStats.totalActualProfit}
                    icon={TrendingUp}
                    isCurrency
                />
                <SummaryCard 
                    title="Lucro Potencial"
                    value={summaryStats.projectedProfit}
                    icon={Target}
                    isCurrency
                />
                <SummaryCard 
                    title="Produtos em Estoque"
                    value={summaryStats.productsInStock}
                    icon={Package}
                />
                 <SummaryCard 
                    title="Produtos Vendidos"
                    value={summaryStats.productsSolds}
                    icon={ShoppingCart}
                />
            </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3">
                <ProfitChart data={products} isLoading={isLoading}/>
            </div>
            <div className="lg:col-span-2">
                <CategoryChart data={products} isLoading={isLoading}/>
            </div>
        </div>


        <div className="mb-8">
            <ProductSearch onSearch={handleSearch} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[350px] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium">Nenhum Produto Encontrado</h3>
            <p className="text-muted-foreground">
              Tente um termo de busca diferente ou adicione um novo produto.
            </p>
          </div>
        )}
      </main>

      <Dialog
        open={!!selectedProduct || isFormOpen || isSaleFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedProduct(null);
            setIsFormOpen(false);
            setProductToEdit(null);
            setIsSaleFormOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          {isFormOpen ? (
            <ProductForm 
                onSave={handleSaveProduct}
                productToEdit={productToEdit}
                onCancel={() => {
                  setIsFormOpen(false)
                  setProductToEdit(null)
                }}
            />
          ) : isSaleFormOpen && selectedProduct ? (
             <SaleForm
                product={selectedProduct}
                onSave={(saleData) => handleRegisterSale(selectedProduct, saleData)}
                onCancel={() => {
                    setIsSaleFormOpen(false)
                    setSelectedProduct(null)
                }}
             />
          ) : selectedProduct ? (
            <ProductDetailView 
                product={selectedProduct} 
                onEdit={() => handleOpenForm(selectedProduct)}
                onDelete={() => setProductToDelete(selectedProduct)}
                onRegisterSale={() => setIsSaleFormOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>

    <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive"/>
                    Você tem certeza absoluta?
                </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto <strong className="text-foreground">"{productToDelete?.name}"</strong> de seus registros.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}>
                Sim, excluir produto
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    <PasswordDialog 
        isOpen={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        onSuccess={handlePasswordSuccess}
    />
    </>
  );
}
