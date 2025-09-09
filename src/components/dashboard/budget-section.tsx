import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  ShoppingBasket, 
  Circle, 
  Edit3,
  Package,
  Save,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface BudgetSectionProps {
  monthlyBudget: number;
  estimatedExpenses: number;
  totalItems: number;
  missingItems: number;
  className?: string;
  onBudgetChange?: (newBudget: number) => void;
  isLoading?: boolean;
}

export function BudgetSection({ 
  monthlyBudget, 
  estimatedExpenses, 
  totalItems, 
  missingItems,
  className,
  onBudgetChange,
  isLoading = false
}: BudgetSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(monthlyBudget.toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const availableBalance = monthlyBudget - estimatedExpenses;
  const expensePercentage = monthlyBudget > 0 ? (estimatedExpenses / monthlyBudget) * 100 : 0;
  const missingPercentage = totalItems > 0 ? (missingItems / totalItems) * 100 : 0;

  const handleSaveBudget = () => {
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      onBudgetChange?.(budgetValue);
      setIsEditing(false);
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setNewBudget(monthlyBudget.toString());
    setIsEditing(false);
    setIsDialogOpen(false);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
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
                  <div>
                    <label className="text-sm font-medium">Novo valor do orçamento</label>
                    <Input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="Digite o valor"
                      className="mt-1"
                    />
                  </div>
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
                value={expensePercentage} 
                className="h-2"
                style={{
                  '--progress-background': expensePercentage > 80 ? 'hsl(var(--destructive))' : 
                                          expensePercentage > 60 ? 'hsl(var(--warning))' : 
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
              {expensePercentage > 90 && (
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
    </div>
  );
}