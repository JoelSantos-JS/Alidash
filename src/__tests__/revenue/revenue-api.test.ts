import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn();

describe('API de Entradas', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('deve criar uma nova entrada com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, revenue: { id: '123', description: 'Salário', amount: 3000 } }),
    });

    // Dados da entrada para teste
    const revenueData = {
      description: 'Salário',
      amount: 3000,
      date: '2023-10-01',
      category_id: '456',
      user_id: '789'
    };

    // Chamada à API
    const response = await fetch('/api/revenues/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revenueData),
    });
    
    const data = await response.json();

    // Verificações
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.revenue).toHaveProperty('id');
    expect(data.revenue.description).toBe('Salário');
    expect(data.revenue.amount).toBe(3000);
  });

  it('deve listar entradas do usuário', async () => {
    // Mock da resposta de sucesso com lista de receitas
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        revenues: [
          { id: '123', description: 'Salário', amount: 3000 },
          { id: '456', description: 'Freelance', amount: 1500 }
        ] 
      }),
    });

    // Chamada à API
    const response = await fetch('/api/revenues/list?user_id=789');
    const data = await response.json();

    // Verificações
    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.revenues).toHaveLength(2);
    expect(data.revenues[0].description).toBe('Salário');
    expect(data.revenues[1].description).toBe('Freelance');
  });
});
