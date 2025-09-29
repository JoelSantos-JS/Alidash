
"use client";

import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { ExternalLink, Trash2, Pencil, Info, AlertTriangle, NotebookText, ShoppingCart, History, Eye, TrendingUp, Package } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";


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
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header melhorado */}
        <div className="flex-shrink-0 p-6 pb-4 bg-gradient-to-r from-background to-secondary/20">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Imagem com melhor design */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border-2 border-border/50">
              <SafeImage
                src={imageSrc}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product thumbnail"
              />
            </div>
            
            {/* Informações principais reorganizadas */}
            <div className="flex-1 min-w-0 space-y-4">
              <DialogHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge className={`border-transparent text-white text-sm px-3 py-1 ${statusInfo.color}`}>
                      <Package className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    {isLowProfit && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Baixa Margem
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {new Date(product.purchaseDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight mb-3 text-foreground">
                  {product.name}
                </DialogTitle>
                {product.description && (
                  <DialogDescription className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              
              {/* Métricas rápidas no header */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-background/80 rounded-lg border">
                  <div className="text-lg font-bold text-green-600">
                    {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-xs text-muted-foreground">Preço</div>
                </div>
                <div className="text-center p-2 bg-background/80 rounded-lg border">
                  <div className="text-lg font-bold text-primary">
                    {product.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Margem</div>
                </div>
                <div className="text-center p-2 bg-background/80 rounded-lg border">
                  <div className="text-lg font-bold text-blue-600">
                    {product.quantity - product.quantitySold}
                  </div>
                  <div className="text-xs text-muted-foreground">Estoque</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Conteúdo com Rolagem */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-4 pt-4">
          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/30">
              <TabsTrigger value="financial" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Vendas
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Detalhes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="financial" className="space-y-6">
              {/* Cards de métricas principais melhorados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Preço de Venda</span>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {product.sellingPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">Custo Total</span>
                    <Package className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {product.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Lucro Esperado</span>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`text-2xl font-bold ${product.expectedProfit >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-red-600'}`}>
                    {product.expectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Margem & ROI</span>
                    <AlertTriangle className={`w-5 h-5 ${isLowProfit ? 'text-red-600' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={isLowProfit ? "destructive" : "outline"} className={`text-sm ${!isLowProfit ? "text-purple-700 border-purple-600 bg-purple-50" : ""}`}>
                      {product.profitMargin.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline" className="text-sm text-blue-700 border-blue-600 bg-blue-50">
                      ROI {product.roi.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Estoque melhorado */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Controle de Estoque
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Estoque Atual</span>
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-xl font-bold text-orange-800 dark:text-orange-200">
                      {product.quantity - product.quantitySold} / {product.quantity}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Vendidos</span>
                      <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                      {product.quantitySold}
                    </span>
                  </div>
                  
                  {product.daysToSell !== undefined && (
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Tempo p/ Esgotar</span>
                        <History className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
                        {product.daysToSell} dias
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Histórico de Vendas</h3>
              </div>
              {product.sales && product.sales.length > 0 ? (
                <div className="space-y-3">
                  {product.sales.map((sale: Sale) => (
                    <div key={sale.id} className="p-4 bg-gradient-to-r from-background to-secondary/30 rounded-xl border border-border/50 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{sale.buyerName || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">Qtd: {sale.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          {(sale.quantity * product.sellingPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-2">Nenhuma venda registrada</p>
                  <p className="text-sm">As vendas aparecerão aqui quando registradas</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Informações Detalhadas</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-xl border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    Informações Básicas
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <span className="font-medium">{product.category || 'Não definida'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data de Compra:</span>
                      <span className="font-medium">{new Date(product.purchaseDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${statusInfo.color} text-white text-xs`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-secondary/30 rounded-xl border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Métricas de Performance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Venda:</span>
                      <span className="font-medium">
                        {((product.quantitySold / product.quantity) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lucro por Unidade:</span>
                      <span className="font-medium text-green-600">
                        {(product.sellingPrice - (product.totalCost / product.quantity)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total Investido:</span>
                      <span className="font-medium">
                        {product.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {product.notes && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-xl border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <NotebookText className="w-4 h-4 text-amber-600" />
                    Anotações Pessoais
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                    {product.notes}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Rodapé com botões de ação melhorados */}
        <div className="flex-shrink-0 p-6 pt-4 border-t bg-gradient-to-r from-background to-secondary/10">
          <div className="space-y-4">
            {/* Botão principal de ação */}
            <div className="flex justify-center">
              <Button 
                onClick={onRegisterSale} 
                disabled={isSoldOut} 
                size="lg"
                className={`px-8 py-3 text-base font-semibold shadow-lg transition-all duration-200 ${
                  isSoldOut 
                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl transform hover:scale-105'
                }`}
              >
                <ShoppingCart className="mr-3 h-5 w-5"/>
                {isSoldOut ? 'Produto Esgotado' : 'Registrar Nova Venda'}
              </Button>
            </div>
            
            <Separator />
            
            {/* Botões secundários */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={onEdit} 
                variant="outline" 
                className="h-12 border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
              >
                <Pencil className="mr-2 h-4 w-4"/>
                Editar Produto
              </Button>
              <Button 
                onClick={onDelete} 
                variant="outline" 
                className="h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200"
              >
                <Trash2 className="mr-2 h-4 w-4"/>
                Excluir Produto
              </Button>
            </div>
            
            {/* Link externo */}
            {product.aliexpressLink && (
              <div className="pt-2">
                <Button 
                  asChild 
                  variant="ghost" 
                  className="w-full text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-200"
                >
                  <Link href={product.aliexpressLink} target="_blank" className="flex items-center justify-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver produto original no AliExpress
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
