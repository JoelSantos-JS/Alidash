import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Transações', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve criar uma nova transação com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        transaction: {
          id: '123',
          user_id: 'user123',
          type: 'expense',
          amount: 150.75,
          description: 'Supermercado',
          category_id: 'cat123',
          date: '2023-10-15',
          created_at: '2023-10-15T14:30:00Z'
        }
      })
    });

    // Dados da transação para criar
    const transactionData = {
      type: 'expense',
      amount: 150.75,
      description: 'Supermercado',
      category_id: 'cat123',
      date: '2023-10-15'
    };

    // Chamada para a API
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    expect(data.success).toBe(true);
    expect(data.transaction.description).toBe('Supermercado');
    expect(data.transaction.amount).toBe(150.75);
    expect(data.transaction.type).toBe('expense');
  });

  it('deve listar as transações do usuário', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        transactions: [
          {
            id: '123',
            user_id: 'user123',
            type: 'expense',
            amount: 150.75,
            description: 'Supermercado',
            category_id: 'cat123',
            date: '2023-10-15',
            created_at: '2023-10-15T14:30:00Z'
          },
          {
            id: '124',
            user_id: 'user123',
            type: 'income',
            amount: 3000,
            description: 'Salário',
            category_id: 'cat456',
            date: '2023-10-05',
            created_at: '2023-10-05T10:00:00Z'
          }
        ]
      })
    });

    // Chamada para a API
    const response = await fetch('/api/transactions');
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/transactions');
    expect(data.success).toBe(true);
    expect(data.transactions.length).toBe(2);
    expect(data.transactions[0].description).toBe('Supermercado');
    expect(data.transactions[0].type).toBe('expense');
    expect(data.transactions[1].description).toBe('Salário');
    expect(data.transactions[1].type).toBe('income');
  });

  it('deve filtrar transações por período', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        transactions: [
          {
            id: '123',
            user_id: 'user123',
            type: 'expense',
            amount: 150.75,
            description: 'Supermercado',
            category_id: 'cat123',
            date: '2023-10-15',
            created_at: '2023-10-15T14:30:00Z'
          }
        ]
      })
    });

    const startDate = '2023-10-01';
    const endDate = '2023-10-31';
    
    // Chamada para a API
    const response = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/transactions?startDate=${startDate}&endDate=${endDate}`);
    expect(data.success).toBe(true);
    expect(data.transactions.length).toBe(1);
    expect(data.transactions[0].date).toBe('2023-10-15');
  });
});