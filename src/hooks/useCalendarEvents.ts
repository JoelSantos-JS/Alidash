import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export interface CalendarEvent {
  id: string;
  user_id: string;
  google_event_id?: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  is_all_day: boolean;
  attendees: any[];
  recurrence: any;
  created_at: string;
  updated_at: string;
}

interface EventsState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

interface CreateEventData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day?: boolean;
  attendees?: any[];
  recurrence?: any;
}

interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const [state, setState] = useState<EventsState>({
    events: [],
    isLoading: true,
    error: null,
    total: 0
  });

  // Verificar se as tabelas do calendário existem
  const checkTablesExist = useCallback(async () => {
    if (!user?.uid) return false;

    try {
      const response = await fetch(`/api/calendar/events?user_id=${user.uid}&limit=1`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, [user?.uid]);

  // Buscar eventos
  const fetchEvents = useCallback(async (
    startDate?: string,
    endDate?: string,
    limit: number = 50
  ) => {
    if (!user?.uid) return;

    // Verificar se as tabelas existem antes de tentar buscar eventos
    const tablesExist = await checkTablesExist();
    if (!tablesExist) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Tabelas do calendário não configuradas. Execute os scripts SQL necessários no Supabase.',
        events: [],
        total: 0
      }));
      return [];
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams({
        user_id: user.uid,
        limit: limit.toString()
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/calendar/events?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar eventos');
      }

      setState(prev => ({
        ...prev,
        events: data.events,
        total: data.total,
        isLoading: false,
        error: null
      }));

      return data.events;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      return [];
    }
  }, [user?.uid, checkTablesExist]);

  // Criar evento
  const createEvent = useCallback(async (eventData: CreateEventData, syncWithGoogle = false) => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const endpoint = syncWithGoogle ? '/api/calendar/sync' : '/api/calendar/events';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          ...eventData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar evento');
      }

      // Atualizar lista local
      setState(prev => ({
        ...prev,
        events: [...prev.events, data.event],
        total: prev.total + 1,
        isLoading: false,
        error: null
      }));

      return data.event;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.uid]);

  // Atualizar evento
  const updateEvent = useCallback(async (eventData: UpdateEventData) => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/calendar/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          ...eventData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar evento');
      }

      // Atualizar lista local
      setState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === eventData.id ? data.event : event
        ),
        isLoading: false,
        error: null
      }));

      return data.event;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.uid]);

  // Deletar evento
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!user?.uid) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/calendar/events?id=${eventId}&user_id=${user.uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar evento');
      }

      // Remover da lista local
      setState(prev => ({
        ...prev,
        events: prev.events.filter(event => event.id !== eventId),
        total: prev.total - 1,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.uid]);

  // Buscar eventos por período
  const getEventsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return state.events.filter(event => {
      const eventStart = new Date(event.start_time);
      return eventStart >= startDate && eventStart <= endDate;
    });
  }, [state.events]);

  // Buscar eventos de hoje
  const getTodayEvents = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return getEventsByDateRange(startOfDay, endOfDay);
  }, [getEventsByDateRange]);

  // Buscar próximos eventos
  const getUpcomingEvents = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return state.events
      .filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart >= now && eventStart <= futureDate;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [state.events]);

  // Buscar eventos por status
  const getEventsByStatus = useCallback((status: 'confirmed' | 'tentative' | 'cancelled') => {
    return state.events.filter(event => event.status === status);
  }, [state.events]);

  // Carregar eventos na inicialização
  useEffect(() => {
    if (user?.uid) {
      fetchEvents();
    }
  }, [user?.uid, fetchEvents]);

  return {
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    total: state.total,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDateRange,
    getTodayEvents,
    getUpcomingEvents,
    getEventsByStatus,
    refreshEvents: fetchEvents
  };
}