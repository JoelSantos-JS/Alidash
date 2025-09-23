import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface SyncSettings {
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

/**
 * Função para garantir que a tabela existe
 */
async function ensureTableExists(supabase: any) {
  try {
    // Tentar fazer uma query simples para verificar se a tabela existe
    const { error } = await supabase
      .from('calendar_sync_settings')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Tabela calendar_sync_settings não existe. Criando...');
      
      // A tabela não existe, mas não podemos criá-la via JavaScript
      // Vamos retornar um erro específico para orientar o usuário
      throw new Error('TABELA_NAO_EXISTE');
    }
    
    return true;
  } catch (error: any) {
    if (error.message === 'TABELA_NAO_EXISTE') {
      throw error;
    }
    console.error('Erro ao verificar tabela:', error);
    return false;
  }
}

/**
 * GET - Buscar configurações de sincronização do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verificar se a tabela existe
    try {
      await ensureTableExists(supabase);
    } catch (error: any) {
      if (error.message === 'TABELA_NAO_EXISTE') {
        return NextResponse.json(
          { 
            error: 'Tabela de configurações não existe. Execute o script SQL no painel do Supabase.',
            needsSetup: true 
          },
          { status: 503 }
        );
      }
    }
    
    // Buscar configurações existentes
    const { data: settings, error } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      );
    }

    // Se não existir, retornar configurações padrão
    if (!settings) {
      const defaultSettings: SyncSettings = {
        autoSync: true,
        syncInterval: 15,
        bidirectionalSync: true,
        syncOnStartup: true,
        syncOnEventCreate: true,
        syncOnEventUpdate: true,
        syncOnEventDelete: true,
        lastSync: null,
        syncStatus: 'idle',
        syncErrors: []
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        autoSync: settings.auto_sync,
        syncInterval: settings.sync_interval,
        bidirectionalSync: settings.bidirectional_sync,
        syncOnStartup: settings.sync_on_startup,
        syncOnEventCreate: settings.sync_on_event_create,
        syncOnEventUpdate: settings.sync_on_event_update,
        syncOnEventDelete: settings.sync_on_event_delete,
        lastSync: settings.last_sync,
        syncStatus: settings.sync_status || 'idle',
        syncErrors: settings.sync_errors ? JSON.parse(settings.sync_errors) : []
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configurações de sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Salvar configurações de sincronização do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, settings } = await request.json();

    if (!user_id || !settings) {
      return NextResponse.json(
        { error: 'user_id e settings são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Preparar dados para salvar
    const settingsData = {
      user_id,
      auto_sync: settings.autoSync,
      sync_interval: settings.syncInterval,
      bidirectional_sync: settings.bidirectionalSync,
      sync_on_startup: settings.syncOnStartup,
      sync_on_event_create: settings.syncOnEventCreate,
      sync_on_event_update: settings.syncOnEventUpdate,
      sync_on_event_delete: settings.syncOnEventDelete,
      last_sync: settings.lastSync,
      sync_status: settings.syncStatus || 'idle',
      sync_errors: JSON.stringify(settings.syncErrors || []),
      updated_at: new Date().toISOString()
    };

    // Tentar atualizar primeiro
    const { data: existingSettings } = await supabase
      .from('calendar_sync_settings')
      .select('id')
      .eq('user_id', user_id)
      .single();

    let result;
    if (existingSettings) {
      // Atualizar configurações existentes
      result = await supabase
        .from('calendar_sync_settings')
        .update(settingsData)
        .eq('user_id', user_id)
        .select()
        .single();
    } else {
      // Criar novas configurações
      result = await supabase
        .from('calendar_sync_settings')
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Erro ao salvar configurações:', result.error);
      return NextResponse.json(
        { error: 'Erro ao salvar configurações' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar configurações de sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar status de sincronização
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user_id, syncStatus, lastSync, syncErrors } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (syncStatus !== undefined) updateData.sync_status = syncStatus;
    if (lastSync !== undefined) updateData.last_sync = lastSync;
    if (syncErrors !== undefined) updateData.sync_errors = JSON.stringify(syncErrors);

    const { error } = await supabase
      .from('calendar_sync_settings')
      .update(updateData)
      .eq('user_id', user_id);

    if (error) {
      console.error('Erro ao atualizar status de sincronização:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar status de sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}