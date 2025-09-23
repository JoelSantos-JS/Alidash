-- Tabela para eventos do calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255) UNIQUE, -- ID do evento no Google Calendar
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(500),
    attendees JSONB DEFAULT '[]'::jsonb, -- Array de emails dos participantes
    event_type VARCHAR(50) DEFAULT 'personal' CHECK (event_type IN ('meeting', 'task', 'reminder', 'personal')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(500), -- Regra de recorrência (RRULE)
    color VARCHAR(7) DEFAULT '#3b82f6', -- Cor do evento em hex
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ, -- Última sincronização com Google Calendar
    
    -- Índices para performance
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Tabela para configurações de sincronização do usuário
CREATE TABLE IF NOT EXISTS public.calendar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    google_access_token TEXT, -- Token de acesso criptografado
    google_refresh_token TEXT, -- Token de refresh criptografado
    google_calendar_id VARCHAR(255) DEFAULT 'primary', -- ID do calendário principal
    sync_enabled BOOLEAN DEFAULT true,
    auto_sync_interval INTEGER DEFAULT 15, -- Intervalo em minutos
    last_sync TIMESTAMPTZ,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (sync_direction IN ('import_only', 'export_only', 'bidirectional')),
    notification_preferences JSONB DEFAULT '{
        "email_reminders": true,
        "push_notifications": true,
        "reminder_minutes": [15, 60]
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS public.calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('manual', 'automatic', 'webhook')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
    events_processed INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_deleted INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'partial', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    error_message TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON public.calendar_events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON public.calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON public.calendar_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_user_id ON public.calendar_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_started_at ON public.calendar_sync_logs(started_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON public.calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at 
    BEFORE UPDATE ON public.calendar_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para calendar_events
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own calendar events" ON public.calendar_events
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Políticas para calendar_settings
CREATE POLICY "Users can view their own calendar settings" ON public.calendar_settings
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own calendar settings" ON public.calendar_settings
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update their own calendar settings" ON public.calendar_settings
    FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete their own calendar settings" ON public.calendar_settings
    FOR DELETE USING (user_id = auth.uid()::uuid);

-- Políticas para calendar_sync_logs
CREATE POLICY "Users can view their own sync logs" ON public.calendar_sync_logs
    FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert their own sync logs" ON public.calendar_sync_logs
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Comentários nas tabelas
COMMENT ON TABLE public.calendar_events IS 'Eventos do calendário dos usuários';
COMMENT ON TABLE public.calendar_settings IS 'Configurações de sincronização com Google Calendar';
COMMENT ON TABLE public.calendar_sync_logs IS 'Logs de sincronização do calendário';

-- Comentários nas colunas principais
COMMENT ON COLUMN public.calendar_events.google_event_id IS 'ID único do evento no Google Calendar';
COMMENT ON COLUMN public.calendar_events.recurrence_rule IS 'Regra de recorrência no formato RRULE';
COMMENT ON COLUMN public.calendar_events.attendees IS 'Array JSON com emails dos participantes';
COMMENT ON COLUMN public.calendar_settings.google_access_token IS 'Token de acesso OAuth2 do Google (criptografado)';
COMMENT ON COLUMN public.calendar_settings.notification_preferences IS 'Preferências de notificação em formato JSON';