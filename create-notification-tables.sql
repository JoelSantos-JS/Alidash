-- Script SQL para criar tabelas de notificações no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    UNIQUE(user_id, endpoint)
);

-- Índices para a tabela push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- 2. Tabela para logs de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('calendar_event', 'product_alert', 'transaction', 'goal_reminder', 'debt_reminder', 'general')),
    title TEXT NOT NULL,
    body TEXT,
    channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'email', 'both')),
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadados adicionais
    metadata JSONB
);

-- Índices para a tabela notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger para atualizar updated_at na tabela push_subscriptions
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Configurar Row Level Security (RLS)

-- Habilitar RLS nas tabelas
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para notification_logs
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
CREATE POLICY "Users can view their own notification logs"
    ON notification_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert notification logs" ON notification_logs;
CREATE POLICY "Service can insert notification logs"
    ON notification_logs FOR INSERT
    WITH CHECK (true); -- Permite inserção via API

-- 6. Comentários nas tabelas
COMMENT ON TABLE push_subscriptions IS 'Armazena subscriptions de push notifications dos usuários';
COMMENT ON TABLE notification_logs IS 'Log de todas as notificações enviadas';

COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL do endpoint de push notification';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Chave pública P256DH para criptografia';
COMMENT ON COLUMN push_subscriptions.auth IS 'Chave de autenticação para push notifications';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Indica se a subscription está ativa';

COMMENT ON COLUMN notification_logs.type IS 'Tipo da notificação enviada';
COMMENT ON COLUMN notification_logs.channel IS 'Canal usado para envio (push, email, both)';
COMMENT ON COLUMN notification_logs.success_count IS 'Número de envios bem-sucedidos';
COMMENT ON COLUMN notification_logs.failure_count IS 'Número de falhas no envio';
COMMENT ON COLUMN notification_logs.metadata IS 'Dados adicionais da notificação em formato JSON';

-- 7. Função para limpar logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
    -- Remove logs mais antigos que 90 dias
    DELETE FROM notification_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days';
    
    -- Remove subscriptions inativas há mais de 30 dias
    DELETE FROM push_subscriptions 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Verificar se as tabelas foram criadas corretamente
DO $$
BEGIN
    -- Verificar push_subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        RAISE NOTICE 'Tabela push_subscriptions criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela push_subscriptions';
    END IF;
    
    -- Verificar notification_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
        RAISE NOTICE 'Tabela notification_logs criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Erro ao criar tabela notification_logs';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas de notificações foram criadas com sucesso!';
END $$;