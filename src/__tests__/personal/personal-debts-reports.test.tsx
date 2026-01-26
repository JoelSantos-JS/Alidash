import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }))

jest.mock('next/link', () => {
  const React = require('react')
  return ({ href, children }: any) => React.createElement('a', { href }, children)
})

jest.mock('@/components/forms/personal-debt-form', () => ({
  __esModule: true,
  default: () => null
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}))

jest.mock('@/hooks/use-supabase-auth', () => ({
  useSupabaseAuth: () => ({ user: { id: 'user_1' } })
}))

jest.mock('@/components/ui/tabs', () => {
  const React = require('react')
  const Wrap = ({ children, ...props }: any) => React.createElement('div', props, children)
  return {
    Tabs: Wrap,
    TabsList: Wrap,
    TabsTrigger: ({ children, ...props }: any) => React.createElement('button', props, children),
    TabsContent: Wrap
  }
})

jest.mock('recharts', () => {
  const React = require('react')
  const Wrap = ({ children, ...props }: any) => React.createElement('div', props, children)
  return {
    ResponsiveContainer: Wrap,
    PieChart: Wrap,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
    BarChart: Wrap,
    Bar: Wrap,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    LineChart: Wrap,
    Line: () => null
  }
})

const debtsPayload = [
  {
    id: 'd1',
    creditorName: 'Banco A',
    description: 'Cartão',
    originalAmount: 1000,
    currentAmount: 800,
    interestRate: 1.5,
    installments: { amount: 100 },
    dueDate: '2026-01-10T00:00:00.000Z',
    createdDate: '2025-12-01T00:00:00.000Z',
    category: 'credit_card',
    status: 'active',
    paymentMethod: 'pix',
    notes: ''
  },
  {
    id: 'd2',
    creditorName: 'Loja B',
    description: 'Parcelamento',
    originalAmount: 500,
    currentAmount: 0,
    interestRate: 0,
    installments: { amount: 0 },
    dueDate: '2026-02-15T00:00:00.000Z',
    createdDate: '2025-11-01T00:00:00.000Z',
    category: 'installment',
    status: 'paid',
    paymentMethod: 'boleto',
    notes: ''
  }
]

describe('Dívidas Pessoais - aba Relatórios', () => {
  beforeEach(() => {
    jest.useRealTimers()
    ;(global as any).fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url
      if (String(url).includes('/api/debts/get')) {
        return { ok: true, json: async () => ({ debts: debtsPayload }) } as any
      }
      return { ok: true, json: async () => ({}) } as any
    })
  })

  it('renderiza KPIs da aba Relatórios com dados carregados via API', async () => {
    const PersonalDebtsPage = (await import('@/app/pessoal/dividas/page')).default
    render(<PersonalDebtsPage />)

    await screen.findByText('Dívidas Pessoais')

    expect((global as any).fetch).toHaveBeenCalled()
    const calledUrl = (global as any).fetch.mock.calls[0][0]
    expect(String(calledUrl)).toContain('/api/debts/get?user_id=user_1')

    await screen.findByText('Saldo Devedor')

    expect(screen.getByText(/46\.7%/)).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*800,00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/R\$\s*700,00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/R\$\s*100,00/).length).toBeGreaterThan(0)
    expect(screen.getByText('Projeção de pagamentos (6 meses)')).toBeInTheDocument()
    expect(screen.getByText('Próximos vencimentos')).toBeInTheDocument()
  })
})
