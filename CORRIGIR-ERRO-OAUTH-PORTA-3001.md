# 🚨 Correção Urgente - Erro OAuth Google Calendar (Porta 3001)

## 🔍 **Problema Identificado**

Você está recebendo este erro porque sua aplicação está rodando na porta **3001**, mas o Google Cloud Console está configurado apenas para a porta **3000**.

**Detalhes do erro:**
- **redirect_uri atual**: `http://localhost:3001/agenda`
- **client_id**: `48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com`
- **Configuração atual**: Apenas porta 3000 autorizada

## ✅ **Solução Imediata**

### **Passo 1: Acessar Google Cloud Console**
1. Acesse: https://console.cloud.google.com/
2. Vá para **APIs & Services** > **Credentials**
3. Encontre seu OAuth 2.0 Client ID: `48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com`
4. Clique no ícone de **editar** (lápis)

### **Passo 2: Adicionar URLs da Porta 3001**

**Authorized JavaScript origins:**
```
http://localhost:3000  (manter existente)
http://localhost:3001  (ADICIONAR ESTA)
```

**Authorized redirect URIs:**
```
http://localhost:3000/agenda                    (manter existente)
http://localhost:3000/api/calendar/callback     (manter existente)
http://localhost:3001/agenda                    (ADICIONAR ESTA)
http://localhost:3001/api/calendar/callback     (ADICIONAR ESTA)
```

### **Passo 3: Salvar e Aguardar**
1. Clique em **SAVE**
2. Aguarde 2-5 minutos para propagação
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

## 🧪 **Teste a Correção**

Após configurar, teste:
1. Acesse: `http://localhost:3001/agenda`
2. Clique em "Conectar Google Calendar"
3. Deve funcionar sem erro de "Acesso bloqueado"

## 🔧 **Configuração Atual Verificada**

Suas credenciais estão corretas:
- ✅ **Client ID**: `48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com`
- ✅ **Client Secret**: `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`
- ✅ **Redirect URI**: `http://localhost:3001/agenda`
- ✅ **App URL**: `http://localhost:3001`

## 🚨 **Se Ainda Não Funcionar**

1. **Aguarde mais tempo**: Pode levar até 10 minutos
2. **Teste em aba anônima**: Para evitar cache
3. **Verifique typos**: Certifique-se que não há erros de digitação
4. **Reinicie o servidor**: `npm run dev`

## 📞 **Suporte Adicional**

Se o problema persistir, verifique:
- Se a API do Google Calendar está habilitada
- Se o projeto no Google Cloud Console está ativo
- Se não há limites de quota atingidos

## 🎯 **Resultado Esperado**

Após a correção, você deve conseguir:
1. Conectar com Google Calendar sem erros
2. Sincronizar eventos bidirecionalmente
3. Receber notificações de eventos

---
**Status**: ⏳ Aguardando configuração no Google Cloud Console
**Prioridade**: 🔴 Alta - Bloqueia funcionalidade principal