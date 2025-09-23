import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarService } from '@/lib/google-calendar';
import { createClient } from '@/utils/supabase/server';

/**
 * GET - Buscar eventos do Google Calendar e sincronizar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const timeMin = searchParams.get('time_min');
    const timeMax = searchParams.get('time_max');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Buscar configurações do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('calendar_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError || !settings?.google_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar não conectado' },
        { status: 401 }
      );
    }

    const googleCalendar = new GoogleCalendarService();
    googleCalendar.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token
    });

    // Validar e renovar tokens se necessário
    const isValid = await googleCalendar.validateTokens();
    if (!isValid) {
      return NextResponse.json(
        { error: 'Tokens expirados. Reconecte o Google Calendar' },
        { status: 401 }
      );
    }

    // Buscar eventos do Google Calendar
    const events = await googleCalendar.listEvents('primary', {
      timeMin: timeMin ? new Date(timeMin) : new Date(),
      timeMax: timeMax ? new Date(timeMax) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      maxResults: 250
    });

    // Sincronizar eventos com banco local
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0
    };

    for (const event of events) {
      try {
        // Verificar se evento já existe
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id, updated_at')
          .eq('google_event_id', event.id)
          .eq('user_id', userId)
          .single();

        const eventData = {
          user_id: userId,
          google_event_id: event.id,
          title: event.summary || 'Sem título',
          description: event.description || '',
          start_time: event.start?.dateTime || event.start?.date,
          end_time: event.end?.dateTime || event.end?.date,
          location: event.location || '',
          status: event.status || 'confirmed',
          is_all_day: !event.start?.dateTime,
          attendees: event.attendees ? JSON.stringify(event.attendees) : null,
          recurrence: event.recurrence ? JSON.stringify(event.recurrence) : null,
          updated_at: new Date().toISOString()
        };

        if (existingEvent) {
          // Atualizar evento existente
          const { error } = await supabase
            .from('calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id);

          if (error) {
            console.error('Erro ao atualizar evento:', error);
            syncResults.errors++;
          } else {
            syncResults.updated++;
          }
        } else {
          // Criar novo evento
          const { error } = await supabase
            .from('calendar_events')
            .insert(eventData);

          if (error) {
            console.error('Erro ao criar evento:', error);
            syncResults.errors++;
          } else {
            syncResults.created++;
          }
        }
      } catch (error) {
        console.error('Erro ao processar evento:', error);
        syncResults.errors++;
      }
    }

    // Atualizar timestamp da última sincronização
    await supabase
      .from('calendar_settings')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId);

    // Registrar log de sincronização
    await supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: userId,
        sync_type: 'import',
        events_processed: events.length,
        events_created: syncResults.created,
        events_updated: syncResults.updated,
        errors_count: syncResults.errors,
        sync_status: syncResults.errors > 0 ? 'partial' : 'success'
      });

    return NextResponse.json({
      success: true,
      events: events.length,
      syncResults,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar evento no Google Calendar e sincronizar
 */
export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    const { user_id, title, description, start_time, end_time, location, is_all_day } = eventData;

    if (!user_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, title, start_time, end_time' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Buscar configurações do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('calendar_settings')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (settingsError || !settings?.google_access_token) {
      return NextResponse.json(
        { error: 'Google Calendar não conectado' },
        { status: 401 }
      );
    }

    const googleCalendar = new GoogleCalendarService();
    googleCalendar.setCredentials({
      access_token: settings.google_access_token,
      refresh_token: settings.google_refresh_token
    });

    // Criar evento no Google Calendar
    const googleEvent = await googleCalendar.createEvent({
      summary: title,
      description: description || '',
      location: location || '',
      start: is_all_day 
        ? { date: start_time.split('T')[0] }
        : { dateTime: start_time },
      end: is_all_day 
        ? { date: end_time.split('T')[0] }
        : { dateTime: end_time }
    });

    // Salvar evento no banco local
    const { data: localEvent, error: localError } = await supabase
      .from('calendar_events')
      .insert({
        user_id,
        google_event_id: googleEvent.id,
        title,
        description: description || '',
        start_time,
        end_time,
        location: location || '',
        status: 'confirmed',
        is_all_day: is_all_day || false
      })
      .select()
      .single();

    if (localError) {
      console.error('Erro ao salvar evento local:', localError);
      return NextResponse.json(
        { error: 'Evento criado no Google Calendar mas falhou ao salvar localmente' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: localEvent,
      googleEventId: googleEvent.id
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}