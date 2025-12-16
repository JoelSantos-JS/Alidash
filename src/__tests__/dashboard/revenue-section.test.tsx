import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RevenueSection } from '@/components/dashboard/revenue-section'
jest.mock('lucide-react', () => ({
  ArrowUp: () => null,
  TrendingUp: () => null,
  DollarSign: () => null,
  ShoppingCart: () => null,
  Trophy: () => null,
  Package: () => null,
  Edit3: () => null,
  Trash2: () => null,
}))

const product = {
  id: 'p1',
  name: 'Lenovo GM2 PRO Fone de ouvido',
  category: 'Eletrônicos',
  supplier: '',
  aliexpressLink: '',
  imageUrl: '',
  description: '',
  purchasePrice: 0,
  shippingCost: 0,
  importTaxes: 0,
  packagingCost: 0,
  marketingCost: 0,
  otherCosts: 0,
  totalCost: 0,
  sellingPrice: 160,
  expectedProfit: 0,
  profitMargin: 0,
  sales: [{ id: 's1', date: new Date('2025-12-10'), quantity: 1, productId: 'p1' }],
  quantity: 0,
  quantitySold: 0,
  status: 'selling',
  purchaseDate: new Date('2025-12-01'),
  roi: 0,
  actualProfit: 0,
}

describe('Seção de Entradas (RevenueSection) - dedupe', () => {
  it('não duplica venda quando existe receita de venda no mesmo dia', () => {
    render(
      <RevenueSection
        products={[product]}
        periodFilter={'month'}
        currentDate={new Date('2025-12-10')}
        revenues={[{
          id: 'r1',
          date: new Date('2025-12-10'),
          description: 'Venda: Lenovo GM2 PRO Fone de ouvido',
          amount: 160,
          category: 'vendas',
          source: 'sale',
        } as any]}
      />
    )
    const rows = screen.getAllByText(/Venda: Lenovo GM2 PRO Fone de ouvido/i)
    expect(rows.length).toBe(1)
  })
})
