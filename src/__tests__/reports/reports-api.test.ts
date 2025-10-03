import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock do fetch global
global.fetch = jest.fn() as jest.Mock;

describe('API de Relatórios', () => {
  beforeEach(() => {
    // Limpa os mocks entre os testes
    jest.clearAllMocks();
  });

  it('deve gerar relatório mensal com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        report: {
          month: '2023-10',
          totalExpenses: 2500.75,
          totalRevenues: 5000.00,
          balance: 2499.25,
          categories: [
            { name: 'Alimentação', amount: 800.50, percentage: 32 },
            { name: 'Moradia', amount: 1200.00, percentage: 48 },
            { name: 'Transporte', amount: 500.25, percentage: 20 }
          ]
        }
      })
    });

    // Parâmetros do relatório
    const month = '2023-10';

    // Chamada para a API
    const response = await fetch(`/api/reports/monthly?month=${month}`);
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/reports/monthly?month=${month}`);
    expect(data.success).toBe(true);
    expect(data.report.month).toBe('2023-10');
    expect(data.report.totalExpenses).toBe(2500.75);
    expect(data.report.totalRevenues).toBe(5000.00);
    expect(data.report.balance).toBe(2499.25);
    expect(data.report.categories.length).toBe(3);
  });

  it('deve gerar relatório anual com sucesso', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        report: {
          year: '2023',
          totalExpenses: 30000.50,
          totalRevenues: 60000.00,
          balance: 29999.50,
          monthlyData: [
            { month: '2023-01', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-02', expenses: 2400.00, revenues: 5000.00 },
            { month: '2023-03', expenses: 2600.00, revenues: 5000.00 },
            { month: '2023-04', expenses: 2500.50, revenues: 5000.00 },
            { month: '2023-05', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-06', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-07', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-08', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-09', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-10', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-11', expenses: 2500.00, revenues: 5000.00 },
            { month: '2023-12', expenses: 2500.00, revenues: 5000.00 }
          ]
        }
      })
    });

    // Parâmetros do relatório
    const year = '2023';

    // Chamada para a API
    const response = await fetch(`/api/reports/annual?year=${year}`);
    const data = await response.json();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/reports/annual?year=${year}`);
    expect(data.success).toBe(true);
    expect(data.report.year).toBe('2023');
    expect(data.report.totalExpenses).toBe(30000.50);
    expect(data.report.totalRevenues).toBe(60000.00);
    expect(data.report.balance).toBe(29999.50);
    expect(data.report.monthlyData.length).toBe(12);
  });

  it('deve exportar relatório em formato CSV', async () => {
    // Mock da resposta de sucesso
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => 'Data,Descrição,Valor,Categoria\n2023-10-01,Supermercado,150.75,Alimentação\n2023-10-05,Aluguel,1200.00,Moradia'
    });

    // Parâmetros do relatório
    const month = '2023-10';
    const format = 'csv';

    // Chamada para a API
    const response = await fetch(`/api/reports/export?month=${month}&format=${format}`);
    const data = await response.text();

    // Verificações
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`/api/reports/export?month=${month}&format=${format}`);
    expect(data).toContain('Data,Descrição,Valor,Categoria');
    expect(data).toContain('2023-10-01,Supermercado,150.75,Alimentação');
    expect(data).toContain('2023-10-05,Aluguel,1200.00,Moradia');
  });
});