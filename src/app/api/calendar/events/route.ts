import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

/**
 * GET - Buscar eventos locais do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // First, get the Supabase user ID from Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userId = user.id;
    
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })
      .limit(limit);

    // Filtrar por data se fornecido
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Falha ao buscar eventos' },
        { status: 500 }
      );
    }

    // Processar eventos para formato adequado
    const processedEvents = events.map(event => ({
      ...event,
      attendees: event.attendees ? JSON.parse(event.attendees) : [],
      recurrence: event.recurrence ? JSON.parse(event.recurrence) : null
    }));

    return NextResponse.json({
      success: true,
      events: processedEvents,
      total: events.length
    });

  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar evento local (sem sincronização com Google)
 */
export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    const { 
      user_id: firebaseUid, 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      is_all_day,
      attendees,
      recurrence 
    } = eventData;

    if (!firebaseUid || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: user_id, title, start_time, end_time' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // First, get the Supabase user ID from Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userId = user.id;
    
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        title,
        description: description || '',
        start_time,
        end_time,
        location: location || '',
        status: 'confirmed',
        is_all_day: is_all_day || false,
        attendees: attendees ? JSON.stringify(attendees) : null,
        recurrence: recurrence ? JSON.stringify(recurrence) : null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar evento:', error);
      return NextResponse.json(
        { error: 'Falha ao criar evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        recurrence: event.recurrence ? JSON.parse(event.recurrence) : null
      }
    });

  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar evento existente
 */
export async function PUT(request: NextRequest) {
  try {
    const eventData = await request.json();
    const { 
      id,
      user_id: firebaseUid, 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      is_all_day,
      status,
      attendees,
      recurrence 
    } = eventData;

    if (!id || !firebaseUid) {
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // First, get the Supabase user ID from Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userId = user.id;
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Adicionar campos que foram fornecidos
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (location !== undefined) updateData.location = location;
    if (is_all_day !== undefined) updateData.is_all_day = is_all_day;
    if (status !== undefined) updateData.status = status;
    if (attendees !== undefined) updateData.attendees = JSON.stringify(attendees);
    if (recurrence !== undefined) updateData.recurrence = JSON.stringify(recurrence);

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar evento:', error);
      return NextResponse.json(
        { error: 'Falha ao atualizar evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        attendees: event.attendees ? JSON.parse(event.attendees) : [],
        recurrence: event.recurrence ? JSON.parse(event.recurrence) : null
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deletar evento
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const firebaseUid = searchParams.get('user_id');

    if (!eventId || !firebaseUid) {
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // First, get the Supabase user ID from Firebase UID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const userId = user.id;
    
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao deletar evento:', error);
      return NextResponse.json(
        { error: 'Falha ao deletar evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}