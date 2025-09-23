-- Criar tabela calendar_sync_settings
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_sync BOOLEAN DEFAULT true,
  bidirectional_sync BOOLEAN DEFAULT true,
  sync_interval INTEGER DEFAULT 300,
  sync_on_create BOOLEAN DEFAULT true,
  sync_on_update BOOLEAN DEFAULT true,
  sync_on_delete BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle',
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_user_id ON calendar_sync_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_last_sync ON calendar_sync_settings(last_sync);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_calendar_sync_settings_updated_at ON calendar_sync_settings;
CREATE TRIGGER update_calendar_sync_settings_updated_at
    BEFORE UPDATE ON calendar_sync_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view their own sync settings" ON calendar_sync_settings;
CREATE POLICY "Users can view their own sync settings" ON calendar_sync_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sync settings" ON calendar_sync_settings;
CREATE POLICY "Users can insert their own sync settings" ON calendar_sync_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sync settings" ON calendar_sync_settings;
CREATE POLICY "Users can update their own sync settings" ON calendar_sync_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sync settings" ON calendar_sync_settings;
CREATE POLICY "Users can delete their own sync settings" ON calendar_sync_settings
    FOR DELETE USING (auth.uid() = user_id);