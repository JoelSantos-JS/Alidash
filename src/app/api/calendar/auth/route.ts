import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar';
import { createClient } from '@/utils/supabase/server';

/**
 * GET - Gera URL de autorização OAuth2 ou verifica status da conexão
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const checkOnly = searchParams.get('check_only') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    // Se for apenas para verificar status
    if (checkOnly) {
      const supabase = await createClient();
      
      const { data: settings, error } = await supabase
        .from('calendar_settings')
        .select('google_access_token, last_sync')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erro ao verificar configurações:', error);
        return NextResponse.json({
          isConnected: false,
          lastSync: null,
          error: 'Erro ao verificar configurações'
        });
      }

      return NextResponse.json({
        isConnected: !!(settings?.google_access_token),
        lastSync: settings?.last_sync || null
      });
    }

    // Gerar URL de autorização
    const googleCalendar = new GoogleCalendarService();
    const authUrl = googleCalendar.getAuthUrl();

    // Salvar state temporário para validação posterior
    const state = `${userId}_${Date.now()}`;
    
    return NextResponse.json({
      authUrl: `${authUrl}&state=${state}`,
      state
    });

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Processar callback de autorização e salvar tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { code, state, user_id } = await request.json();

    if (!code || !user_id) {
      return NextResponse.json(
        { error: 'code e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    const googleCalendar = new GoogleCalendarService();
    
    // Trocar código por tokens
    const tokens = await googleCalendar.getTokensFromCode(code);
    
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Falha ao obter tokens de acesso' },
        { status: 400 }
      );
    }

    // Salvar tokens no banco de dados
    const supabase = await createClient();
    
    // Verificar se já existe configuração para o usuário
    const { data: existingSettings } = await supabase
      .from('calendar_settings')
      .select('id')
      .eq('user_id', user_id)
      .single();

    const settingsData = {
      user_id,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
      sync_enabled: true,
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingSettings) {
      // Atualizar configuração existente
      const { error } = await supabase
        .from('calendar_settings')
        .update(settingsData)
        .eq('user_id', user_id);

      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        return NextResponse.json(
          { error: 'Falha ao salvar configurações' },
          { status: 500 }
        );
      }
    } else {
      // Criar nova configuração
      const { error } = await supabase
        .from('calendar_settings')
        .insert(settingsData);

      if (error) {
        console.error('Erro ao criar configurações:', error);
        return NextResponse.json(
          { error: 'Falha ao salvar configurações' },
          { status: 500 }
        );
      }
    }

    // Testar conexão com Google Calendar
    googleCalendar.setCredentials(tokens);
    const isValid = await googleCalendar.validateTokens();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Tokens inválidos' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar conectado com sucesso',
      hasRefreshToken: !!tokens.refresh_token
    });

  } catch (error) {
    console.error('Erro ao processar autorização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Desconectar Google Calendar
 */
export async function DELETE(request: NextRequest) {
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
    
    // Remover tokens e desabilitar sincronização
    const { error } = await supabase
      .from('calendar_settings')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        sync_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
      return NextResponse.json(
        { error: 'Falha ao desconectar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar desconectado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}