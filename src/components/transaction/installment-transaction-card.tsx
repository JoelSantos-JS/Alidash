"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Calendar, DollarSign, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  isInstallmentTransaction, 
  getInstallmentProgress, 
  formatInstallmentDescription 
} from "@/lib/utils";
import type { Transaction } from "@/types";

interface InstallmentTransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function InstallmentTransactionCard({ 
  transaction, 
  onEdit, 
  onDelete 
}: InstallmentTransactionCardProps) {
  if (!isInstallmentTransaction(transaction) || !transaction.installmentInfo) {
    return null;
  }

  const { installmentInfo } = transaction;
  
  // Validações de segurança para evitar erros com dados undefined
  const safeInstallmentInfo = {
    totalAmount: installmentInfo.totalAmount ?? 0,
    totalInstallments: installmentInfo.totalInstallments ?? 1,
    currentInstallment: installmentInfo.currentInstallment ?? 1,
    installmentAmount: installmentInfo.installmentAmount ?? 0,
    remainingAmount: installmentInfo.remainingAmount ?? 0,
    nextDueDate: installmentInfo.nextDueDate
  };

  const progress = getInstallmentProgress(
    safeInstallmentInfo.currentInstallment, 
    safeInstallmentInfo.totalInstallments
  );
  const remainingInstallments = safeInstallmentInfo.totalInstallments - safeInstallmentInfo.currentInstallment;

  return (
    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatInstallmentDescription(
                transaction.description, 
                safeInstallmentInfo.currentInstallment, 
                safeInstallmentInfo.totalInstallments
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Cartão de Crédito</span>
              <Badge variant="secondary" className="text-xs">
                Parcelado
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              R$ {transaction.amount.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Parcela {safeInstallmentInfo.currentInstallment}/{safeInstallmentInfo.totalInstallments}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progresso do parcelamento */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progresso do parcelamento</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {remainingInstallments} parcela{remainingInstallments !== 1 ? 's' : ''} restante{remainingInstallments !== 1 ? 's' : ''}
          </div>
        </div>

                 {/* Informações detalhadas */}
         <div className="grid grid-cols-2 gap-4 text-sm">
           <div className="flex items-center gap-2">
             <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
             <div>
               <div className="font-semibold text-gray-900 dark:text-gray-100">
                 R$ {safeInstallmentInfo.totalAmount.toFixed(2)}
               </div>
               <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Valor total</div>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
             <div>
               <div className="font-semibold text-gray-900 dark:text-gray-100">
                 R$ {safeInstallmentInfo.remainingAmount.toFixed(2)}
               </div>
               <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Restante a pagar</div>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
             <div>
               <div className="font-semibold text-gray-900 dark:text-gray-100">
                 {format(transaction.date, "dd/MM/yyyy", { locale: ptBR })}
               </div>
               <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Data da parcela</div>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <div className="h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
               <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                 {safeInstallmentInfo.currentInstallment}
               </span>
             </div>
             <div>
               <div className="font-semibold text-gray-900 dark:text-gray-100">
                 R$ {safeInstallmentInfo.installmentAmount.toFixed(2)}
               </div>
               <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Valor da parcela</div>
             </div>
           </div>
         </div>

        {/* Status e ações */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Badge 
              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
              className={transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            >
              {transaction.status === 'completed' ? 'Paga' : 'Pendente'}
            </Badge>
            {transaction.status === 'pending' && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-600">
                Vence em breve
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}