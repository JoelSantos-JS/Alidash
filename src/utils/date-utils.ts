/**
 * Utilitários para manipulação de datas
 */

/**
 * Formata uma data para o formato DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  // Ajuste para o fuso horário local para evitar problemas com UTC
  const localDate = new Date(date.getTime());
  const day = localDate.getDate().toString().padStart(2, '0');
  const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  const year = localDate.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Retorna o nome do mês baseado no índice (0-11)
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return months[monthIndex];
}

/**
 * Retorna o primeiro e último dia do mês no formato YYYY-MM-DD
 */
export function getFirstAndLastDayOfMonth(monthYear: string): { firstDay: string, lastDay: string } {
  const [year, month] = monthYear.split('-');
  const firstDay = `${year}-${month}-01`;
  
  // Cria uma data para o primeiro dia do próximo mês e subtrai 1 dia
  const lastDayDate = new Date(parseInt(year), parseInt(month), 0);
  const lastDayMonth = lastDayDate.getDate().toString().padStart(2, '0');
  
  const lastDay = `${year}-${month}-${lastDayMonth}`;
  
  return { firstDay, lastDay };
}