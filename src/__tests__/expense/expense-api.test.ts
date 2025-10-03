import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn();

describe('API de Despesas', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deve criar uma nova despesa com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, expense: { id: '123', description: 'Teste', amount: 100 } }),
    });

    // Dados da despesa para teste
    const expenseData = {
      description: 'Teste',
      amount: 100,
      date: '2023-10-01',
      category_id: '456',
      user_id: '789'
    };

    // Chamada à API
    const response = await fetch('/api/expenses/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });
    
    const data = await response.json();

    // Verificações
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.expense).toHaveProperty('id');
    expect(data.expense.description).toBe('Teste');
    expect(data.expense.amount).toBe(100);
    
    // Verifica se o fetch foi chamado corretamente
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/expenses/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expenseData),
      })
    );
  });

  it('deve listar despesas do usuário', async () => {
    // Mock da resposta de sucesso com lista de despesas
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        expenses: [
          { id: '123', description: 'Despesa 1', amount: 100 },
          { id: '456', description: 'Despesa 2', amount: 200 }
        ] 
      }),
    });

    // Chamada à API
    const response = await fetch('/api/expenses/list?user_id=789');
    const data = await response.json();

    // Verificações
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.expenses).toHaveLength(2);
    expect(data.expenses[0].description).toBe('Despesa 1');
    expect(data.expenses[1].description).toBe('Despesa 2');
    
    // Verifica se o fetch foi chamado corretamente
    expect(global.fetch).toHaveBeenCalledWith('/api/expenses/list?user_id=789');
  });

  it('deve tratar erros ao criar despesa', async () => {
    // Mock da resposta de erro
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: 'Dados inválidos' }),
    });

    // Dados inválidos da despesa
    const invalidData = {
      description: '',
      amount: -100,
    };

    // Chamada à API
    const response = await fetch('/api/expenses/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });
    
    const data = await response.json();

    // Verificações
    expect(response.ok).toBe(false);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Dados inválidos');
  });
});