# 🔧 Como Corrigir o Erro "Acesso Bloqueado" do Google OAuth

## 🚨 Problema Identificado

Você está vendo este erro porque o Google Cloud Console não está configurado para aceitar requisições da porta **3001**, mas suas credenciais OAuth estão configuradas apenas para a porta **3000**.

**Erro atual:**
```
Acesso bloqueado: o app VoxCash não concluiu o processo de verificação do Google
Erro 403: access_denied
```

## ✅ Solução Rápida

### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google (joeltere9@gmail.com)
3. Selecione o projeto "aliinsights" (ou o projeto onde configurou o OAuth)

### Passo 2: Ir para Credenciais OAuth

1. No menu lateral, clique em **"APIs & Services"**
2. Clique em **"Credentials"**
3. Procure por **"OAuth 2.0 Client IDs"**
4. Clique no nome do seu client (provavelmente "Alidash Web Client" ou similar)

### Passo 3: Adicionar as Novas URLs

Na seção **"Authorized JavaScript origins"**, adicione:
```
http://localhost:3001
```

Na seção **"Authorized redirect URIs"**, adicione:
```
http://localhost:3001/agenda
http://localhost:3001/api/calendar/callback
```

### Passo 4: Salvar e Testar

1. Clique em **"Save"** (Salvar)
2. Aguarde alguns minutos para as mudanças se propagarem
3. Acesse: http://localhost:3001
4. Tente fazer login novamente

## 🔍 Verificação das Configurações

Suas configurações atuais estão corretas:

✅ **Client ID:** `48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com`
✅ **Redirect URI:** `http://localhost:3001/agenda`
✅ **App URL:** `http://localhost:3001`

## 📋 URLs que devem estar no Google Cloud Console

**JavaScript Origins:**
- `http://localhost:3000` (manter para compatibilidade)
- `http://localhost:3001` (adicionar esta)

**Redirect URIs:**
- `http://localhost:3000/agenda` (manter)
- `http://localhost:3000/api/calendar/callback` (manter)
- `http://localhost:3001/agenda` (adicionar esta)
- `http://localhost:3001/api/calendar/callback` (adicionar esta)

## 🚀 Após Configurar

1. O erro "Acesso bloqueado" deve desaparecer
2. Você conseguirá fazer login normalmente
3. A integração com Google Calendar funcionará

## 🆘 Se Ainda Não Funcionar

1. Aguarde 5-10 minutos após salvar no Google Cloud Console
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Tente em uma aba anônima/privada
4. Verifique se não há typos nas URLs configuradas

## 📞 Suporte

Se precisar de ajuda adicional, me informe e posso ajudar com configurações mais avançadas ou troubleshooting específico.