"use client";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { ExternalLink, Trash2, Pencil, ShoppingCart, Eye, AlertTriangle } from "lucide-react";

import type { Product } from "@/types";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductEditMenuProps = {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onRegisterSale: () => void;
  onViewDetails: () => void;
};

const statusMap = {
    purchased: { label: 'Comprado', color: 'bg-blue-500' },
    shipping: { label: 'Em trânsito', color: 'bg-yellow-500' },
    received: { label: 'Recebido', color: 'bg-indigo-500' },
    selling: { label: 'À venda', color: 'bg-green-500' },
    sold: { label: 'Esgotado', color: 'bg-gray-500' },
}

export function ProductEditMenu({ product, onEdit, onDelete, onRegisterSale, onViewDetails }: ProductEditMenuProps) {
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
  const isLowProfit = product.profitMargin < 15;
  const isSoldOut = availableStock <= 0;

  // Buscar imagem principal ou usar imageUrl como fallback
  const mainImage = product.images?.find(img => img.type === 'main')?.url || 
                   product.images?.[0]?.url || 
                   product.imageUrl || 
                   "/placeholder-product.svg";

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <DialogHeader className="flex-shrink-0 p-6 pb-4">
        <DialogTitle className="text-xl font-bold">Ações do Produto</DialogTitle>
        <DialogDescription>
          Escolha uma ação para realizar com este produto
        </DialogDescription>
      </DialogHeader>

      {/* Informações básicas do produto */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0">
            <SafeImage
              src={mainImage}
              alt={product.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={cn("text-white text-xs", statusInfo.color)}
              >
                {statusInfo.label}
              </Badge>
              
              {isLowProfit && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Baixo Lucro
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-muted-foreground">
                Estoque: {availableStock}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação principais */}
      <div className="flex-1 px-6 pb-4">
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={onRegisterSale} 
            disabled={isSoldOut} 
            className="h-12 text-left justify-start"
            size="lg"
          >
            <ShoppingCart className="mr-3 h-5 w-5"/>
            <div>
              <div className="font-medium">
                {isSoldOut ? 'Produto Esgotado' : 'Registrar Venda'}
              </div>
              <div className="text-xs opacity-80">
                {isSoldOut ? 'Sem estoque disponível' : 'Registrar uma nova venda'}
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={onEdit} 
            variant="outline" 
            className="h-12 text-left justify-start"
            size="lg"
          >
            <Pencil className="mr-3 h-5 w-5"/>
            <div>
              <div className="font-medium">Editar Produto</div>
              <div className="text-xs text-muted-foreground">
                Alterar informações e preços
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={onViewDetails} 
            variant="outline" 
            className="h-12 text-left justify-start"
            size="lg"
          >
            <Eye className="mr-3 h-5 w-5"/>
            <div>
              <div className="font-medium">Ver Detalhes</div>
              <div className="text-xs text-muted-foreground">
                Visualizar informações completas
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={onDelete} 
            variant="destructive" 
            className="h-12 text-left justify-start"
            size="lg"
          >
            <Trash2 className="mr-3 h-5 w-5"/>
            <div>
              <div className="font-medium">Excluir Produto</div>
              <div className="text-xs opacity-80">
                Remover permanentemente
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Link para AliExpress se disponível */}
      {product.aliexpressLink && (
        <div className="flex-shrink-0 px-6 pb-6">
          <Button asChild variant="link" className="w-full text-sm">
            <Link href={product.aliexpressLink} target="_blank">
              Ver no AliExpress
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}