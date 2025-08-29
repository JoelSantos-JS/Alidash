"use client"

import { InstallmentSummaryCards } from "@/components/transaction/installment-summary-cards"
import { InstallmentTransactionCard } from "@/components/transaction/installment-transaction-card"
import type { Transaction } from "@/types"

// Dados de exemplo para transações parceladas
const exampleInstallmentTransactions: Transaction[] = [
  {
    id: "1",
    date: new Date("2024-01-15"),
    description: "Compra de 800 reais parcelada em 3x",
    amount: 266.67,
    type: "expense",
    category: "Tecnologia",
    status: "completed",
    isInstallment: true,
    installmentInfo: {
      totalAmount: 800.00,
      totalInstallments: 3,
      currentInstallment: 1,
      installmentAmount: 266.67,
      remainingAmount: 533.33,
      nextDueDate: new Date("2024-02-15")
    }
  },
  {
    id: "2",
    date: new Date("2024-01-20"),
    description: "Parcelei uma compra de 600 reais em 12x",
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
      nextDueDate: new Date("2024-02-20")
    }
  }
]

export function InstallmentVisibilityExample() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Melhoria na Visibilidade</h1>
        <p className="text-muted-foreground">
          Agora os números estão bem visíveis tanto no modo claro quanto escuro
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resumo de Parcelamento</h2>
        <InstallmentSummaryCards 
          transactions={exampleInstallmentTransactions}
        />
      </div>

      {/* Cards de Transações */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Transações Parceladas</h2>
        <div className="space-y-4">
          {exampleInstallmentTransactions.map((transaction) => (
            <InstallmentTransactionCard
              key={transaction.id}
              transaction={transaction}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      </div>

      {/* Informações sobre as melhorias */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Melhorias Implementadas:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• ✅ Cores com melhor contraste para modo claro e escuro</li>
          <li>• ✅ Fundos coloridos sutis nos cards de resumo</li>
          <li>• ✅ Texto principal em cores mais escuras para melhor legibilidade</li>
          <li>• ✅ Ícones com cores adaptadas para cada tema</li>
          <li>• ✅ Bordas e separadores visíveis em ambos os temas</li>
        </ul>
      </div>
    </div>
  )
} 