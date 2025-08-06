"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/types";
import { Header } from "@/components/layout/header";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Mock data to simulate fetching from an API
const allProducts: Product[] = [
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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSearch = (query: string) => {
    setIsLoading(true);
    // Simula um atraso de API
    setTimeout(() => {
      setSearchTerm(query);
      setIsLoading(false);
    }, 500);
  };

  return (
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
            <Button size="lg">
                <PlusCircle className="mr-2"/>
                Adicionar Produto
            </Button>
        </div>


        <div className="mb-8">
            <ProductSearch onSearch={handleSearch} isLoading={isLoading} />
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
              Tente um termo de busca diferente.
            </p>
          </div>
        )}
      </main>

      <Dialog
        open={!!selectedProduct}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          {selectedProduct && <ProductDetailView product={selectedProduct} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
