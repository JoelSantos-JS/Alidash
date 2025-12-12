import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BusinessDashboard } from '@/components/dashboard/business-dashboard'

jest.mock('@/hooks/use-supabase-auth', () => ({
  useAuth: () => ({ user: null })
}))

const baseSummary = {
  totalInvested: 0,
  totalActualProfit: 0,
  projectedProfit: 0,
  productsInStock: 0,
  productsSolds: 0,
  lowStockCount: 0,
  periodRevenue: 0,
  periodExpenses: 0,
  periodBalance: 0,
  expenseRatio: 0,
  financialHealth: 'Excelente',
  healthColor: 'text-green-600'
}

describe('BusinessDashboard gating', () => {
  it('não mostra cards de resumo quando isLoading=true', () => {
    render(
      <BusinessDashboard
        products={[]}
        isLoading={true}
        summaryStats={baseSummary as any}
        filteredProducts={[]}
        periodFilter={'month'}
        revenues={[]}
        expenses={[]}
        transactions={[]}
        sales={[]}
        onOpenForm={() => {}}
        onSearch={() => {}}
        onProductClick={() => {}}
        onEditProduct={() => {}}
        onDeleteProduct={() => {}}
        onSellProduct={() => {}}
      />
    )
    expect(screen.queryByText('Total Investido')).toBeNull()
    expect(screen.queryByText('Lucro Realizado')).toBeNull()
    expect(screen.queryByText('Saldo do Período')).toBeNull()
  })

  it('mostra cards de resumo quando isLoading=false', () => {
    render(
      <BusinessDashboard
        products={[]}
        isLoading={false}
        summaryStats={baseSummary as any}
        filteredProducts={[]}
        periodFilter={'month'}
        revenues={[]}
        expenses={[]}
        transactions={[]}
        sales={[]}
        onOpenForm={() => {}}
        onSearch={() => {}}
        onProductClick={() => {}}
        onEditProduct={() => {}}
        onDeleteProduct={() => {}}
        onSellProduct={() => {}}
      />
    )
    expect(screen.getByText('Total Investido')).toBeTruthy()
    expect(screen.getByText('Lucro Realizado')).toBeTruthy()
    expect(screen.getByText('Saldo do Período')).toBeTruthy()
  })
})
