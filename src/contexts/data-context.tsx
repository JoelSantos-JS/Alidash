"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/use-supabase-auth';
import type { Expense, Revenue } from '@/types';

interface DataContextType {
  expenses: Expense[];
  revenues: Revenue[];
  addExpense: (expense: Expense) => void;
  addRevenue: (revenue: Revenue) => void;
  updateExpense: (expense: Expense) => void;
  updateRevenue: (revenue: Revenue) => void;
  deleteExpense: (id: string) => void;
  deleteRevenue: (id: string) => void;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) {
      console.log('🚫 fetchExpenses: user.id não disponível');
      return [];
    }
    
    try {
      console.log('🔍 Buscando despesas para user_id:', user.id);
      const response = await fetch(`/api/expenses?user_id=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Despesas carregadas:', data.expenses?.length || 0);
        return data.expenses || [];
      } else {
        console.error('❌ Erro na resposta da API de despesas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
    }
    return [];
  }, [user?.id]);

  const fetchRevenues = useCallback(async () => {
    if (!user?.id) {
      console.log('🚫 fetchRevenues: user.id não disponível');
      return [];
    }
    
    try {
      console.log('🔍 Buscando receitas para user_id:', user.id);
      const response = await fetch(`/api/revenues?user_id=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Receitas carregadas:', data.revenues?.length || 0);
        return data.revenues || [];
      } else {
        console.error('❌ Erro na resposta da API de receitas:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar receitas:', error);
    }
    return [];
  }, [user?.id]);

  const refreshData = useCallback(async () => {
    if (!user?.id) {
      console.log('🚫 refreshData: user.id não disponível');
      return;
    }
    
    console.log('🔄 Iniciando refreshData para user:', user.id);
    setIsLoading(true);
    try {
      const [expensesData, revenuesData] = await Promise.all([
        fetchExpenses(),
        fetchRevenues()
      ]);
      
      console.log('📊 Dados carregados - Despesas:', expensesData.length, 'Receitas:', revenuesData.length);
      setExpenses(expensesData);
      setRevenues(revenuesData);
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchExpenses, fetchRevenues]);

  useEffect(() => {
    console.log('🔄 useEffect do DataContext - user.id:', user?.id, 'authLoading:', loading);
    if (user?.id) {
      refreshData().catch(error => {
        console.error('❌ Erro no useEffect ao chamar refreshData:', error);
      });
    } else {
      console.log('🧹 Limpando dados - usuário não disponível');
      setExpenses([]);
      setRevenues([]);
      setIsLoading(false);
    }
  }, [user?.id, refreshData]); // Adicionar refreshData de volta às dependências já que está memoizado

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    // Disparar evento customizado para notificar outras partes da aplicação
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'expense', action: 'add', data: expense } 
      }));
    }
  };

  const addRevenue = (revenue: Revenue) => {
    setRevenues(prev => [revenue, ...prev]);
    // Disparar evento customizado para notificar outras partes da aplicação
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'revenue', action: 'add', data: revenue } 
      }));
    }
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'expense', action: 'update', data: updatedExpense } 
      }));
    }
  };

  const updateRevenue = (updatedRevenue: Revenue) => {
    setRevenues(prev => 
      prev.map(revenue => 
        revenue.id === updatedRevenue.id ? updatedRevenue : revenue
      )
    );
    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'revenue', action: 'update', data: updatedRevenue } 
      }));
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'expense', action: 'delete', data: { id } } 
      }));
    }
  };

  const deleteRevenue = (id: string) => {
    setRevenues(prev => prev.filter(revenue => revenue.id !== id));
    // Disparar evento customizado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'revenue', action: 'delete', data: { id } } 
      }));
    }
  };

  const value: DataContextType = {
    expenses,
    revenues,
    addExpense,
    addRevenue,
    updateExpense,
    updateRevenue,
    deleteExpense,
    deleteRevenue,
    refreshData,
    isLoading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}