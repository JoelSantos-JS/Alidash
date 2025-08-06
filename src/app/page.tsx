"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/types";
import { Header } from "@/components/layout/header";
import { ProductSearch } from "@/components/product/product-search";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data to simulate fetching from an API
const allProducts: Product[] = [
  {
    id: "1",
    title: "Smartwatch Pro X",
    description:
      "A high-end smartwatch with a vibrant AMOLED display, heart rate monitoring, GPS, and a week-long battery life. Perfect for fitness enthusiasts and tech lovers.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.8,
    reviews: 1250,
    price: "79.99",
  },
  {
    id: "2",
    title: "Wireless Earbuds with Noise Cancellation",
    description:
      "Immerse yourself in crystal-clear audio with these ergonomic wireless earbuds. Featuring active noise cancellation and a compact charging case.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.6,
    reviews: 3400,
    price: "49.99",
  },
  {
    id: "3",
    title: "Portable Blender for Smoothies",
    description:
      "Enjoy fresh smoothies on the go with this USB-rechargeable portable blender. Powerful, compact, and easy to clean.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.9,
    reviews: 2100,
    price: "25.50",
  },
  {
    id: "4",
    title: "LED Desk Lamp with Wireless Charger",
    description:
      "Modern and minimalist LED desk lamp that features adjustable brightness levels and a built-in wireless charging pad for your phone.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.7,
    reviews: 890,
    price: "32.00",
  },
  {
    id: "5",
    title: "Ergonomic Memory Foam Seat Cushion",
    description:
      "Improve your posture and comfort with this high-quality memory foam seat cushion. Ideal for office chairs, car seats, and long periods of sitting.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.8,
    reviews: 1500,
    price: "29.99",
  },
  {
    id: "6",
    title: "4K Drone with HD Camera",
    description:
      "Capture stunning aerial footage with this foldable 4K drone. Features include a 3-axis gimbal, intelligent flight modes, and a 30-minute flight time.",
    imageUrl: "https://placehold.co/600x600.png",
    productUrl: "#",
    rating: 4.5,
    reviews: 750,
    price: "199.99",
  },
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    return allProducts.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSearch = (query: string) => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setSearchTerm(query);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-center mb-2">
            Unlock Investment Insights
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Search for AliExpress products by keyword to generate AI-powered
            analysis and investment ideas.
          </p>
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
            <h3 className="text-xl font-medium">No Products Found</h3>
            <p className="text-muted-foreground">
              Try a different search term.
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
