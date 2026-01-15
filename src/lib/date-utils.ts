// Imports otimizados do date-fns para melhor tree-shaking
import { format } from 'date-fns/format';
import { isPast } from 'date-fns/isPast';
import { differenceInDays } from 'date-fns/differenceInDays';
import { isToday } from 'date-fns/isToday';
import { isTomorrow } from 'date-fns/isTomorrow';
import { isYesterday } from 'date-fns/isYesterday';
import { startOfDay } from 'date-fns/startOfDay';
import { endOfDay } from 'date-fns/endOfDay';
import { isThisWeek } from 'date-fns/isThisWeek';
import { isThisMonth } from 'date-fns/isThisMonth';
import { subDays } from 'date-fns/subDays';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';

// Locale otimizado
import { ptBR } from 'date-fns/locale/pt-BR';

export {
  format,
  isPast,
  differenceInDays,
  isToday,
  isTomorrow,
  isYesterday,
  startOfDay,
  endOfDay,
  isThisWeek,
  isThisMonth,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  ptBR
}

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

export const parseDateInput = (value: Date | string) => {
  if (value instanceof Date) return value
  const str = String(value || '')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    const day = Number(m[3])
    return new Date(year, month - 1, day, 12, 0, 0, 0)
  }
  return new Date(str)
}

export const normalizeDateForLocalDay = (value: Date | string) => {
  const d = value instanceof Date ? value : new Date(String(value || ''))
  if (isNaN(d.getTime())) return d
  const ymd = d.toISOString().slice(0, 10)
  return parseDateInput(ymd)
}
