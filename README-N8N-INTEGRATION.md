# 🔗 Integração Alidash + N8N

Este guia completo mostra como integrar o Alidash com N8N para automatizar seus fluxos de trabalho de dropshipping.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [API Endpoints](#api-endpoints)
5. [Webhooks](#webhooks)
6. [Workflows de Exemplo](#workflows-de-exemplo)
7. [Casos de Uso](#casos-de-uso)
8. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

A integração Alidash + N8N permite:

- **Sincronização bidirecional** de dados
- **Automação** de processos de dropshipping
- **Notificações** em tempo real
- **Relatórios** automáticos
- **Backup** e sincronização de dados
- **Integração** com múltiplos serviços

### Arquitetura da Integração

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Alidash   │◄──►│     N8N     │◄──►│  Serviços   │
│             │    │             │    │ Externos    │
│ • Produtos  │    │ • Workflows │    │ • Telegram  │
│ • Metas     │    │ • Triggers  │    │ • Email     │
│ • Vendas    │    │ • Actions   │    │ • Slack     │
│ • Analytics │    │ • Schedules │    │ • Sheets    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔧 Pré-requisitos

### Software Necessário

- **N8N** instalado e configurado
- **Alidash** rodando com acesso à internet
- **Node.js** 18+ (para N8N)
- **Banco de dados** (Firebase/Supabase configurado)

### Credenciais Necessárias

- API Key do Alidash
- Tokens dos serviços externos (Telegram, Slack, etc.)
- Credenciais de email (SMTP)
- Chaves de API de serviços (Google Drive, Sheets, etc.)

## ⚙️ Configuração Inicial

### 1. Gerar API Key no Alidash

1. Acesse **Alidash > Configurações > Integração N8N**
2. Clique em **"Nova API Key"**
3. Configure as permissões necessárias:
   - `products:read` - Ler produtos
   - `products:write` - Criar/editar produtos
   - `analytics:read` - Acessar relatórios
   - `webhooks:manage` - Gerenciar webhooks
4. Defina a validade (recomendado: 365 dias)
5. **Copie a API Key** (não será mostrada novamente)

### 2. Configurar N8N

#### Instalar N8N (se necessário)

```bash
# Via npm
npm install n8n -g

# Via Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

#### Configurar Credenciais

1. Acesse N8N em `http://localhost:5678`
2. Vá em **Credentials > Add Credential**
3. Configure as credenciais necessárias:

**Alidash API:**
```json
{
  "name": "Alidash API",
  "type": "httpHeaderAuth",
  "headerName": "x-api-key",
  "headerValue": "SUA_API_KEY_AQUI"
}
```

**Telegram Bot:**
```json
{
  "name": "Telegram Bot",
  "type": "telegramApi",
  "accessToken": "SEU_BOT_TOKEN"
}
```

### 3. Configurar Webhooks

1. No Alidash, vá em **Integração N8N > Webhooks**
2. Clique em **"Novo Webhook"**
3. Configure:
   - **URL**: `https://seu-n8n.com/webhook/alidash-events`
   - **Eventos**: Selecione os eventos desejados
   - **Secret**: Gere uma chave secreta para validação

## 🔌 API Endpoints

### Base URL
```
https://seu-alidash.com/api/n8n
```

### Autenticação
Todos os endpoints requerem o header:
```
x-api-key: SUA_API_KEY
```

### Endpoints Disponíveis

#### 📦 Produtos

**GET /products**
```bash
curl -H "x-api-key: SUA_API_KEY" \
     "https://seu-alidash.com/api/n8n/products?limit=10&status=selling"
```

**POST /products**
```bash
curl -X POST \
     -H "x-api-key: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "create",
       "data": {
         "name": "Produto Teste",
         "category": "Eletrônicos",
         "purchasePrice": 100,
         "sellingPrice": 150
       }
     }' \
     "https://seu-alidash.com/api/n8n/products"
```

#### 📊 Analytics

**GET /analytics**
```bash
curl -H "x-api-key: SUA_API_KEY" \
     "https://seu-alidash.com/api/n8n/analytics?startDate=2024-01-01&insights=true"
```

#### 🩺 Health Check

**GET /health**
```bash
curl "https://seu-alidash.com/api/n8n/health"
```

**POST /health** (Ping Test)
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"test": "ping"}' \
     "https://seu-alidash.com/api/n8n/health"
```

#### 🔗 Webhooks

**POST /webhooks** (Receber eventos)
```bash
curl -X POST \
     -H "x-api-key: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "eventType": "product.tracking.update",
       "data": {
         "trackingCode": "BR123456789",
         "status": "delivered"
       }
     }' \
     "https://seu-alidash.com/api/n8n/webhooks"
```

## 🎣 Webhooks

### Eventos Disponíveis

| Evento | Descrição | Payload |
|--------|-----------|----------|
| `product.created` | Produto criado | `{ product: {...} }` |
| `product.sold` | Produto vendido | `{ product: {...}, sale: {...} }` |
| `goal.completed` | Meta concluída | `{ goal: {...} }` |
| `transaction.created` | Transação criada | `{ transaction: {...} }` |
| `bet.won` | Aposta ganha | `{ bet: {...} }` |

### Configuração no N8N

1. Crie um **Webhook Trigger**
2. Configure a URL: `/webhook/alidash-events`
3. Método: `POST`
4. Adicione validação de assinatura (opcional)

### Exemplo de Payload

```json
{
  "eventType": "product.sold",
  "userId": "user123",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "alidash",
  "data": {
    "product": {
      "id": "prod123",
      "name": "Smartphone Xiaomi",
      "category": "Eletrônicos"
    },
    "sale": {
      "id": "sale456",
      "quantity": 1,
      "revenue": 1500,
      "profit": 470,
      "buyerName": "João Silva"
    }
  }
}
```

## 🔄 Workflows de Exemplo

### 1. Importação Automática de Produtos

**Objetivo**: Importar produtos do AliExpress automaticamente

**Trigger**: Webhook manual ou agendamento

**Fluxo**:
1. Receber URL do AliExpress
2. Fazer scraping dos dados
3. Calcular custos e preços
4. Criar produto no Alidash
5. Notificar via Telegram

**Arquivo**: `docs/n8n-workflow-examples.json` (Workflow 1)

### 2. Monitoramento de Metas

**Objetivo**: Monitorar progresso das metas diariamente

**Trigger**: Cron (diário às 9h)

**Fluxo**:
1. Buscar analytics do Alidash
2. Analisar progresso das metas
3. Gerar relatório
4. Enviar por email

**Arquivo**: `docs/n8n-workflow-examples.json` (Workflow 2)

### 3. Notificações de Venda

**Objetivo**: Notificar vendas em múltiplos canais

**Trigger**: Webhook `product.sold`

**Fluxo**:
1. Receber evento de venda
2. Formatar mensagens
3. Enviar para Telegram, Email, Slack
4. Atualizar planilha Google Sheets

**Arquivo**: `docs/n8n-workflow-examples.json` (Workflow 3)

### 4. Backup Automático

**Objetivo**: Fazer backup diário dos dados

**Trigger**: Cron (diário às 2h)

**Fluxo**:
1. Buscar todos os dados
2. Formatar backup
3. Salvar no Google Drive
4. Notificar conclusão

**Arquivo**: `docs/n8n-workflow-examples.json` (Workflow 4)

## 💡 Casos de Uso

### 🛒 E-commerce Automation

- **Importação de produtos** do AliExpress
- **Atualização de preços** baseada em concorrência
- **Gestão de estoque** automática
- **Processamento de pedidos**

### 📊 Analytics e Relatórios

- **Relatórios diários** de vendas
- **Análise de performance** por categoria
- **Alertas de metas** em atraso
- **Dashboard** em tempo real

### 📱 Notificações

- **Telegram** para vendas
- **Email** para relatórios
- **Slack** para equipe
- **WhatsApp** para clientes

### 💾 Backup e Sincronização

- **Backup automático** no Google Drive
- **Sincronização** com planilhas
- **Replicação** de dados
- **Versionamento** de backups

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Erro 401 - Unauthorized

**Causa**: API Key inválida ou expirada

**Solução**:
1. Verifique se a API Key está correta
2. Confirme se não expirou
3. Verifique as permissões
4. Gere uma nova API Key se necessário

#### ❌ Erro 403 - Forbidden

**Causa**: Permissões insuficientes

**Solução**:
1. Verifique as permissões da API Key
2. Adicione as permissões necessárias
3. Use uma API Key com permissões de admin

#### ❌ Webhook não recebido

**Causa**: URL incorreta ou webhook inativo

**Solução**:
1. Verifique a URL do webhook
2. Confirme se o webhook está ativo
3. Teste a conectividade
4. Verifique os logs do N8N

#### ❌ Dados não sincronizando

**Causa**: Formato de dados incorreto

**Solução**:
1. Verifique o formato JSON
2. Confirme os tipos de dados
3. Valide as datas (ISO format)
4. Teste com dados simples primeiro

### Logs e Debugging

#### Alidash Logs
```bash
# Verificar logs do servidor
tail -f logs/alidash.log

# Logs específicos de N8N
grep "N8N" logs/alidash.log
```

#### N8N Logs
```bash
# Logs do N8N
docker logs n8n

# Logs em tempo real
docker logs -f n8n
```

### Teste de Conectividade

```bash
# Testar API do Alidash
curl -H "x-api-key: SUA_API_KEY" \
     "https://seu-alidash.com/api/n8n/products?limit=1"

# Testar webhook
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"test": true}' \
     "https://seu-n8n.com/webhook/test"
```

## 📚 Recursos Adicionais

### Documentação

- [Documentação N8N](https://docs.n8n.io/)
- [API Reference Alidash](./api-reference.md)
- [Exemplos de Workflows](./docs/n8n-workflow-examples.json)

### Comunidade

- [Discord N8N](https://discord.gg/n8n)
- [GitHub Issues](https://github.com/n8n-io/n8n/issues)
- [Fórum Alidash](https://forum.alidash.com)

### Suporte

- **Email**: suporte@alidash.com
- **Telegram**: @AlidashSupport
- **Documentação**: https://docs.alidash.com

---

## 🚀 Próximos Passos

1. **Configure** sua primeira API Key
2. **Importe** um workflow de exemplo
3. **Teste** a integração com dados reais
4. **Customize** os workflows para suas necessidades
5. **Monitore** os logs e performance
6. **Expanda** com novos casos de uso

**Happy Automating! 🎉**