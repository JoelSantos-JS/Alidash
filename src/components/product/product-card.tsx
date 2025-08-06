import Image from "next/image";
import { Star } from "lucide-react";

import type { Product } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProductCardProps = {
  product: Product;
  onSelect: () => void;
};

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card
      className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={onSelect}
    >
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            data-ai-hint="product image"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-base font-semibold leading-tight mb-2 h-10">
          {product.title}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{product.rating}</span>
          </div>
          <span>({product.reviews.toLocaleString()})</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Badge variant="secondary" className="text-lg font-bold text-primary">
          ${product.price}
        </Badge>
      </CardFooter>
    </Card>
  );
}
