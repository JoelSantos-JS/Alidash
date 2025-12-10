import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MoreHorizontal, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface CashFlowSectionProps {
  className?: string;
  periodRevenue?: number;
  periodExpenses?: number;
  periodBalance?: number;
  products?: any[];
  revenues?: any[];
  expenses?: any[];
  sales?: any[];
}

export function CashFlowSection({ 
  className, 
  periodRevenue = 0, 
  periodExpenses = 0, 
  periodBalance = 0,
  products = [],
  revenues = [],
  expenses = [],
  sales = []
}: CashFlowSectionProps) {
  
  // Gerar dados reais baseados nos dados do Supabase
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = [];
    
    // Processar dados por mês
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      let monthRevenue = 0;
      let monthExpenses = 0;
      
      const monthSaleKeys = new Set<string>();

      sales.forEach((sale: any) => {
        const saleDate = new Date(sale.date);
        if (saleDate >= monthDate && saleDate <= monthEnd) {
          if (sale.productId) {
            monthSaleKeys.add(`${sale.productId}|${saleDate.toISOString().slice(0,10)}`);
          }
          const total = typeof sale.totalAmount === 'number' && !isNaN(sale.totalAmount)
            ? sale.totalAmount
            : (sale.unitPrice || 0) * (sale.quantity || 0);
          monthRevenue += total || 0;
        }
      });

      revenues.forEach((revenue: any) => {
        const revenueDate = new Date(revenue.date);
        const src = String(revenue?.source || '').toLowerCase();
        const cat = String(revenue?.category || '').toLowerCase();
        const isSale = src === 'sale' || cat.includes('venda');
        if (revenueDate >= monthDate && revenueDate <= monthEnd) {
          if (isSale) {
            const key = revenue.productId ? `${revenue.productId}|${revenueDate.toISOString().slice(0,10)}` : '';
            if (key && monthSaleKeys.has(key)) return; // já somado via sales
            const amount = revenue.amount || 0;
            monthRevenue += amount;
          } else {
            monthRevenue += revenue.amount || 0;
          }
        }
      });
      
      // Calcular despesas do mês
      expenses.forEach((expense: any) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= monthDate && expenseDate <= monthEnd) {
          monthExpenses += expense.amount || 0;
        }
      });
      
      monthlyData.push({
        month: monthNames[month],
        revenue: monthRevenue,
        expenses: monthExpenses
      });
    }
    
    return monthlyData;
  }, [revenues, expenses, sales, periodRevenue, periodExpenses]);

  const maxValue = useMemo(() => {
    const max = Math.max(...cashFlowData.map(d => Math.max(d.revenue, d.expenses)));
    return max > 0 ? max : 1000; // Valor mínimo para evitar divisão por zero
  }, [cashFlowData]);

  const averageMonthlyRevenue = useMemo(() => {
    const totalRevenue = cashFlowData.reduce((acc, d) => acc + d.revenue, 0);
    return totalRevenue > 0 ? totalRevenue : periodRevenue; // Usar dados do período atual se não há dados históricos
  }, [cashFlowData, periodRevenue]);

  const growthPercentage = useMemo(() => {
    // Como só temos dados do mês atual, não há crescimento para calcular
    return 0;
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">Fluxo de Caixa Empresarial</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Exportar
          </Button>
          <Button size="sm" className="w-8 h-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo do período atual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="text-lg font-semibold text-green-600">
                {periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-lg font-semibold text-red-600">
                {periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={cn("text-lg font-semibold", periodBalance >= 0 ? "text-blue-600" : "text-red-600")}>
                {periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras responsivo */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h4 className="text-sm font-medium">Fluxo Anual (R$)</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Despesas</span>
              </div>
            </div>
          </div>
          
          {/* Container responsivo para o gráfico */}
          <div className="relative">
            <div className="h-48 sm:h-64 flex items-end justify-between gap-1 overflow-x-auto">
              {cashFlowData.map((data, index) => (
                <div key={index} className="flex-1 min-w-[30px] flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-1">
                    <div 
                      className="bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 cursor-pointer"
                      style={{ 
                        height: `${Math.max((data.revenue / maxValue) * 180, 4)}px`,
                        minHeight: '4px'
                      }}
                      title={`${data.month}: R$ ${data.revenue.toLocaleString('pt-BR')}`}
                    ></div>
                    <div 
                      className="bg-red-500 rounded-b transition-all duration-300 hover:bg-red-600 cursor-pointer"
                      style={{ 
                        height: `${Math.max((data.expenses / maxValue) * 180, 4)}px`,
                        minHeight: '4px'
                      }}
                      title={`${data.month}: R$ ${data.expenses.toLocaleString('pt-BR')}`}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estatísticas adicionais */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Média Mensal</p>
              <p className="text-lg font-semibold">
                {averageMonthlyRevenue.toLocaleString('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                })}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Crescimento</p>
              <Badge variant="secondary" className="text-muted-foreground">
                Sem dados históricos
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
