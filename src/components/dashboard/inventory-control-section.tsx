"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Archive,
  TrendingUp,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import type { Product } from "@/types";

interface InventoryControlSectionProps {
  products: Product[];
  className?: string;
}

interface StatusInfo {
  label: string;
  color: string;
  icon: React.ComponentType<any>;
  count: number;
}

export function InventoryControlSection({ products, className }: InventoryControlSectionProps) {
  
  const inventoryStats = useMemo(() => {
    const stats = {
      totalItems: products.length,
      inStock: 0,
      needsRestock: 0,
      adequateStock: 0,
      mediumStock: 0,
      lowStock: 0,
      statusBreakdown: {
        purchased: 0,
        shipping: 0,
        received: 0,
        selling: 0,
        sold: 0
      }
    };

    products.forEach(product => {
      const availableStock = product.quantity - product.quantitySold;
      
      // Contagem por status
      stats.statusBreakdown[product.status as keyof typeof stats.statusBreakdown]++;
      
      // Análise de estoque
      if (product.status !== 'sold') {
        stats.inStock++;
        
        if (availableStock <= 2) {
          stats.lowStock++;
          stats.needsRestock++;
        } else if (availableStock <= 5) {
          stats.mediumStock++;
        } else {
          stats.adequateStock++;
        }
      }
    });

    return stats;
  }, [products]);

  const stockPercentage = useMemo(() => {
    if (inventoryStats.totalItems === 0) return 0;
    return Math.round((inventoryStats.adequateStock / inventoryStats.inStock) * 100);
  }, [inventoryStats]);

  const statusConfig: Record<string, StatusInfo> = {
    purchased: {
      label: 'Comprado',
      color: 'bg-blue-500',
      icon: Package,
      count: inventoryStats.statusBreakdown.purchased
    },
    shipping: {
      label: 'Enviando',
      color: 'bg-yellow-500',
      icon: Clock,
      count: inventoryStats.statusBreakdown.shipping
    },
    received: {
      label: 'Recebido',
      color: 'bg-indigo-500',
      icon: CheckCircle2,
      count: inventoryStats.statusBreakdown.received
    },
    selling: {
      label: 'Vendendo',
      color: 'bg-green-500',
      icon: TrendingUp,
      count: inventoryStats.statusBreakdown.selling
    },
    sold: {
      label: 'Vendido',
      color: 'bg-gray-500',
      icon: Archive,
      count: inventoryStats.statusBreakdown.sold
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Resumo do Estoque */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Resumo do Estoque
            </CardTitle>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {inventoryStats.totalItems}
              </div>
              <div className="text-sm text-muted-foreground">
                Total de itens
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {inventoryStats.adequateStock}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Estoque adequado
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {inventoryStats.mediumStock}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Estoque médio
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {inventoryStats.lowStock}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Estoque baixo
              </div>
            </div>
          </div>

          {/* Indicador de Saúde do Estoque */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Saúde do Estoque</span>
              <span className="text-sm text-muted-foreground">{stockPercentage}%</span>
            </div>
            <Progress value={stockPercentage} className="h-3" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Adequado ({inventoryStats.adequateStock})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Médio ({inventoryStats.mediumStock})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Baixo ({inventoryStats.lowStock})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda de Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Legenda de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{config.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {status === 'purchased' && '(Quantidade atual ≥ ideal)'}
                        {status === 'shipping' && '(Quantidade entre 30% e 99% do ideal)'}
                        {status === 'received' && '(Menos de 30% do ideal)'}
                        {status === 'selling' && '(Produtos disponíveis para venda)'}
                        {status === 'sold' && '(Produtos já vendidos)'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {config.count}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Alerta de Estoque */}
          {inventoryStats.needsRestock > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Atenção ao Estoque</span>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {inventoryStats.needsRestock} item(s) com estoque médio. Considere fazer reposição.
              </p>
            </div>
          )}

          {/* Como funciona */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium text-sm">Como funciona:</span>
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Itens com estoque adequado não precisam de reposição</li>
              <li>• Itens com estoque médio devem ser monitorados</li>
              <li>• Itens com estoque baixo precisam de reposição urgente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}