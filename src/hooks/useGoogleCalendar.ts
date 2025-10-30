import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-supabase-auth';

interface GoogleCalendarStatus {
  isConnected: boolean;
  isLoading: boolean;
  lastSync: string | null;
  error: string | null;
}

interface SyncResult {
  success: boolean;
  events: number;
  syncResults?: {
    created: number;
    updated: number;
    errors: number;
  };
  error?: string;
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    isConnected: false,
    isLoading: true,
    lastSync: null,
    error: null
  });

  // Verificar status da conexão
  const checkConnectionStatus = useCallback(async () => {
    if (!user?.id) {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: 'Usuário não autenticado'
      }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Primeiro, verificar se as tabelas de calendário existem
      const response = await fetch(`/api/calendar/events?user_id=${user.id}&limit=1`);
      
      if (!response.ok) {
        console.error('Erro ao verificar eventos:', response.status);
        return;
      }
      
      const data = await response.json();

      if (response.ok) {
        // Se a API funcionou, verificar se há configurações do Google Calendar
        const authResponse = await fetch(`/api/calendar/auth?user_id=${user.id}&check_only=true`);
        
        if (!authResponse.ok) {
          console.error('Erro ao verificar autenticação:', authResponse.status);
          return;
        }
        
        const authData = await authResponse.json();
        
        setStatus(prev => ({
          ...prev,
          isConnected: authData.isConnected || false,
          isLoading: false,
          lastSync: authData.lastSync || null
        }));
      } else {
        // Se a API falhou, provavelmente as tabelas não existem
        if (response.status === 500) {
          setStatus(prev => ({
            ...prev,
            isConnected: false,
            isLoading: false,
            error: 'Tabelas de calendário não configuradas. Execute os scripts SQL necessários.'
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            isConnected: false,
            isLoading: false,
            error: data.error || 'Erro ao verificar conexão'
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: 'Erro de conexão com o servidor'
      }));
    }
  }, [user?.id]);

  // Conectar com Google Calendar
  const connectGoogleCalendar = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Obter URL de autorização
      const authResponse = await fetch(`/api/calendar/auth?user_id=${user.id}`);
      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Erro ao gerar URL de autorização');
      }

      // Redirecionar para autorização do Google
      window.location.href = authData.authUrl;
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.id]);

  // Processar callback de autorização
  const handleAuthCallback = useCallback(async (code: string, state?: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/calendar/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          user_id: user.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar autorização');
      }

      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        error: null
      }));

      return data;
    } catch (error) {
      console.error('Erro no callback de autorização:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.id]);

  // Desconectar Google Calendar
  const disconnectGoogleCalendar = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/calendar/auth?user_id=${user.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desconectar');
      }

      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: null,
        lastSync: null
      }));

      return data;
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      throw error;
    }
  }, [user?.id]);

  // Sincronizar eventos
  const syncEvents = useCallback(async (timeMin?: string, timeMax?: string): Promise<SyncResult> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams({
        user_id: user.id
      });

      if (timeMin) params.append('time_min', timeMin);
      if (timeMax) params.append('time_max', timeMax);

      const response = await fetch(`/api/calendar/sync?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na sincronização');
      }

      setStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: data.lastSync,
        error: null
      }));

      return {
        success: true,
        events: data.events,
        syncResults: data.syncResults
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      
      return {
        success: false,
        events: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, [user?.id]);

  // Verificar status na inicialização
  useEffect(() => {
    if (user?.id) {
      checkConnectionStatus();
    }
  }, [user?.id, checkConnectionStatus]);

  return {
    status,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    handleAuthCallback,
    syncEvents,
    checkConnectionStatus,
    refreshStatus: checkConnectionStatus
  };
}