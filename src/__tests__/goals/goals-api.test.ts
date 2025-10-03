import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Metas', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve criar uma nova meta com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        goal: {
          id: '123',
          user_id: 'user123',
          title: 'Comprar casa',
          target_amount: 200000,
          current_amount: 50000,
          target_date: '2025-12-31',
          created_at: '2023-01-01T00:00:00Z'
        }
      })
    });

    // Dados da meta para criar
    const goalData = {
      title: 'Comprar casa',
      target_amount: 200000,
      current_amount: 50000,
      target_date: '2025-12-31'
    };

    // Chamada para a API
    const response = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData)
    });
    expect(data.success).toBe(true);
    expect(data.goal.title).toBe('Comprar casa');
    expect(data.goal.target_amount).toBe(200000);
  });

  it('deve listar as metas do usuário', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        goals: [
          {
            id: '123',
            user_id: 'user123',
            title: 'Comprar casa',
            target_amount: 200000,
            current_amount: 50000,
            target_date: '2025-12-31',
            created_at: '2023-01-01T00:00:00Z'
          },
          {
            id: '124',
            user_id: 'user123',
            title: 'Viagem internacional',
            target_amount: 15000,
            current_amount: 5000,
            target_date: '2024-07-15',
            created_at: '2023-02-10T00:00:00Z'
          }
        ]
      })
    });

    // Chamada para a API
    const response = await fetch('/api/goals');
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/goals');
    expect(data.success).toBe(true);
    expect(data.goals.length).toBe(2);
    expect(data.goals[0].title).toBe('Comprar casa');
    expect(data.goals[1].title).toBe('Viagem internacional');
  });

  it('deve atualizar o progresso de uma meta', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        goal: {
          id: '123',
          user_id: 'user123',
          title: 'Comprar casa',
          target_amount: 200000,
          current_amount: 75000,
          target_date: '2025-12-31',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-10-15T00:00:00Z'
        }
      })
    });

    const goalId = '123';
    const updateData = {
      current_amount: 75000
    };
    
    // Chamada para a API
    const response = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    expect(data.success).toBe(true);
    expect(data.goal.current_amount).toBe(75000);
  });
});