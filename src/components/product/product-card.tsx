import Image from "next/image";
import { DollarSign, Package, TrendingUp, Clock } from "lucide-react";

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
        <Badge className={`absolute top-1 right-1 sm:top-2 sm:right-2 border-transparent text-white text-xs sm:text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-1">
        <CardTitle className="text-sm sm:text-base font-semibold leading-tight mb-2 min-h-8 sm:min-h-10">
          {product.name}
        </CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Package className="w-3 h-3 sm:w-4 sm:h-4"/>
                <span>{product.quantity - product.quantitySold} em estoque</span>
            </div>
             {product.daysToSell !== undefined && (
                 <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4"/>
                    <span>Vendido em {product.daysToSell} dias</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary"/>
            <span className="text-base sm:text-lg font-bold text-primary">
            {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4"/>
            <span className="font-medium text-xs sm:text-sm">{product.profitMargin.toFixed(2)}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}
