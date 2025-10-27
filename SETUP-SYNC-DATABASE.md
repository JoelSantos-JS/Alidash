# Configuração da Tabela de Sincronização

## ⚠️ IMPORTANTE: Configuração Necessária

Para que o sistema de sincronização bidirecional funcione corretamente, você precisa criar a tabela `calendar_sync_settings` no seu banco de dados Supabase.

## 📋 Instruções

### 1. Acesse o Painel do Supabase
- Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Faça login na sua conta
- Selecione o projeto **VoxCash**

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**

### 3. Execute o Script SQL
Copie e cole o seguinte script SQL e clique em **Run**:

```sql
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
```

### 4. Verificar a Criação
Após executar o script, você deve ver uma mensagem de sucesso. Para verificar se a tabela foi criada corretamente:

1. Vá para **Table Editor** no menu lateral
2. Procure pela tabela `calendar_sync_settings`
3. Verifique se ela aparece na lista de tabelas

## ✅ Funcionalidades Implementadas

Após a configuração da tabela, o sistema de sincronização oferece:

### 🔄 Sincronização Bidirecional
- **Automática**: Sincronização em intervalos regulares (padrão: 5 minutos)
- **Manual**: Botão para sincronizar imediatamente
- **Bidirecional**: Eventos criados no Google Calendar aparecem na aplicação e vice-versa

### ⚙️ Configurações Personalizáveis
- **Auto-sync**: Ativar/desativar sincronização automática
- **Intervalo**: Definir frequência da sincronização (em segundos)
- **Triggers**: Configurar quando sincronizar (criação, edição, exclusão)
- **Status**: Monitoramento em tempo real do status da sincronização

### 🎯 Interface de Usuário
- **Painel de Configurações**: Acesse clicando no botão "Configurações" na página da agenda
- **Indicadores Visuais**: Status da conexão e última sincronização
- **Tratamento de Erros**: Mensagens claras em caso de problemas

## 🚀 Como Usar

1. **Conecte o Google Calendar**: Use o botão "Conectar Google Calendar" na página da agenda
2. **Configure a Sincronização**: Clique em "Configurações" para personalizar as opções
3. **Monitore o Status**: Acompanhe o status da sincronização no painel

## 🔧 Troubleshooting

Se você encontrar problemas:

1. **Verifique a Conexão**: Certifique-se de que o Google Calendar está conectado
2. **Confira as Configurações**: Verifique se a sincronização automática está ativada
3. **Logs de Erro**: Consulte os logs no painel de configurações
4. **Reautorização**: Se necessário, desconecte e reconecte o Google Calendar

---

**Nota**: Este sistema foi desenvolvido para funcionar de forma transparente. Uma vez configurado, a sincronização acontece automaticamente em segundo plano.