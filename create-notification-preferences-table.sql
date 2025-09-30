-- Script SQL para criar a tabela notification_preferences no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    calendar_reminders BOOLEAN DEFAULT true,
    product_alerts BOOLEAN DEFAULT true,
    transaction_alerts BOOLEAN DEFAULT true,
    goal_reminders BOOLEAN DEFAULT true,
    debt_reminders BOOLEAN DEFAULT true,
    reminder_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada usuário tenha apenas uma linha de preferências
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar Row Level Security (RLS)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_preferences
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can delete their own notification preferences"
    ON notification_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Comentários na tabela
COMMENT ON TABLE notification_preferences IS 'Armazena as preferências de notificação de cada usuário';
COMMENT ON COLUMN notification_preferences.user_id IS 'ID do usuário (referência para auth.users)';
COMMENT ON COLUMN notification_preferences.push_notifications IS 'Habilitar notificações push';
COMMENT ON COLUMN notification_preferences.email_notifications IS 'Habilitar notificações por email';
COMMENT ON COLUMN notification_preferences.calendar_reminders IS 'Habilitar lembretes de calendário';
COMMENT ON COLUMN notification_preferences.product_alerts IS 'Habilitar alertas de produtos';
COMMENT ON COLUMN notification_preferences.transaction_alerts IS 'Habilitar alertas de transações';
COMMENT ON COLUMN notification_preferences.goal_reminders IS 'Habilitar lembretes de metas';
COMMENT ON COLUMN notification_preferences.debt_reminders IS 'Habilitar lembretes de dívidas';
COMMENT ON COLUMN notification_preferences.reminder_time IS 'Tempo de antecedência para lembretes (em minutos)';

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        RAISE NOTICE 'Tabela notification_preferences criada com sucesso!';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela notification_preferences';
    END IF;
END $$;