import Image from "next/image";
import { DollarSign, Package, TrendingUp } from "lucide-react";

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

const statusMap = {
    purchased: { label: 'Comprado', color: 'bg-blue-500' },
    shipping: { label: 'Em trânsito', color: 'bg-yellow-500' },
    received: { label: 'Recebido', color: 'bg-indigo-500' },
    selling: { label: 'À venda', color: 'bg-green-500' },
    sold: { label: 'Esgotado', color: 'bg-gray-500' },
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const statusInfo = statusMap[product.status];

  return (
    <Card
      className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={onSelect}
    >
      <CardHeader className="p-0 relative">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint="product image"
          />
        </div>
        <Badge className={`absolute top-2 right-2 border-transparent text-white ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-base font-semibold leading-tight mb-2 h-10">
          {product.name}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Package className="w-4 h-4"/>
                <span>{product.quantity - product.quantitySold} em estoque</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-1">
            <DollarSign className="w-5 h-5 text-primary"/>
            <span className="text-lg font-bold text-primary">
            {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-4 h-4"/>
            <span className="font-medium text-sm">{product.profitMargin.toFixed(2)}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}
