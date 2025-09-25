// Imports otimizados do date-fns para melhor tree-shaking
export { format } from 'date-fns/format';
export { isPast } from 'date-fns/isPast';
export { differenceInDays } from 'date-fns/differenceInDays';
export { isToday } from 'date-fns/isToday';
export { isTomorrow } from 'date-fns/isTomorrow';
export { isYesterday } from 'date-fns/isYesterday';
export { startOfDay } from 'date-fns/startOfDay';
export { endOfDay } from 'date-fns/endOfDay';
export { isThisWeek } from 'date-fns/isThisWeek';
export { isThisMonth } from 'date-fns/isThisMonth';
export { subDays } from 'date-fns/subDays';
export { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
export { startOfWeek } from 'date-fns/startOfWeek';
export { endOfWeek } from 'date-fns/endOfWeek';

// Locale otimizado
export { ptBR } from 'date-fns/locale/pt-BR';

// Funções utilitárias comuns
export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy') => {
  return format(new Date(date), formatStr, { locale: ptBR });
};

export const formatDateTime = (date: Date | string) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const isOverdue = (date: Date | string) => {
  return isPast(new Date(date));
};

export const getDaysUntil = (date: Date | string) => {
  return differenceInDays(new Date(date), new Date());
};

export const getRelativeDate = (date: Date | string) => {
  const targetDate = new Date(date);
  
  if (isToday(targetDate)) return 'Hoje';
  if (isTomorrow(targetDate)) return 'Amanhã';
  if (isYesterday(targetDate)) return 'Ontem';
  
  return formatDate(targetDate);
};