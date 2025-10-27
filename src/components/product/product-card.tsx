import { DollarSign, Package, TrendingUp, Clock, Edit, Trash2, ShoppingCart, MoreVertical } from "lucide-react";

import type { Product } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProductCardProps = {
  product: Product;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSell?: () => void;
};

const statusMap = {
    purchased: { label: 'Comprado', color: 'bg-blue-500' },
    shipping: { label: 'Em trânsito', color: 'bg-yellow-500' },
    received: { label: 'Recebido', color: 'bg-indigo-500' },
    selling: { label: 'À venda', color: 'bg-green-500' },
    sold: { label: 'Esgotado', color: 'bg-gray-500' },
}

export function ProductCard({ product, onClick, onEdit, onDelete, onSell }: ProductCardProps) {
  // Calcular estoque disponível
  const availableStock = product.quantity - product.quantitySold;
  
  // Determinar status real baseado no estoque
  let actualStatus = product.status;
  if (availableStock <= 0 && product.status !== 'purchased' && product.status !== 'shipping') {
    actualStatus = 'sold';
  } else if (availableStock > 0 && product.status === 'sold') {
    // Se tem estoque mas está marcado como vendido, mudar para "selling"
    actualStatus = 'selling';
  }
  
  const statusInfo = statusMap[actualStatus];

  // Buscar imagem principal ou usar imageUrl como fallback
  const mainImage = product.images?.find(img => img.type === 'main')?.url || 
                   product.images?.[0]?.url || 
                   product.imageUrl || 
                   "/placeholder-product.svg";

  // Garantir que não seja uma string vazia
  const imageSrc = mainImage && mainImage.trim() !== "" ? mainImage : "/placeholder-product.svg";

  return (
    <Card
      className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-0 relative">
        <div className="aspect-square relative">
          <SafeImage
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint="product image"
          />
        </div>
        <Badge className={`absolute top-1 right-1 sm:top-2 sm:right-2 border-transparent text-white text-xs sm:text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
        {(onEdit || onDelete || onSell) && (
          <div className="absolute top-2 left-2 sm:top-2 sm:left-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 sm:h-6 sm:w-6 p-0 bg-white/95 hover:bg-white shadow-md border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 sm:h-3 sm:w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()} className="w-48">
                {onSell && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onSell(); }}
                    className="py-3 px-4 text-sm font-medium"
                  >
                    <ShoppingCart className="mr-3 h-4 w-4" />
                    Registrar Venda
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="py-3 px-4 text-sm font-medium"
                  >
                    <Edit className="mr-3 h-4 w-4" />
                    Editar Produto
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="py-3 px-4 text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Excluir Produto
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3 sm:p-4 flex-1">
        <CardTitle className="text-sm sm:text-base font-semibold leading-tight mb-2 min-h-8 sm:min-h-10 line-clamp-2">
          {product.name}
        </CardTitle>
        <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"/>
                <span className="truncate">{availableStock} em estoque</span>
            </div>
             {product.daysToSell !== undefined && (
                 <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"/>
                    <span className="truncate">Vendido em {product.daysToSell} dias</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 min-w-0 flex-1">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0"/>
            <span className="text-sm sm:text-lg font-bold text-primary truncate">
            {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
        </div>
        <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4"/>
            <span className="font-medium text-xs sm:text-sm">{product.profitMargin.toFixed(1)}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}
