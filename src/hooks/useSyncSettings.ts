import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  bidirectionalSync: boolean;
  syncOnStartup: boolean;
  syncOnEventCreate: boolean;
  syncOnEventUpdate: boolean;
  syncOnEventDelete: boolean;
  lastSync: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncErrors: string[];
}

export const useSyncSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SyncSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configurações
  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/calendar/sync-settings?user_id=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar configurações');
      }

      setSettings(data.settings);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: Partial<SyncSettings>) => {
    if (!user?.id || !settings) return;

    try {
      setError(null);
      
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/calendar/sync-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          settings: updatedSettings
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configurações');
      }

      setSettings(updatedSettings);
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  }, [user?.id, settings]);

  // Atualizar status de sincronização
  const updateSyncStatus = useCallback(async (
    syncStatus: SyncSettings['syncStatus'],
    lastSync?: string,
    syncErrors?: string[]
  ) => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/calendar/sync-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          syncStatus,
          lastSync: lastSync || new Date().toISOString(),
          syncErrors: syncErrors || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar status');
      }

      // Atualizar estado local
      if (settings) {
        setSettings(prev => prev ? {
          ...prev,
          syncStatus,
          lastSync: lastSync || new Date().toISOString(),
          syncErrors: syncErrors || []
        } : null);
      }

      return true;
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      return false;
    }
  }, [user?.id, settings]);

  // Função genérica para atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<SyncSettings>) => {
    return saveSettings(newSettings);
  }, [saveSettings]);

  // Configurações específicas
  const toggleAutoSync = useCallback((enabled: boolean) => {
    return saveSettings({ autoSync: enabled });
  }, [saveSettings]);

  const setSyncInterval = useCallback((interval: number) => {
    return saveSettings({ syncInterval: interval });
  }, [saveSettings]);

  const toggleBidirectionalSync = useCallback((enabled: boolean) => {
    return saveSettings({ bidirectionalSync: enabled });
  }, [saveSettings]);

  const toggleSyncOnStartup = useCallback((enabled: boolean) => {
    return saveSettings({ syncOnStartup: enabled });
  }, [saveSettings]);

  const toggleSyncOnEventCreate = useCallback((enabled: boolean) => {
    return saveSettings({ syncOnEventCreate: enabled });
  }, [saveSettings]);

  const toggleSyncOnEventUpdate = useCallback((enabled: boolean) => {
    return saveSettings({ syncOnEventUpdate: enabled });
  }, [saveSettings]);

  const toggleSyncOnEventDelete = useCallback((enabled: boolean) => {
    return saveSettings({ syncOnEventDelete: enabled });
  }, [saveSettings]);

  // Carregar configurações quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id, loadSettings]);

  // Auto-sync baseado nas configurações
  useEffect(() => {
    if (!settings?.autoSync || !user?.id) return;

    const interval = setInterval(() => {
      // Trigger sync if auto-sync is enabled
      // This will be handled by the sync service
      console.log('Auto-sync triggered');
    }, settings.syncInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [settings?.autoSync, settings?.syncInterval, user?.id]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSettings,
    updateSyncStatus,
    toggleAutoSync,
    setSyncInterval,
    toggleBidirectionalSync,
    toggleSyncOnStartup,
    toggleSyncOnEventCreate,
    toggleSyncOnEventUpdate,
    toggleSyncOnEventDelete
  };
};