import { describe, it, expect } from '@jest/globals';
import { formatDate, getMonthName, getFirstAndLastDayOfMonth } from '../../utils/date-utils';

describe('Utilitários de Data', () => {
  it('deve formatar data corretamente', () => {
    // Criando uma data específica para evitar problemas de fuso horário
    const date = new Date(2023, 9, 14); // Mês é 0-indexed, então 9 = outubro
    expect(formatDate(date)).toBe('14/10/2023');
  });

  it('deve retornar o nome do mês corretamente', () => {
    expect(getMonthName(0)).toBe('Janeiro');
    expect(getMonthName(5)).toBe('Junho');
    expect(getMonthName(11)).toBe('Dezembro');
  });

  it('deve retornar o primeiro e último dia do mês', () => {
    const result = getFirstAndLastDayOfMonth('2023-10');
    expect(result.firstDay).toBe('2023-10-01');
    expect(result.lastDay).toBe('2023-10-31');
  });
});