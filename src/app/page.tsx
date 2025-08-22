
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import type { Product, Sale } from "@/types";
import { Header } from "@/components/layout/header";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductForm } from "@/components/product/product-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Target, Archive } from "lucide-react";
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
import { SupplierChart } from "@/components/dashboard/supplier-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExtendedSale extends Sale {
  productName?: string;
  productId?: string;
}

// Função utilitária para limpar dados undefined
const cleanUndefinedValues = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }));
};

const initialProducts: Product[] = [];


export default function Home() {
  const { user, loading: authLoading, isPro, openUpgradeModal } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [selectedSalesProduct, setSelectedSalesProduct] = useState<string>("all");
  const [salesDateFilter, setSalesDateFilter] = useState<string>("all");
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
                sales: p.sales ? p.sales.map((s: any) => ({
                    ...s, 
                    date: s.date?.toDate ? s.date.toDate() : 
                          typeof s.date === 'string' ? new Date(s.date) : 
                          new Date(s.date)
                })) : [],
            }));
            console.log('📥 Produtos carregados:', parsedProducts.length);
            console.log('📦 Produtos com vendas:', parsedProducts.filter((p: any) => p.sales && p.sales.length > 0).map((p: any) => ({ name: p.name, salesCount: p.sales.length })));
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
            
            // Limpar dados undefined antes de salvar
            const cleanProducts = products.map(product => cleanUndefinedValues(product));
            
            console.log('💾 Salvando produtos no Firestore:', cleanProducts.length, 'produtos');
            console.log('📊 Produtos com vendas:', cleanProducts.filter(p => p.sales && p.sales.length > 0).map(p => ({ name: p.name, salesCount: p.sales.length })));
            
            await setDoc(docRef, { products: cleanProducts }, { merge: true });
            console.log('✅ Produtos salvos com sucesso no Firestore');
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
    const lowStockCount = products.filter(p => (p.quantity - p.quantitySold) <= 2 && p.status !== 'sold').length;

    return {
        totalInvested,
        totalActualProfit,
        projectedProfit,
        productsInStock,
        productsSolds,
        lowStockCount,
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
     const sanitizedProductData = cleanUndefinedValues(productData);

    if(productToEdit) {
      // Editar
      const updatedProducts = products.map(p => p.id === productToEdit.id ? { ...p, ...sanitizedProductData, id: p.id } : p)
      setProducts(updatedProducts);
       toast({
        title: "Produto Atualizado!",
        description: `O produto "${productData.name}" foi atualizado com sucesso.`,
      });
    } else {
       // Adicionar
      const newProduct: Product = {
        ...sanitizedProductData,
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
    console.log('🔄 Registrando venda:', { product: product.name, saleData });
    
    // Limpar dados undefined da venda
    const cleanSaleData = cleanUndefinedValues(saleData);
    
    const newSale: Sale = {
        ...cleanSaleData,
        id: new Date().getTime().toString(),
        date: new Date(),
    }
    
    console.log('📝 Nova venda criada:', newSale);

    const updatedProducts = products.map(p => {
        if (p.id === product.id) {
            const newQuantitySold = p.quantitySold + saleData.quantity;
            const newActualProfit = p.expectedProfit * newQuantitySold;
            const newStatus = newQuantitySold >= p.quantity ? 'sold' : p.status;
            
            // Calculate days to sell
            const salesHistory = [...(p.sales || []), newSale].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let daysToSell;
            if (newStatus === 'sold') {
                const purchaseDate = new Date(p.purchaseDate).getTime();
                const lastSaleDate = new Date(salesHistory[salesHistory.length - 1].date).getTime();
                daysToSell = Math.ceil((lastSaleDate - purchaseDate) / (1000 * 60 * 60 * 24));
            }

            return {
                ...p,
                quantitySold: newQuantitySold,
                actualProfit: newActualProfit,
                status: newStatus,
                sales: salesHistory,
                daysToSell: daysToSell ?? p.daysToSell,
            }
        }
        return p;
    });

    console.log('📊 Produtos atualizados:', updatedProducts.find(p => p.id === product.id));
    
    setProducts(updatedProducts);
    setIsSaleFormOpen(false);
    setSelectedProduct(null);
     toast({
        title: "Venda Registrada!",
        description: `${saleData.quantity} unidade(s) de "${product.name}" vendida(s).`,
    });
  }

  // Funções para o histórico de vendas
  const allSales = useMemo(() => {
    const sales: ExtendedSale[] = [];
    products.forEach((product) => {
      if (product.sales && product.sales.length > 0) {
        console.log(`📦 Produto ${product.name} tem ${product.sales.length} vendas:`, product.sales);
        product.sales.forEach((sale: Sale) => {
          sales.push({
            ...sale,
            productName: product.name,
            productId: product.id
          });
        });
      }
    });
    console.log('🛒 Total de vendas encontradas:', sales.length);
    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [products]);

  const filteredSales = useMemo(() => {
    let filtered = [...allSales];

    // Filtro por termo de busca
    if (salesSearchTerm) {
      filtered = filtered.filter(sale => 
        sale.productName?.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
        sale.buyerName?.toLowerCase().includes(salesSearchTerm.toLowerCase())
      );
    }

    // Filtro por produto
    if (selectedSalesProduct !== "all") {
      filtered = filtered.filter(sale => sale.productId === selectedSalesProduct);
    }

    // Filtro por data
    if (salesDateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (salesDateFilter) {
        case "today":
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= today;
          });
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= monthAgo;
          });
          break;
      }
    }

    return filtered;
  }, [allSales, salesSearchTerm, selectedSalesProduct, salesDateFilter]);

  const salesStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((total, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return total + (product?.sellingPrice || 0) * sale.quantity;
    }, 0);

    const totalItems = filteredSales.reduce((total, sale) => total + sale.quantity, 0);
    const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return { totalRevenue, totalItems, averageTicket };
  }, [filteredSales, products]);

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
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

        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="dashboard">Dashboard Geral</TabsTrigger>
                <TabsTrigger value="suppliers">Análise de Fornecedores</TabsTrigger>
                <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
                 {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-[116px] w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                        <SummaryCard 
                            title="Alerta de Estoque Baixo"
                            value={summaryStats.lowStockCount}
                            icon={Archive}
                            className={summaryStats.lowStockCount > 0 ? "text-destructive" : ""}
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

                {/* Seção de Produtos */}
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
            </TabsContent>
            <TabsContent value="suppliers">
                 <div className="grid grid-cols-1 gap-6 mb-8">
                    <SupplierChart data={products} isLoading={isLoading} isPro={isPro} onUpgradeClick={openUpgradeModal} />
                </div>
            </TabsContent>
            <TabsContent value="sales">
                <div className="space-y-6">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <Input
                                placeholder="Produto ou comprador..."
                                value={salesSearchTerm}
                                onChange={(e) => setSalesSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Produto</label>
                            <Select value={selectedSalesProduct} onValueChange={setSelectedSalesProduct}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os produtos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os produtos</SelectItem>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Período</label>
                            <Select value={salesDateFilter} onValueChange={setSalesDateFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os períodos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os períodos</SelectItem>
                                    <SelectItem value="today">Hoje</SelectItem>
                                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                                    <SelectItem value="month">Últimos 30 dias</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard 
                            title="Receita Total"
                            value={salesStats.totalRevenue}
                            icon={DollarSign}
                            isCurrency
                        />
                        <SummaryCard 
                            title="Itens Vendidos"
                            value={salesStats.totalItems}
                            icon={ShoppingCart}
                        />
                        <SummaryCard 
                            title="Ticket Médio"
                            value={salesStats.averageTicket}
                            icon={TrendingUp}
                            isCurrency
                        />
                    </div>

                    {/* Tabela de Vendas */}
                    <div className="border rounded-lg">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
                            <p className="text-sm text-muted-foreground">
                                {filteredSales.length} vendas encontradas
                            </p>
                        </div>
                        <div className="p-6">
                            {filteredSales.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-center">Quantidade</TableHead>
                                            <TableHead>Comprador</TableHead>
                                            <TableHead className="text-right">Valor Unitário</TableHead>
                                            <TableHead className="text-right">Valor Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSales.map((sale) => {
                                            const product = products.find(p => p.id === sale.productId);
                                            const unitPrice = product?.sellingPrice || 0;
                                            const totalPrice = unitPrice * sale.quantity;
                                            
                                            return (
                                                <TableRow key={`${sale.productId}-${sale.date}-${sale.quantity}`}>
                                                    <TableCell>
                                                        {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{sale.productName || "N/A"}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{sale.quantity}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {sale.buyerName || "Não informado"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nenhuma venda encontrada</h3>
                                    <p className="text-muted-foreground">
                                        {allSales.length === 0 
                                            ? "Você ainda não registrou nenhuma venda." 
                                            : "Tente ajustar os filtros para encontrar mais vendas."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
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
                <DialogContent className="max-w-4xl p-0 max-h-[95vh] overflow-hidden">
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
             <div className="p-6">
               <SaleForm
                  product={selectedProduct}
                  onSave={(saleData) => handleRegisterSale(selectedProduct, saleData)}
                  onCancel={() => {
                      setIsSaleFormOpen(false)
                      setSelectedProduct(null)
                  }}
               />
             </div>
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
    
    </>
  );
}

    
