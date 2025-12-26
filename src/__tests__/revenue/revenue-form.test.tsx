import { describe, it, expect } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
jest.mock('lucide-react', () => ({
  CalendarIcon: () => null,
}))
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Select = ({ children }: any) => <div data-testid="select-root">{children}</div>
  const SelectTrigger = ({ children }: any) => <button>{children}</button>
  const SelectValue = ({ placeholder }: any) => <span>{placeholder}</span>
  const SelectContent = ({ children }: any) => <div role="listbox">{children}</div>
  const SelectItem = ({ children, value }: any) => <div role="option" data-value={value}>{children}</div>
  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})
jest.mock('@/components/ui/popover', () => {
  const React = require('react')
  const Popover = ({ children }: any) => <div>{children}</div>
  const PopoverTrigger = ({ children }: any) => <div>{children}</div>
  const PopoverContent = ({ children }: any) => <div>{children}</div>
  return { Popover, PopoverTrigger, PopoverContent }
})
jest.mock('@/components/ui/calendar', () => ({
  Calendar: () => null,
}))
import { RevenueForm } from '@/components/revenue/revenue-form'
import type { Product } from '@/types'

const makeProduct = (overrides: Partial<Product>): Product => ({
  id: 'p-valid',
  name: 'Produto Válido',
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
  sellingPrice: 100,
  expectedProfit: 0,
  profitMargin: 0,
  sales: [],
  quantity: 1,
  quantitySold: 0,
  status: 'selling',
  purchaseDate: new Date(),
  roi: 0,
  actualProfit: 0,
  ...overrides,
})

describe('RevenueForm - filtro de produtos com id vazio', () => {
  it('não renderiza itens do Select com value vazio e não lança erros', () => {
    const products: Product[] = [
      makeProduct({ id: '', name: 'Sem ID' }),
      makeProduct({ id: '   ', name: 'Com espaços no ID' }),
      makeProduct({ id: 'p-123', name: 'Produto Válido' }),
    ]

    const onSave = jest.fn()
    const onCancel = jest.fn()

    expect(() => {
      render(
        <RevenueForm
          onSave={onSave}
          onCancel={onCancel}
          products={products}
        />
      )
    }).not.toThrow()

    const trigger = screen.getByRole('button', { name: /Selecione um produto/i })
    fireEvent.click(trigger)

    const listboxes = screen.getAllByRole('listbox')
    const productListbox = listboxes.find(lb => {
      try {
        const hasValid = require('@testing-library/react').within(lb).queryByText('Produto Válido')
        return !!hasValid
      } catch {
        return false
      }
    }) as HTMLElement | undefined

    expect(productListbox).toBeTruthy()
    const { within } = require('@testing-library/react')
    expect(within(productListbox!).getByText('Produto Válido')).toBeInTheDocument()
    expect(within(productListbox!).queryByText('Sem ID')).not.toBeInTheDocument()
    expect(within(productListbox!).queryByText('Com espaços no ID')).not.toBeInTheDocument()

    const options = within(productListbox!).getAllByRole('option')
    expect(options.length).toBe(1)
  })
})
