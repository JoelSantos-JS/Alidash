"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Trash2, Pencil, Info, AlertTriangle, NotebookText, ShoppingCart } from "lucide-react";

import type { Product } from "@/types";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProductDetailViewProps = {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onRegisterSale: () => void;
};

const statusMap = {
    purchased: { label: 'Comprado', color: 'bg-blue-500' },
    shipping: { label: 'Em trânsito', color: 'bg-yellow-500' },
    received: { label: 'Recebido', color: 'bg-indigo-500' },
    selling: { label: 'À venda', color: 'bg-green-500' },
    sold: { label: 'Esgotado', color: 'bg-gray-500' },
}

export function ProductDetailView({ product, onEdit, onDelete, onRegisterSale }: ProductDetailViewProps) {
  const statusInfo = statusMap[product.status];
  const isLowProfit = product.profitMargin < 15;
  const isSoldOut = product.status === 'sold';

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh]">
        <div className="relative aspect-square md:aspect-auto hidden md:block">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover md:rounded-l-lg"
            data-ai-hint="product lifestyle"
          />
        </div>
        <div className="p-6 flex flex-col overflow-y-auto">
          <div className="relative aspect-square md:hidden -mx-6 -mt-6 mb-6">
             <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product lifestyle"
              />
          </div>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge className={`border-transparent text-white text-sm ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Comprado em: {new Date(product.purchaseDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold pt-2">{product.name}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground pt-1">
              {product.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 py-6 border-y grid grid-cols-2 gap-x-6 gap-y-4">
            <h3 className="font-semibold text-lg col-span-2">Análise Financeira</h3>
            
            <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-sm text-muted-foreground">Preço de Venda</span>
                <span className="text-xl font-bold text-primary">
                    {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

             <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-sm text-muted-foreground">Custo Total</span>
                <span className="text-xl font-bold text-destructive">
                    {product.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

             <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-sm text-muted-foreground">Lucro Esperado</span>
                <span className={`text-xl font-bold ${product.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.expectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">Margem/ROI</span>
                     <Tooltip delayDuration={100}>
                        <TooltipTrigger>
                            <Info className="w-3.5 h-3.5 text-muted-foreground"/>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Margem de Lucro / Retorno Sobre Investimento</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={isLowProfit ? "destructive" : "outline"} className={!isLowProfit ? "text-green-600 border-green-600" : ""}>
                        {isLowProfit && <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                        {product.profitMargin.toFixed(2)}%
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">{product.roi.toFixed(2)}%</Badge>
                </div>
            </div>

            <h3 className="font-semibold text-lg col-span-2 mt-4">Estoque</h3>
             <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-sm text-muted-foreground">Estoque Atual</span>
                <span className="text-xl font-bold">
                    {product.quantity - product.quantitySold} / {product.quantity}
                </span>
            </div>
             <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-md">
                <span className="text-sm text-muted-foreground">Vendidos</span>
                <span className="text-xl font-bold">
                    {product.quantitySold}
                </span>
            </div>
            
          </div>
          
           {product.notes && (
             <div className='mt-4'>
                <h4 className='font-semibold flex items-center gap-2 mb-2'><NotebookText className="w-5 h-5 text-primary"/> Anotações Pessoais</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-3 rounded-md">{product.notes}</p>
             </div>
           )}

          <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={onRegisterSale} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-base py-6" disabled={isSoldOut}>
                  <ShoppingCart className="mr-2 h-5 w-5"/>
                  {isSoldOut ? 'Esgotado' : 'Registrar Venda'}
              </Button>
               <Button onClick={onEdit} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-base py-6">
                  <Pencil className="mr-2 h-5 w-5"/>
                  Editar
              </Button>
               <Button onClick={onDelete} variant="destructive" className="flex-1 text-base py-6">
                  <Trash2 className="mr-2 h-5 w-5"/>
                  Excluir
              </Button>
          </div>
           <Button asChild variant="link" className="mt-2 text-base">
                  <Link href={product.aliexpressLink} target="_blank">
                      Ver no AliExpress
                      <ExternalLink className="ml-2 h-5 w-5" />
                  </Link>
              </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
