# Configuração do Sistema de Notificações - Alidash

Este documento contém as instruções para configurar o sistema completo de notificações push e por email.

## 📋 Visão Geral

O sistema de notificações implementado inclui:

- ✅ **PWA (Progressive Web App)** com Service Worker
- ✅ **Notificações Push** via Web Push API
- ✅ **Notificações por Email** via n8n
- ✅ **Gerenciamento de Preferências** do usuário
- ✅ **Integração com Calendário** para lembretes automáticos
- ✅ **Interface de Configuração** completa

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Chaves VAPID para Push Notifications
VAPID_PUBLIC_KEY=BAQtepBYS8CDWvRvJ9_9lzfu5GMbmh7uENvY9kJkVmnJr_D5-zgCF-jyZ-UXjw3xs8aWkRiVZyH8QaoGJhGMMuI
VAPID_PRIVATE_KEY=XeUoqHOllfkjCGSGInKZ4QBHzRDNt3rIMazDl0jJzhI

# URL do webhook n8n para emails (opcional)
N8N_WEBHOOK_URL=https://seu-n8n-instance.com/webhook

# Email para VAPID (substitua pelo seu)
VAPID_EMAIL=seu-email@exemplo.com
```

### 2. Configurar Banco de Dados

Execute o script SQL no Supabase SQL Editor:

```bash
# O arquivo create-notification-tables.sql contém:
# - Tabela push_subscriptions
# - Tabela notification_logs  
# - Políticas RLS
# - Índices e triggers
```

**Passos:**
1. Acesse o Supabase Dashboard
2. Vá para "SQL Editor"
3. Cole o conteúdo de `create-notification-tables.sql`
4. Execute o script
5. Verifique se as tabelas foram criadas

### 3. Configurar Service Worker

O Service Worker já está configurado em `/public/sw.js` e registrado automaticamente.

**Recursos incluídos:**
- Cache de recursos estáticos
- Interceptação de notificações push
- Sincronização em background
- Gerenciamento de cliques em notificações

## 📱 Funcionalidades Implementadas

### Notificações Push

**APIs criadas:**
- `POST /api/notifications/subscribe` - Registrar subscription
- `POST /api/notifications/unsubscribe` - Cancelar subscription  
- `POST /api/notifications/send` - Enviar notificação
- `GET/POST /api/notifications/preferences` - Gerenciar preferências

**Hook personalizado:**
- `useNotifications()` - Gerenciamento completo de notificações

### Notificações por Email

**API criada:**
- `POST /api/notifications/email` - Enviar email via n8n

**Integração:**
- Conecta com workflows n8n existentes
- Fallback para modo desenvolvimento
- Logs de envio automáticos

### Interface de Usuário

**Componente criado:**
- `NotificationSettings` - Interface completa para configurações

**Recursos:**
- Toggle para push notifications
- Toggle para email notifications
- Configuração por tipo de notificação
- Teste de notificações
- Configuração de tempo de antecedência

### Integração com Calendário

**Hook especializado:**
- `useCalendarNotifications()` - Notificações específicas para eventos

**Funcionalidades:**
- Lembretes automáticos de eventos
- Resumo diário por email
- Detecção de conflitos de agenda
- Lembretes de preparação para reuniões
- Notificação de eventos perdidos

## 🎯 Tipos de Notificação Suportados

1. **calendar_event** - Eventos e lembretes do calendário
2. **product_alert** - Alertas de produtos
3. **transaction** - Alertas de transações
4. **goal_reminder** - Lembretes de metas
5. **debt_reminder** - Lembretes de dívidas
6. **general** - Notificações gerais

## 🔒 Segurança e Privacidade

### Row Level Security (RLS)
- Usuários só acessam suas próprias subscriptions
- Logs de notificação protegidos por usuário
- Políticas de inserção controladas

### Gerenciamento de Preferências
- Controle granular por tipo de notificação
- Opt-out fácil para qualquer canal
- Persistência segura no Supabase

## 🧪 Como Testar

### 1. Testar Notificações Push

```javascript
// No console do navegador
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Push notifications suportadas');
}
```

### 2. Testar Interface

1. Acesse `/agenda` ou qualquer página com o componente
2. Abra as configurações de notificação
3. Ative as notificações push
4. Clique em "Testar Notificação"

### 3. Testar API

```bash
# Testar subscription
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid", "subscription": {...}}'

# Testar envio
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"user_id": "uuid", "notification": {...}}'
```

## 📊 Monitoramento

### Logs de Notificação
- Todas as notificações são logadas na tabela `notification_logs`
- Contadores de sucesso e falha
- Metadados em formato JSON

### Limpeza Automática
- Função `cleanup_old_notification_logs()` disponível
- Remove logs antigos (90 dias)
- Remove subscriptions inativas (30 dias)

## 🔄 Integração com Calendário

### Uso Básico

```typescript
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications'

const { scheduleEventNotification, sendDailyEmailSummary } = useCalendarNotifications()

// Agendar lembrete para evento
await scheduleEventNotification(event, 15) // 15 minutos antes

// Enviar resumo diário
await sendDailyEmailSummary(todayEvents)
```

### Configuração de Lembretes

Os usuários podem configurar:
- Tempo de antecedência (5min a 1 dia)
- Tipos de eventos para notificar
- Canais de notificação (push, email, ambos)

## 🚀 Próximos Passos

1. **Configurar n8n** para emails em produção
2. **Testar** em diferentes dispositivos
3. **Monitorar** logs de notificação
4. **Ajustar** preferências padrão conforme uso
5. **Implementar** analytics de engajamento

## 📝 Notas Importantes

- As chaves VAPID são específicas para este projeto
- Substitua o email VAPID pelo seu email real
- Configure HTTPS em produção para PWA funcionar
- Teste em diferentes navegadores
- Monitore quotas de push notifications

## 🆘 Solução de Problemas

### Notificações não aparecem
1. Verificar permissões do navegador
2. Verificar se Service Worker está registrado
3. Verificar chaves VAPID no .env
4. Verificar logs do console

### Emails não são enviados
1. Verificar configuração n8n
2. Verificar webhook URL
3. Verificar logs da API
4. Testar em modo desenvolvimento

### Erro de subscription
1. Verificar se tabelas existem no Supabase
2. Verificar políticas RLS
3. Verificar autenticação do usuário
4. Verificar formato da subscription

---

**Sistema de Notificações Alidash** - Implementação completa com PWA, Push Notifications e Email integrado com n8n.