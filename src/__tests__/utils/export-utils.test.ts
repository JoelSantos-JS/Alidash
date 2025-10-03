import { describe, it, expect } from '@jest/globals';
import { exportToCSV, exportToPDF } from '../../utils/export-utils';

describe('Utilitários de Exportação', () => {
  it('deve exportar dados para CSV corretamente', () => {
    const data = [
      { data: '2023-10-01', descricao: 'Supermercado', valor: 150.75, categoria: 'Alimentação' },
      { data: '2023-10-05', descricao: 'Aluguel', valor: 1200.00, categoria: 'Moradia' }
    ];
    
    const result = exportToCSV(data);
    
    expect(result).toContain('data,descricao,valor,categoria');
    expect(result).toContain('2023-10-01,Supermercado,150.75,Alimentação');
    expect(result).toContain('2023-10-05,Aluguel,1200,Moradia');
  });

  it('deve preparar dados para exportação PDF', () => {
    const data = [
      { data: '2023-10-01', descricao: 'Supermercado', valor: 150.75, categoria: 'Alimentação' },
      { data: '2023-10-05', descricao: 'Aluguel', valor: 1200.00, categoria: 'Moradia' }
    ];
    
    const result = exportToPDF(data);
    
    expect(result.title).toBe('Relatório Financeiro');
    expect(result.data).toEqual(data);
    expect(result.columns).toEqual(['Data', 'Descricao', 'Valor', 'Categoria']);
  });
});