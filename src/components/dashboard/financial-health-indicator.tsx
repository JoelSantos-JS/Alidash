import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, TrendingUp, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface FinancialHealthIndicatorProps {
  expenseRatio: number;
  className?: string;
  isPersonal?: boolean;
}

export function FinancialHealthIndicator({ expenseRatio, className, isPersonal = false }: FinancialHealthIndicatorProps) {
  const health = useMemo(() => {
    if (expenseRatio <= 40) {
      return {
        status: "Excelente",
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        icon: Leaf,
        description: isPersonal ? "Seus gastos pessoais estão bem controlados" : "Suas despesas estão bem controladas",
        tip: isPersonal ? "Continue mantendo esse controle das finanças pessoais!" : "Continue mantendo esse controle financeiro!",
        recommendation: isPersonal ? "Considere aumentar sua reserva de emergência." : "Considere investir o excedente."
      };
    } else if (expenseRatio <= 60) {
      return {
        status: "Boa",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        icon: TrendingUp,
        description: isPersonal ? "Continue monitorando seus gastos pessoais" : "Continue monitorando suas despesas",
        tip: "Você está no caminho certo!",
        recommendation: isPersonal ? "Identifique oportunidades de redução de gastos pessoais." : "Identifique oportunidades de redução de custos."
      };
    } else if (expenseRatio <= 80) {
      return {
        status: "Atenção",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        icon: AlertCircle,
        description: isPersonal ? "Considere reduzir gastos pessoais" : "Considere reduzir despesas",
        tip: isPersonal ? "Atenção: seus gastos pessoais estão altos!" : "Atenção: suas despesas estão altas!",
        recommendation: isPersonal ? "Revise gastos desnecessários e corte supérfluos." : "Revise gastos desnecessários e otimize processos."
      };
    } else {
      return {
        status: "Crítica",
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        icon: AlertTriangle,
        description: "Ação imediata necessária",
        tip: isPersonal ? "URGENTE: Seus gastos pessoais estão muito altos!" : "URGENTE: Suas despesas estão muito altas!",
        recommendation: isPersonal ? "Reduza gastos imediatamente e reavalie seu orçamento pessoal." : "Reduza custos imediatamente e reavalie estratégias."
      };
    }
  }, [expenseRatio]);

  const Icon = health.icon;

  return (
    <Card className={cn("border-2", health.borderColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", health.bgColor)}>
              <Icon className={cn("h-5 w-5", health.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{isPersonal ? 'Saúde Financeira Pessoal' : 'Saúde Financeira'}</h3>
              <p className="text-xs text-muted-foreground">{health.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn("text-xs font-medium", health.color)}>
            {health.status}
          </Badge>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{isPersonal ? 'Gastos/Ganhos' : 'Despesas/Receitas'}</span>
            <span className="font-medium">{expenseRatio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn("h-2 rounded-full transition-all duration-300", {
                "bg-green-500": expenseRatio <= 40,
                "bg-blue-500": expenseRatio > 40 && expenseRatio <= 60,
                "bg-yellow-500": expenseRatio > 60 && expenseRatio <= 80,
                "bg-red-500": expenseRatio > 80
              })}
              style={{ width: `${Math.min(expenseRatio, 100)}%` }}
            />
          </div>
        </div>

        {/* Dica e recomendação */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
            <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{health.tip}</p>
              <p className="text-muted-foreground">{health.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Indicadores de referência */}
        <div className="mt-3 pt-3 border-t border-muted/30">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
              <span className="text-muted-foreground">≤40%</span>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
              <span className="text-muted-foreground">40-80%</span>
            </div>
            <div className="text-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
              <span className="text-muted-foreground">{'>'}80%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}