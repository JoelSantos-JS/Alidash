/**
 * Utilitários para exportação de dados
 */

type DataItem = Record<string, any>;

/**
 * Exporta dados para formato CSV
 */
export function exportToCSV(data: DataItem[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Obter cabeçalhos das colunas
  const headers = Object.keys(data[0]);
  
  // Criar linha de cabeçalho
  const headerRow = headers.join(',');
  
  // Criar linhas de dados
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Tratar valores especiais
      if (value === null || value === undefined) {
        return '';
      }
      // Escapar strings com vírgulas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });
  
  // Juntar tudo
  return [headerRow, ...rows].join('\n');
}

/**
 * Prepara dados para exportação em PDF
 */
export function exportToPDF(data: DataItem[]): { title: string, data: DataItem[], columns: string[] } {
  if (!data || data.length === 0) {
    return { title: 'Relatório Financeiro', data: [], columns: [] };
  }

  const columns = ['Data', 'Descricao', 'Valor', 'Categoria'];
  
  return {
    title: 'Relatório Financeiro',
    data: data,
    columns: columns
  };
}