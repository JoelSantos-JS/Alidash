"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  CreditCard,
  TrendingUp,
  Calendar,
  ArrowRight,
  FileText
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types";
import Link from "next/link";

interface DebtSectionProps {
  debts: Debt[];
  className?: string;
}

const statusLabels = {
  pending: "Pendente",
  overdue: "Vencida",
  paid: "Paga",
  negotiating: "Negociando",
  cancelled: "Cancelada"
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

export function DebtSection({ debts, className }: DebtSectionProps) {
  const debtStats = useMemo(() => {
    const activeDebts = debts.filter(debt => debt.status !== 'paid' && debt.status !== 'cancelled');
    
    const totalAmount = activeDebts.reduce((sum, debt) => {
      const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
      return sum + (debt.currentAmount - totalPaid);
    }, 0);
    
    const overdueDebts = activeDebts.filter(debt => isPast(debt.dueDate));
    const dueSoonDebts = activeDebts.filter(debt => {
      const daysUntilDue = differenceInDays(debt.dueDate, new Date());
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });
    
    const paidDebts = debts.filter(debt => debt.status === 'paid');
    const totalOriginalAmount = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const totalPaidAmount = paidDebts.reduce((sum, debt) => sum + debt.originalAmount, 0);
    const paymentProgress = totalOriginalAmount > 0 ? (totalPaidAmount / totalOriginalAmount) * 100 : 0;
    
    // Próximas dívidas a vencer (próximos 30 dias)
    const upcomingDebts = activeDebts
      .filter(debt => {
        const daysUntilDue = differenceInDays(debt.dueDate, new Date());
        return daysUntilDue >= 0 && daysUntilDue <= 30;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);
    
    return {
      totalDebts: debts.length,
      activeDebts: activeDebts.length,
      totalAmount,
      overdueDebts: overdueDebts.length,
      overdueAmount: overdueDebts.reduce((sum, debt) => {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }, 0),
      dueSoonDebts: dueSoonDebts.length,
      dueSoonAmount: dueSoonDebts.reduce((sum, debt) => {
        const totalPaid = debt.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
        return sum + (debt.currentAmount - totalPaid);
      }, 0),
      paidDebts: paidDebts.length,
      paymentProgress,
      upcomingDebts
    };
  }, [debts]);

  if (debts.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhuma dívida cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando suas dívidas para ter um controle financeiro completo.
          </p>
          <Button asChild>
            <Link href="/dividas">
              <FileText className="h-4 w-4 mr-2" />
              Gerenciar Dívidas
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium">Total de Dívidas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{debtStats.totalDebts}</div>
            <p className="text-xs text-muted-foreground">
              {debtStats.activeDebts} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-lg sm:text-2xl font-bold break-words">
              {debtStats.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Dívidas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{debtStats.overdueDebts}</div>
            <p className="text-xs text-red-600 break-words">
              {debtStats.overdueAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium">Vencem em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{debtStats.dueSoonDebts}</div>
            <p className="text-xs text-yellow-600 break-words">
              {debtStats.dueSoonAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso de Pagamento */}
      {debtStats.paidDebts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Progresso de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dívidas quitadas</span>
                <span className="font-medium">{debtStats.paymentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={debtStats.paymentProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{debtStats.paidDebts} de {debtStats.totalDebts} dívidas pagas</span>
                <span>
                  {(debtStats.totalDebts - debtStats.paidDebts)} restantes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximas Dívidas a Vencer */}
      {debtStats.upcomingDebts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas a Vencer
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dividas">
                Ver Todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debtStats.upcomingDebts.map((debt) => {
                const daysUntilDue = differenceInDays(debt.dueDate, new Date());
                const isOverdue = isPast(debt.dueDate);
                const totalPaid = debt.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
                const remainingAmount = debt.currentAmount - totalPaid;
                
                return (
                  <div key={debt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{debt.creditorName}</h4>
                        <Badge className={getStatusColor(debt.status)}>
                          {statusLabels[debt.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{debt.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-medium">
                          {remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className={cn(
                          "flex items-center gap-1",
                          isOverdue ? "text-red-600" : daysUntilDue <= 7 ? "text-yellow-600" : "text-muted-foreground"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {format(debt.dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                          {isOverdue && (
                            <span className="ml-1 text-red-600 font-medium">
                              ({Math.abs(daysUntilDue)} dias em atraso)
                            </span>
                          )}
                          {!isOverdue && daysUntilDue <= 7 && (
                            <span className="ml-1 text-yellow-600 font-medium">
                              ({daysUntilDue} dias)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {isOverdue && (
                      <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />
                    )}
                    {!isOverdue && daysUntilDue <= 7 && (
                      <Clock className="h-4 w-4 text-yellow-500 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {(debtStats.overdueDebts > 0 || debtStats.dueSoonDebts > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {debtStats.overdueDebts > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {debtStats.overdueDebts} dívida(s) em atraso
                  </span>
                </div>
                <span className="text-sm font-bold text-red-700 dark:text-red-300">
                  {debtStats.overdueAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
            
            {debtStats.dueSoonDebts > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    {debtStats.dueSoonDebts} dívida(s) vencem em 7 dias
                  </span>
                </div>
                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                  {debtStats.dueSoonAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão para Ver Todas */}
      <div className="text-center">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dividas">
            <FileText className="h-4 w-4" />
            Gerenciar Todas as Dívidas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}