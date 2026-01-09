import { google } from 'googleapis';

// Tipos para eventos do Google Calendar
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  colorId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'task' | 'reminder' | 'personal';
  priority: 'low' | 'medium' | 'high';
  status: 'confirmed' | 'tentative' | 'cancelled';
  isRecurring?: boolean;
  calendarId?: string;
  googleEventId?: string;
  isAllDay?: boolean;
  color?: string;
}

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Gera URL de autorização OAuth2
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Força a exibição do consent screen para obter refresh token
    });
  }

  /**
   * Troca código de autorização por tokens
   */
  async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    return tokens;
  }

  /**
   * Define tokens de acesso
   */
  setCredentials(tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
  }) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Atualiza token de acesso usando refresh token
   */
  async refreshAccessToken(): Promise<{
    access_token: string;
    expiry_date?: number;
  }> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
    return credentials;
  }

  /**
   * Lista calendários do usuário
   */
  async listCalendars(): Promise<Array<{
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    accessRole: string;
  }>> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao listar calendários:', error);
      throw new Error('Falha ao buscar calendários');
    }
  }

  /**
   * Lista eventos de um calendário
   */
  async listEvents(
    calendarId: string = 'primary',
    options: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    } = {}
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const {
        timeMin = new Date(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        maxResults = 250,
        singleEvents = true,
        orderBy = 'startTime'
      } = options;

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults,
        singleEvents,
        orderBy
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw new Error('Falha ao buscar eventos');
    }
  }

  /**
   * Cria um novo evento
   */
  async createEvent(
    event: Omit<GoogleCalendarEvent, 'id'>,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw new Error('Falha ao criar evento');
    }
  }

  /**
   * Atualiza um evento existente
   */
  async updateEvent(
    eventId: string,
    event: Partial<GoogleCalendarEvent>,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw new Error('Falha ao atualizar evento');
    }
  }

  /**
   * Deleta um evento
   */
  async deleteEvent(
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw new Error('Falha ao deletar evento');
    }
  }

  /**
   * Converte evento do Google Calendar para formato interno
   */
  static convertFromGoogleEvent(googleEvent: GoogleCalendarEvent): Partial<CalendarEvent> {
    const startTime = googleEvent.start.dateTime 
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start.date + 'T00:00:00');
    
    const endTime = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end.date + 'T23:59:59');

    return {
      googleEventId: googleEvent.id,
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime,
      endTime,
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map(a => a.email) || [],
      status: googleEvent.status || 'confirmed',
      isAllDay: !!googleEvent.start.date,
      isRecurring: !!googleEvent.recurrence?.length,
      type: 'personal' // Padrão, pode ser inferido baseado no conteúdo
    };
  }

  /**
   * Converte evento interno para formato do Google Calendar
   */
  static convertToGoogleEvent(event: CalendarEvent): GoogleCalendarEvent {
    const googleEvent: GoogleCalendarEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
      status: event.status,
      start: {},
      end: {}
    };

    if (event.isAllDay) {
      googleEvent.start = {
        date: event.startTime.toISOString().split('T')[0]
      };
      googleEvent.end = {
        date: event.endTime.toISOString().split('T')[0]
      };
    } else {
      googleEvent.start = {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      };
      googleEvent.end = {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      };
    }

    if (event.attendees?.length) {
      googleEvent.attendees = event.attendees.map(email => ({ email }));
    }

    return googleEvent;
  }

  /**
   * Verifica se os tokens são válidos
   */
  async validateTokens(): Promise<boolean> {
    try {
      await this.calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default GoogleCalendarService;
