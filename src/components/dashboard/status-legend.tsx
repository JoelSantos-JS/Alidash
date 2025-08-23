import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface StatusLegendProps {
  className?: string;
  totalItems?: number;
  lowStockItems?: number;
  outOfStockItems?: number;
}

export function StatusLegend({ 
  className, 
  totalItems = 0, 
  lowStockItems = 0, 
  outOfStockItems = 0 
}: StatusLegendProps) {
  const healthyItems = totalItems - lowStockItems - outOfStockItems;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Info className="h-5 w-5" />
          Legenda de Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium">Estoque adequado</div>
              <div className="text-sm text-muted-foreground">
                (Quantidade atual ≥ ideal)
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {healthyItems}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium">Estoque médio</div>
              <div className="text-sm text-muted-foreground">
                (Quantidade entre 30% e 99% do ideal)
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {lowStockItems}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium">Estoque baixo</div>
              <div className="text-sm text-muted-foreground">
                (Menos de 30% do ideal)
              </div>
            </div>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {outOfStockItems}
            </Badge>
          </div>
        </div>
        
        {/* Resumo do estoque */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Resumo do Estoque
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total de itens:</p>
              <p className="font-semibold">{totalItems}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Itens saudáveis:</p>
              <p className="font-semibold text-green-600">{healthyItems}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Precisa atenção:</p>
              <p className="font-semibold text-yellow-600">{lowStockItems}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Crítico:</p>
              <p className="font-semibold text-red-600">{outOfStockItems}</p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {(lowStockItems > 0 || outOfStockItems > 0) && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Atenção ao Estoque
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {lowStockItems > 0 && `${lowStockItems} item(s) com estoque médio. `}
                  {outOfStockItems > 0 && `${outOfStockItems} item(s) com estoque crítico. `}
                  Considere fazer reposição.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Como funciona:</p>
            <ul className="text-xs space-y-1">
              <li>• Itens com estoque adequado não precisam de reposição</li>
              <li>• Itens com estoque médio devem ser monitorados</li>
              <li>• Itens com estoque baixo precisam de reposição urgente</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 