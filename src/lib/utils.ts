import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções para gerenciar compras parceladas no cartão
export function calculateInstallmentInfo(
  totalAmount: number,
  totalInstallments: number,
  currentInstallment: number = 1
) {
  const installmentAmount = totalAmount / totalInstallments;
  const remainingAmount = totalAmount - (installmentAmount * (currentInstallment - 1));
  
  return {
    totalAmount,
    totalInstallments,
    currentInstallment,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
  };
}

export function generateInstallmentTransactions(
  description: string,
  totalAmount: number,
  totalInstallments: number,
  startDate: Date,
  category: string,
  paymentMethod: 'credit_card' = 'credit_card'
) {
  const transactions = [];
  const installmentAmount = totalAmount / totalInstallments;
  
  for (let i = 1; i <= totalInstallments; i++) {
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
    
    const installmentInfo = calculateInstallmentInfo(totalAmount, totalInstallments, i);
    
    transactions.push({
      id: `${Date.now()}-${i}`,
      date: installmentDate,
      description: `${description} (${i}/${totalInstallments})`,
      amount: Math.round(installmentAmount * 100) / 100,
      type: 'expense' as const,
      category,
      paymentMethod,
      status: i === 1 ? 'completed' : 'pending',
      isInstallment: true,
      installmentInfo,
      tags: ['parcelado', 'cartão-credito'],
    });
  }
  
  return transactions;
}

export function formatInstallmentDescription(description: string, current: number, total: number) {
  return `${description} (${current}/${total})`;
}

export function getInstallmentProgress(current: number, total: number) {
  return Math.round((current / total) * 100);
}

export function isInstallmentTransaction(transaction: any) {
  return transaction.isInstallment && transaction.installmentInfo;
}

export function getNextInstallmentDate(currentDate: Date, installmentNumber: number) {
  const nextDate = new Date(currentDate);
  nextDate.setMonth(nextDate.getMonth() + installmentNumber);
  return nextDate;
}
