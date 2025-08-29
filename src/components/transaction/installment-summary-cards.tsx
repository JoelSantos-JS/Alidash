"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import type { Transaction } from "@/types"
import { formatCurrency } from "@/lib/utils"

interface InstallmentSummaryCardsProps {
  transactions: Transaction[]
  className?: string
}

export function InstallmentSummaryCards({ 
  transactions, 
  className 
}: InstallmentSummaryCardsProps) {
  
  const summary = useMemo(() => {
    const installmentTransactions = transactions.filter(t => 
      t.isInstallment && t.installmentInfo
    )

    if (installmentTransactions.length === 0) {
      return {
        totalInstallment: 0,
        remainingToPay: 0,
        alreadyPaid: 0,
        totalTransactions: 0
      }
    }

    let totalInstallment = 0
    let remainingToPay = 0
    let alreadyPaid = 0

    installmentTransactions.forEach(transaction => {
      if (transaction.installmentInfo) {
        const { totalAmount, remainingAmount } = transaction.installmentInfo
        
        // Soma o valor total parcelado (pode haver duplicatas, então pegamos apenas uma vez)
        if (transaction.installmentInfo.currentInstallment === 1) {
          totalInstallment += totalAmount
        }
        
        // Soma o valor restante a pagar
        remainingToPay += remainingAmount
        
        // Calcula o já pago (total - restante)
        const paidAmount = totalAmount - remainingAmount
        alreadyPaid += paidAmount
      }
    })

    return {
      totalInstallment: Math.round(totalInstallment * 100) / 100,
      remainingToPay: Math.round(remainingToPay * 100) / 100,
      alreadyPaid: Math.round(alreadyPaid * 100) / 100,
      totalTransactions: installmentTransactions.length
    }
  }, [transactions])



  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Total Parcelado */}
      <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
            Total Parcelado
          </CardTitle>
          <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(summary.totalInstallment)}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">
            {summary.totalTransactions} transação{summary.totalTransactions !== 1 ? 'es' : ''} parcelada{summary.totalTransactions !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Restante a Pagar */}
      <Card className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Restante a Pagar
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(summary.remainingToPay)}
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Valor pendente
          </p>
        </CardContent>
      </Card>

      {/* Já Pago */}
      <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Já Pago
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(summary.alreadyPaid)}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            Valor quitado
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 