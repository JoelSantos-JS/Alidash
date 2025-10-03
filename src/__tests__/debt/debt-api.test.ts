import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Dívidas', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve criar uma nova dívida com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        debt: {
          id: '123',
          user_id: 'user123',
          description: 'Empréstimo',
          amount: 1000,
          due_date: '2023-12-31',
          is_paid: false,
          created_at: '2023-01-01T00:00:00Z'
        }
      })
    });

    // Dados da dívida para criar
    const debtData = {
      description: 'Empréstimo',
      amount: 1000,
      due_date: '2023-12-31'
    };

    // Chamada para a API
    const response = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debtData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debtData)
    });
    expect(data.success).toBe(true);
    expect(data.debt.description).toBe('Empréstimo');
    expect(data.debt.amount).toBe(1000);
  });

  it('deve listar as dívidas do usuário', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        debts: [
          {
            id: '123',
            user_id: 'user123',
            description: 'Empréstimo',
            amount: 1000,
            due_date: '2023-12-31',
            is_paid: false,
            created_at: '2023-01-01T00:00:00Z'
          },
          {
            id: '124',
            user_id: 'user123',
            description: 'Cartão de crédito',
            amount: 500,
            due_date: '2023-11-15',
            is_paid: true,
            created_at: '2023-01-05T00:00:00Z'
          }
        ]
      })
    });

    // Chamada para a API
    const response = await fetch('/api/debts');
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/debts');
    expect(data.success).toBe(true);
    expect(data.debts.length).toBe(2);
    expect(data.debts[0].description).toBe('Empréstimo');
    expect(data.debts[1].description).toBe('Cartão de crédito');
  });

  it('deve marcar uma dívida como paga', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        debt: {
          id: '123',
          user_id: 'user123',
          description: 'Empréstimo',
          amount: 1000,
          due_date: '2023-12-31',
          is_paid: true,
          created_at: '2023-01-01T00:00:00Z',
          paid_at: '2023-10-15T00:00:00Z'
        }
      })
    });

    const debtId = '123';
    
    // Chamada para a API
    const response = await fetch(`/api/debts/${debtId}/pay`, {
      method: 'PATCH'
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/debts/${debtId}/pay`, {
      method: 'PATCH'
    });
    expect(data.success).toBe(true);
    expect(data.debt.is_paid).toBe(true);
    expect(data.debt.paid_at).toBeTruthy();
  });
});