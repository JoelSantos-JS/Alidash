import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Produtos', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve criar um novo produto com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        product: {
          id: '123',
          user_id: 'user123',
          name: 'Smartphone',
          price: 1500,
          description: 'Smartphone novo',
          image_url: 'https://example.com/image.jpg',
          created_at: '2023-01-01T00:00:00Z'
        }
      })
    });

    // Dados do produto para criar
    const productData = {
      name: 'Smartphone',
      price: 1500,
      description: 'Smartphone novo',
      image_url: 'https://example.com/image.jpg'
    };

    // Chamada para a API
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    expect(data.success).toBe(true);
    expect(data.product.name).toBe('Smartphone');
    expect(data.product.price).toBe(1500);
  });

  it('deve listar os produtos do usuário', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        products: [
          {
            id: '123',
            user_id: 'user123',
            name: 'Smartphone',
            price: 1500,
            description: 'Smartphone novo',
            image_url: 'https://example.com/image.jpg',
            created_at: '2023-01-01T00:00:00Z'
          },
          {
            id: '124',
            user_id: 'user123',
            name: 'Notebook',
            price: 3000,
            description: 'Notebook para trabalho',
            image_url: 'https://example.com/notebook.jpg',
            created_at: '2023-01-05T00:00:00Z'
          }
        ]
      })
    });

    // Chamada para a API
    const response = await fetch('/api/products');
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/products');
    expect(data.success).toBe(true);
    expect(data.products.length).toBe(2);
    expect(data.products[0].name).toBe('Smartphone');
    expect(data.products[1].name).toBe('Notebook');
  });

  it('deve atualizar um produto existente', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        product: {
          id: '123',
          user_id: 'user123',
          name: 'Smartphone Atualizado',
          price: 1600,
          description: 'Smartphone novo com desconto',
          image_url: 'https://example.com/image.jpg',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-10-15T00:00:00Z'
        }
      })
    });

    const productId = '123';
    const updateData = {
      name: 'Smartphone Atualizado',
      price: 1600,
      description: 'Smartphone novo com desconto'
    };
    
    // Chamada para a API
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    expect(data.success).toBe(true);
    expect(data.product.name).toBe('Smartphone Atualizado');
    expect(data.product.price).toBe(1600);
    expect(data.product.description).toBe('Smartphone novo com desconto');
  });
});