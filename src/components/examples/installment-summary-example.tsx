"use client"

import { InstallmentSummaryCards } from "@/components/transaction/installment-summary-cards"
import type { Transaction } from "@/types"

// Dados de exemplo para transações parceladas
const exampleInstallmentTransactions: Transaction[] = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    description: "iPhone 15 Pro",
    amount: 50.00,
    type: "expense",
    category: "Tecnologia",
    status: "completed",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 600.00,
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmount: 50.00,
      remainingAmount: 550.00,
      nextDueDate: new Date("2024-02-15")
    }
  },
  {
    id: "2",
    date: new Date("2024-02-15"),
    description: "iPhone 15 Pro",
    amount: 50.00,
    type: "expense",
    category: "Tecnologia",
    status: "completed",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 600.00,
      totalInstallments: 12,
      currentInstallment: 2,
      installmentAmount: 50.00,
      remainingAmount: 500.00,
      nextDueDate: new Date("2024-03-15")
    }
  },
  {
    id: "3",
    date: new Date("2024-03-15"),
    description: "iPhone 15 Pro",
    amount: 50.00,
    type: "expense",
    category: "Tecnologia",
    status: "pending",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 600.00,
      totalInstallments: 12,
      currentInstallment: 3,
      installmentAmount: 50.00,
      remainingAmount: 450.00,
      nextDueDate: new Date("2024-04-15")
    }
  },
  {
    id: "4",
    date: new Date("2024-01-20"),
    description: "Notebook Dell",
    amount: 200.00,
    type: "expense",
    category: "Tecnologia",
    status: "completed",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 2400.00,
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmount: 200.00,
      remainingAmount: 2200.00,
      nextDueDate: new Date("2024-02-20")
    }
  },
  {
    id: "5",
    date: new Date("2024-02-20"),
    description: "Notebook Dell",
    amount: 200.00,
    type: "expense",
    category: "Tecnologia",
    status: "pending",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 2400.00,
      totalInstallments: 12,
      currentInstallment: 2,
      installmentAmount: 200.00,
      remainingAmount: 2000.00,
      nextDueDate: new Date("2024-03-20")
    }
  }
]

export function InstallmentSummaryExample() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Resumo de Parcelamento</h1>
        <p className="text-muted-foreground">
          Exemplo de cards de resumo similar à imagem
        </p>
      </div>

      {/* Cards de Resumo */}
      <InstallmentSummaryCards 
        transactions={exampleInstallmentTransactions}
      />

      {/* Informações dos dados de exemplo */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Dados de Exemplo:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• iPhone 15 Pro: R$ 600,00 em 12x de R$ 50,00</li>
          <li>• Notebook Dell: R$ 2.400,00 em 12x de R$ 200,00</li>
          <li>• Total parcelado: R$ 3.000,00</li>
          <li>• Já pago: R$ 500,00 (2 parcelas do iPhone + 1 do Notebook)</li>
          <li>• Restante: R$ 2.500,00</li>
        </ul>
      </div>
    </div>
  )
} 