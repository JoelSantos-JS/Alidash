import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectTrigger, 
  SelectContent, 
  SelectItem, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DollarSign, 
  ShoppingBasket, 
  Circle, 
  Edit3,
  Package,
  Save,
  X,
  Loader2,
  Target,
  PiggyBank,
  AlertTriangle
} from "lucide-react";
import { cn, formatCurrency, formatCurrencyInputBRL, parseCurrencyInputBRL } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

interface BudgetSectionProps {
  monthlyBudget: number;
  estimatedExpenses: number;
  totalItems: number;
  missingItems: number;
  periodRevenue?: number;
  className?: string;
  onBudgetChange?: (newBudget: number) => void;
  isLoading?: boolean;
}

export function BudgetSection({ 
  monthlyBudget, 
  estimatedExpenses, 
  totalItems, 
  missingItems,
  periodRevenue = 0,
  className,
  onBudgetChange,
  isLoading = false
}: BudgetSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(formatCurrency(monthlyBudget));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [linkToRevenue, setLinkToRevenue] = useState(false);
  const [linkMode, setLinkMode] = useState<"revenue" | "savings" | "percentage">("revenue");
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [spendingPercentage, setSpendingPercentage] = useState<number>(100);

  // Sincronizar o estado local com o prop quando ele mudar
  useEffect(() => {
    setNewBudget(formatCurrency(monthlyBudget));
  }, [monthlyBudget]);

  const availableBalance = monthlyBudget - estimatedExpenses;
  const expensePercentage = monthlyBudget > 0 ? (estimatedExpenses / monthlyBudget) * 100 : 0;
  const missingPercentage = totalItems > 0 ? (missingItems / totalItems) * 100 : 0;
  const plannedBalance = periodRevenue - monthlyBudget; // Receitas - Orçamento
  const planDeviation = estimatedExpenses - monthlyBudget; // Despesas - Orçamento

  const computeLinkedBudget = () => {
    if (!linkToRevenue) return parseCurrencyInputBRL(newBudget) || monthlyBudget;
    switch (linkMode) {
      case "revenue":
        return Math.max(periodRevenue, 0);
      case "savings":
        return Math.max(periodRevenue - (savingsGoal || 0), 0);
      case "percentage":
        return Math.max(periodRevenue * ((spendingPercentage || 0) / 100), 0);
      default:
        return monthlyBudget;
    }
  };

  const handleSaveBudget = () => {
    const budgetValue = linkToRevenue ? computeLinkedBudget() : parseCurrencyInputBRL(newBudget);
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      onBudgetChange?.(budgetValue);
      setIsEditing(false);
      setIsDialogOpen(false);
    } else {
    }
  };

  const handleCancel = () => {
    setNewBudget(monthlyBudget.toString());
    setIsEditing(false);
    setIsDialogOpen(false);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {/* Orçamento Mensal */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Orçamento Mensal</h3>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Orçamento Mensal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Vincular orçamento às entradas</label>
                      <Switch checked={linkToRevenue} onCheckedChange={setLinkToRevenue} />
                    </div>
                    {linkToRevenue && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Modo de vínculo</label>
                          <Select value={linkMode} onValueChange={(v) => setLinkMode(v as any)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="revenue">100% das entradas</SelectItem>
                              <SelectItem value="savings">Entradas - meta de poupança</SelectItem>
                              <SelectItem value="percentage">Percentual das entradas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {linkMode === "savings" && (
                          <div>
                            <label className="text-sm font-medium">Meta de poupança</label>
                            <Input
                              type="number"
                              value={Number.isFinite(savingsGoal) ? savingsGoal : 0}
                              onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 100"
                              className="mt-1"
                            />
                          </div>
                        )}
                        {linkMode === "percentage" && (
                          <div>
                          <label className="text-sm font-medium">Percentual de gasto das entradas</label>
                            <Input
                              type="number"
                              value={Number.isFinite(spendingPercentage) ? spendingPercentage : 100}
                              onChange={(e) => setSpendingPercentage(parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 80"
                              className="mt-1"
                            />
                          </div>
                        )}
                        <div className="p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Orçamento calculado</span>
                            <Badge variant="secondary" className="text-xs">
                              Entradas: {periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xl font-bold">
                            {computeLinkedBudget().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {!linkToRevenue && (
                    <div>
                      <label className="text-sm font-medium">Novo valor do orçamento</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={newBudget}
                        onChange={(e) => setNewBudget(formatCurrencyInputBRL(e.target.value))}
                        placeholder="R$ 0,00"
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveBudget} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {monthlyBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Estimativa de Gastos:</span>
                <span className="font-medium">{estimatedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <Progress 
                value={Math.min(Math.max(expensePercentage, 0), 100)} 
                className="h-2"
                style={{
                  '--progress-background': expensePercentage >= 100 ? 'hsl(var(--destructive))' :
                                          expensePercentage > 90 ? 'hsl(var(--destructive))' : 
                                          expensePercentage > 80 ? 'hsl(var(--warning))' : 
                                          'hsl(var(--primary))'
                } as React.CSSProperties}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponível:</span>
              <span className={cn(
                "text-lg font-bold",
                availableBalance >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {availableBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            {/* Indicador de status do orçamento */}
            <div className="mt-3">
              {expensePercentage >= 100 && (
                <Badge variant="destructive" className="text-xs">
                  💥 Orçamento estourado
                </Badge>
              )}
              {expensePercentage > 90 && expensePercentage < 100 && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️ Orçamento quase esgotado
                </Badge>
              )}
              {expensePercentage > 80 && expensePercentage <= 90 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  ⚠️ Atenção ao orçamento
                </Badge>
              )}
              {expensePercentage <= 80 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ✅ Orçamento saudável
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens Cadastrados */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Itens Cadastrados</h3>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShoppingBasket className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {totalItems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total de itens
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {missingItems}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Itens em falta
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {missingPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Da lista
            </div>
          </div>

          {/* Status dos itens */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Em estoque:</span>
              <span className="font-medium text-green-600">{totalItems - missingItems}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Precisa repor:</span>
              <span className="font-medium text-red-600">{missingItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planejamento vs Realizado */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Planejamento vs Realizado</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Saldo Planejado: Receitas - Orçamento */}
            <div className="p-3 rounded-lg border bg-white/60 dark:bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Saldo planejado</span>
                {plannedBalance >= 0 ? (
                  <PiggyBank className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                )}
              </div>
              <div className={cn("mt-1 text-xl font-bold", plannedBalance >= 0 ? "text-green-600" : "text-orange-600")}> 
                {Math.abs(plannedBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-muted-foreground">Entradas ({periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) - Orçamento ({monthlyBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</div>
              <div className={cn("mt-1 text-xs font-medium", plannedBalance >= 0 ? "text-green-600" : "text-orange-600")}> 
                {plannedBalance >= 0 ? 'Margem sobre o orçamento' : 'Falta para cobrir o orçamento'}
              </div>
            </div>

            {/* Desvio do Plano: Despesas - Orçamento */}
            <div className="p-3 rounded-lg border bg-white/60 dark:bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Desvio do plano</span>
                {planDeviation <= 0 ? (
                  <PiggyBank className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className={cn("mt-1 text-xl font-bold", planDeviation <= 0 ? "text-green-600" : "text-red-600")}> 
                {Math.abs(planDeviation).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-xs text-muted-foreground">Saídas ({estimatedExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) - Orçamento ({monthlyBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</div>
              <div className={cn("mt-1 text-xs font-medium", planDeviation <= 0 ? "text-green-600" : "text-red-600")}> 
                {planDeviation <= 0 ? 'Economia vs orçamento' : 'Acima do orçamento'}
              </div>
            </div>
          </div>

          {/* Consumo do Orçamento */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Orçamento consumido</span>
              <span className="font-medium">{expensePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={expensePercentage} 
              className="h-2"
              style={{
                '--progress-background': expensePercentage > 90 ? 'hsl(var(--destructive))' : 
                                        expensePercentage > 80 ? 'hsl(var(--warning))' : 
                                        'hsl(var(--primary))'
              } as React.CSSProperties}
            />
            <div className="text-xs text-muted-foreground">
              {planDeviation > 0 
                ? '⚠️ Gastos acima do orçamento no período.'
                : '✅ Gastos dentro do orçamento planejado.'}
            </div>
            {/* Gráfico explicativo */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Como funciona o orçamento</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Entradas', valor: periodRevenue },
                      { name: 'Orçamento', valor: monthlyBudget },
                      { name: 'Saídas', valor: estimatedExpenses },
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <Legend />
                    <Bar dataKey="valor" name="Valor" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <div>• Saldo planejado = Entradas - Orçamento</div>
                <div>• Saldo do período = Entradas - Saídas</div>
                <div>• O orçamento é o limite de gastos que você definiu; as entradas não aumentam automaticamente o orçamento.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
