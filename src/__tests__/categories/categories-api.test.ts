import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Categorias', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve listar categorias com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        categories: [
          { id: '1', name: 'Alimentação', type: 'expense', color: '#FF5733' },
          { id: '2', name: 'Salário', type: 'revenue', color: '#33FF57' },
          { id: '3', name: 'Transporte', type: 'expense', color: '#3357FF' }
        ]
      })
    });

    // Chamada para a API
    const response = await fetch('/api/categories');
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    expect(data.success).toBe(true);
    expect(data.categories.length).toBe(3);
    expect(data.categories[0].name).toBe('Alimentação');
  });

  it('deve criar uma nova categoria com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        category: { id: '4', name: 'Lazer', type: 'expense', color: '#9933FF' }
      })
    });

    // Dados da nova categoria
    const newCategory = { name: 'Lazer', type: 'expense', color: '#9933FF' };

    // Chamada para a API
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory)
    });
    expect(data.success).toBe(true);
    expect(data.category.name).toBe('Lazer');
    expect(data.category.type).toBe('expense');
  });

  it('deve atualizar uma categoria existente', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        category: { id: '1', name: 'Alimentação e Restaurantes', type: 'expense', color: '#FF5733' }
      })
    });

    // ID e dados atualizados da categoria
    const categoryId = '1';
    const updatedCategory = { name: 'Alimentação e Restaurantes', color: '#FF5733' };

    // Chamada para a API
    const response = await fetch(`/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategory)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategory)
    });
    expect(data.success).toBe(true);
    expect(data.category.name).toBe('Alimentação e Restaurantes');
  });
});