"use client";

import { useState, useMemo, useEffect } from "react";
import type { Product } from "@/types";
import { Header } from "@/components/layout/header";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductForm } from "@/components/product/product-form";
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

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Smartwatch Pro X",
    category: "Eletrônicos",
    supplier: "Top-rated Tech Store",
    aliexpressLink: "#",
    imageUrl: "https://placehold.co/600x600.png",
    description: "Um smartwatch de última geração com tela AMOLED, monitoramento cardíaco, GPS e bateria de longa duração.",
    purchasePrice: 79.99,
    shippingCost: 5.0,
    importTaxes: 15.0,
    packagingCost: 1.5,
    marketingCost: 10.0,
    otherCosts: 0,
    totalCost: 111.49,
    sellingPrice: 149.99,
    expectedProfit: 38.5,
    profitMargin: 25.67,
    quantity: 50,
    quantitySold: 10,
    status: 'selling',
    purchaseDate: new Date("2023-10-01"),
    roi: 34.53,
    actualProfit: 385.0,
  },
  {
    id: "2",
    name: "Fones de Ouvido Sem Fio",
    category: "Áudio",
    supplier: "AudioPhile Inc.",
    aliexpressLink: "#",
    imageUrl: "https://placehold.co/600x600.png",
    description: "Mergulhe em um som cristalino com estes fones de ouvido ergonômicos sem fio.",
    purchasePrice: 49.99,
    shippingCost: 3.5,
    importTaxes: 10.0,
    packagingCost: 1.0,
    marketingCost: 8.0,
    otherCosts: 0,
    totalCost: 72.49,
    sellingPrice: 99.99,
    expectedProfit: 27.5,
    profitMargin: 27.5,
    quantity: 100,
    quantitySold: 35,
    status: 'selling',
    purchaseDate: new Date("2023-09-15"),
    roi: 37.94,
    actualProfit: 962.5,
  },
   {
    id: "3",
    name: "Liquidificador Portátil",
    category: "Casa e Cozinha",
    supplier: "Kitchen Gadgets Co.",
    aliexpressLink: "#",
    imageUrl: "https://placehold.co/600x600.png",
    description: "Desfrute de smoothies frescos em qualquer lugar com este liquidificador portátil recarregável por USB.",
    purchasePrice: 25.50,
    shippingCost: 2.0,
    importTaxes: 5.0,
    packagingCost: 0.75,
    marketingCost: 5.0,
    otherCosts: 0,
    totalCost: 38.25,
    sellingPrice: 49.99,
    expectedProfit: 11.74,
    profitMargin: 23.48,
    quantity: 200,
    quantitySold: 150,
    status: 'selling',
    purchaseDate: new Date("2023-11-05"),
    roi: 30.7,
    actualProfit: 1761,
  },
  {
    id: "4",
    name: "Luminária de Mesa LED com Carregador",
    category: "Iluminação",
    supplier: "Modern Lighting",
    aliexpressLink: "#",
    imageUrl: "https://placehold.co/600x600.png",
    description: "Luminária de mesa LED moderna e minimalista com níveis de brilho ajustáveis e carregador sem fio.",
    purchasePrice: 32.00,
    shippingCost: 4.0,
    importTaxes: 8.0,
    packagingCost: 1.2,
    marketingCost: 6.0,
    otherCosts: 0,
    totalCost: 51.20,
    sellingPrice: 69.99,
    expectedProfit: 18.79,
    profitMargin: 26.85,
    quantity: 80,
    quantitySold: 20,
    status: 'selling',
    purchaseDate: new Date("2023-10-20"),
    roi: 36.7,
    actualProfit: 375.8,
  },
];

const LOCAL_STORAGE_KEY = 'product-dash-products';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts).map((p: any) => ({
          ...p,
          purchaseDate: new Date(p.purchaseDate),
          saleDate: p.saleDate ? new Date(p.saleDate) : undefined,
        }));
        setProducts(parsedProducts);
      } else {
        setProducts(initialProducts);
      }
    } catch (error) {
      console.error("Failed to load products from localStorage", error);
      setProducts(initialProducts);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if(!isLoading) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
        } catch (error) {
            console.error("Failed to save products to localStorage", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Dados",
                description: "Não foi possível salvar os produtos no seu navegador. Suas alterações podem ser perdidas.",
            })
        }
    }
  }, [products, isLoading, toast]);


  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const summaryStats = useMemo(() => {
    const totalInvested = products.reduce((acc, p) => acc + (p.totalCost * p.quantity), 0);
    const totalActualProfit = products.reduce((acc, p) => acc + p.actualProfit, 0);
    const projectedProfit = products.reduce((acc, p) => acc + (p.expectedProfit * p.quantity), 0);
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
        id: new Date().getTime().toString(), // better unique id
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


  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-1">
                Dashboard de Produtos
              </h2>
              <p className="text-muted-foreground">
                Gerencie seus produtos, custos e analise sua rentabilidade.
              </p>
            </div>
            <Button size="lg" onClick={() => handleOpenForm()}>
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
        open={!!selectedProduct || isFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedProduct(null);
            setIsFormOpen(false);
            setProductToEdit(null);
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
          ) : selectedProduct ? (
            <ProductDetailView 
                product={selectedProduct} 
                onEdit={() => {
                    handleOpenForm(selectedProduct);
                    setSelectedProduct(null);
                }}
                onDelete={() => {
                    setProductToDelete(selectedProduct);
                }}
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
