"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  CreditCard,
  User,
  Edit,
  Trash2,
  Receipt
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types";

interface DebtCardProps {
  debt: Debt;
  onEdit?: (debt: Debt) => void;
  onDelete?: (debt: Debt) => void;
  onPayment?: (debt: Debt) => void;
  className?: string;
}

const categoryLabels = {
  credit_card: "Cartão de Crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
  supplier: "Fornecedor",
  personal: "Pessoal",
  other: "Outros"
};

const statusLabels = {
  pending: "Pendente",
  overdue: "Vencida",
  paid: "Paga",
  negotiating: "Negociando",
  cancelled: "Cancelada"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente"
};

const getStatusColor = (status: Debt['status']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'negotiating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
};

const getPriorityColor = (priority: Debt['priority']) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }
};

export function DebtCard({ debt, onEdit, onDelete, onPayment, className }: DebtCardProps) {
  const isOverdue = isPast(debt.dueDate) && debt.status !== 'paid';
  const daysUntilDue = differenceInDays(debt.dueDate, new Date());
  const totalPaid = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const remainingAmount = debt.currentAmount - totalPaid;
  const paymentProgress = debt.currentAmount > 0 ? (totalPaid / debt.currentAmount) * 100 : 0;
  
  const installmentProgress = debt.installments 
    ? (debt.installments.paid / debt.installments.total) * 100 
    : 0;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isOverdue && debt.status !== 'paid' && "border-red-200 dark:border-red-800",
      debt.status === 'paid' && "border-green-200 dark:border-green-800 opacity-75",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {debt.creditorName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{debt.description}</p>
          </div>
          <div className="flex gap-1">
            <Badge className={getStatusColor(debt.status)}>
              {statusLabels[debt.status]}
            </Badge>
            <Badge className={getPriorityColor(debt.priority)}>
              {priorityLabels[debt.priority]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Valor Original</p>
            <p className="text-sm font-medium">
              {debt.originalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Valor Atual</p>
            <p className="text-sm font-medium">
              {debt.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Progresso de Pagamento */}
        {totalPaid > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso do Pagamento</span>
              <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-2" />
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Pago: {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              <span className="text-red-600">Restante: {remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
        )}

        {/* Parcelas */}
        {debt.installments && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Parcelas</span>
              <span className="font-medium">{debt.installments.paid}/{debt.installments.total}</span>
            </div>
            <Progress value={installmentProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Valor da parcela: {debt.installments.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        )}

        {/* Informações de Data e Categoria */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Vencimento:</span>
          </div>
          <div className={cn(
            "font-medium",
            isOverdue && debt.status !== 'paid' && "text-red-600",
            daysUntilDue <= 7 && daysUntilDue > 0 && debt.status !== 'paid' && "text-yellow-600"
          )}>
            {format(debt.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
            {debt.status !== 'paid' && (
              <span className="ml-1">
                {isOverdue ? `(${Math.abs(daysUntilDue)} dias em atraso)` : `(${daysUntilDue} dias)`}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-1">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Categoria:</span>
          </div>
          <span className="font-medium">{categoryLabels[debt.category]}</span>
        </div>

        {debt.interestRate && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Taxa de Juros:</span>
            </div>
            <span className="font-medium">{debt.interestRate}% a.m.</span>
          </div>
        )}

        {/* Alertas */}
        {isOverdue && debt.status !== 'paid' && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-600 font-medium">Dívida em atraso!</span>
          </div>
        )}

        {daysUntilDue <= 7 && daysUntilDue > 0 && debt.status !== 'paid' && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-600 font-medium">Vence em {daysUntilDue} dias</span>
          </div>
        )}

        {debt.status === 'paid' && (
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Dívida quitada</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {debt.status !== 'paid' && debt.status !== 'cancelled' && onPayment && (
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => onPayment(debt)}
              className="flex-1"
            >
              <Receipt className="h-3 w-3 mr-1" />
              Pagar
            </Button>
          )}
          
          {onEdit && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onEdit(debt)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          
          {onDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(debt)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}