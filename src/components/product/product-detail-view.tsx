
"use client";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { ExternalLink, Trash2, Pencil, Info, AlertTriangle, NotebookText, ShoppingCart, History } from "lucide-react";

import type { Product, Sale } from "@/types";
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
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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

  // Buscar imagem principal ou usar imageUrl como fallback
  const mainImage = product.images?.find(img => img.type === 'main')?.url || 
                   product.images?.[0]?.url || 
                   product.imageUrl || 
                   "/placeholder-product.svg";

  // Garantir que não seja uma string vazia
  const imageSrc = mainImage && mainImage.trim() !== "" ? mainImage : "/placeholder-product.svg";

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header com imagem menor */}
        <div className="flex-shrink-0 p-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Imagem menor e responsiva */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
              <SafeImage
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product thumbnail"
              />
            </div>
            
            {/* Informações principais */}
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <div className="flex items-center justify-between mb-3">
                  <Badge className={`border-transparent text-white text-sm ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {new Date(product.purchaseDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight mb-2">{product.name}</DialogTitle>
                {product.description && (
                  <DialogDescription className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {product.description}
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>
          </div>
        </div>
        
        {/* Conteúdo com Rolagem */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-4">
          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="sales">Vendas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="financial" className="space-y-6">
              {/* Cards de métricas principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Preço de Venda</span>
                  <span className="text-lg font-bold text-primary">
                    {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Custo Total</span>
                  <span className="text-lg font-bold text-destructive">
                    {product.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Lucro Esperado</span>
                  <span className={`text-lg font-bold ${product.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.expectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Margem/ROI</span>
                  <div className="flex justify-center gap-1 mt-1">
                    <Badge variant={isLowProfit ? "destructive" : "outline"} className={!isLowProfit ? "text-green-600 border-green-600" : ""}>
                      {isLowProfit && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {product.profitMargin.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">{product.roi.toFixed(1)}%</Badge>
                  </div>
                </div>
              </div>
              
              {/* Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Estoque Atual</span>
                  <span className="text-lg font-bold">
                    {product.quantity - product.quantitySold} / {product.quantity}
                  </span>
                </div>
                
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-2">Vendidos</span>
                  <span className="text-lg font-bold text-green-600">
                    {product.quantitySold}
                  </span>
                </div>
                
                {product.daysToSell !== undefined && (
                  <div className="p-4 bg-secondary/50 rounded-lg text-center col-span-2">
                    <span className="text-xs text-muted-foreground block mb-2">Tempo para Esgotar</span>
                    <span className="text-lg font-bold">
                      {product.daysToSell} dias
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-6">
              <h3 className="font-semibold text-lg">Histórico de Vendas</h3>
              {product.sales && product.sales.length > 0 ? (
                <div className="space-y-3">
                  {product.sales.map((sale: Sale) => (
                    <div key={sale.id} className="p-4 bg-secondary/50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{sale.buyerName || 'Cliente'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Qtd: {sale.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma venda registrada ainda.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {product.notes && (
            <div className='mt-6'>
              <h4 className='font-semibold flex items-center gap-2 mb-3'><NotebookText className="w-5 h-5 text-primary"/> Anotações Pessoais</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/50 p-4 rounded-lg">{product.notes}</p>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex-shrink-0 p-6 pt-6 border-t bg-background">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRegisterSale} disabled={isSoldOut} className="flex-1">
              <ShoppingCart className="mr-2 h-4 w-4"/>
              {isSoldOut ? 'Esgotado' : 'Registrar Venda'}
            </Button>
            <Button onClick={onEdit} variant="outline" className="flex-1">
              <Pencil className="mr-2 h-4 w-4"/>
              Editar
            </Button>
            <Button onClick={onDelete} variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4"/>
              Excluir
            </Button>
          </div>
          
          {product.aliexpressLink && (
            <Button asChild variant="link" className="mt-2 w-full text-sm">
              <Link href={product.aliexpressLink} target="_blank">
                Ver no AliExpress
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
