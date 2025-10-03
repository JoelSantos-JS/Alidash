# 🚨 CORREÇÃO: Erro de Verificação Google OAuth

## ❌ **PROBLEMA ATUAL:**
```
Acesso bloqueado: o app VoxCash não concluiu o processo de verificação do Google
Erro 403: access_denied
```

## 🎯 **CAUSA:**
Seu app está em **modo de teste** no Google Cloud Console e seu email `joeltere8@gmail.com` não está na lista de usuários de teste.

## ✅ **SOLUÇÕES (ESCOLHA UMA):**

### 🚀 **OPÇÃO 1: ADICIONAR SEU EMAIL COMO USUÁRIO DE TESTE (RÁPIDO)**

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto **VoxCash**
3. Vá em **APIs e serviços** → **Tela de consentimento OAuth**
4. Na seção **"Usuários de teste"**, clique em **"+ ADICIONAR USUÁRIOS"**
5. Adicione seu email: `joeltere8@gmail.com`
6. Clique em **"SALVAR"**

### 🏭 **OPÇÃO 2: PUBLICAR O APP (RECOMENDADO PARA PRODUÇÃO)**

1. Acesse: [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto **VoxCash**
3. Vá em **APIs e serviços** → **Tela de consentimento OAuth**
4. Clique em **"PUBLICAR APP"**
5. Confirme a publicação

⚠️ **NOTA:** Para publicar, você precisa:
- Política de privacidade
- Termos de serviço
- Domínio verificado (opcional para localhost)

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS:**

### **Tela de Consentimento OAuth:**
- **Nome do aplicativo:** VoxCash
- **Email de suporte:** joeltere8@gmail.com
- **Domínios autorizados:** localhost (para desenvolvimento)
- **Escopos:** 
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

### **Credenciais OAuth 2.0:**
- **Client ID:** `48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com`
- **Origens JavaScript autorizadas:**
  - `http://localhost:3001`
- **URIs de redirecionamento autorizados:**
  - `http://localhost:3001/agenda`
  - `http://localhost:3001/api/calendar/callback`

## 🧪 **TESTE APÓS CORREÇÃO:**

1. **Inicie o servidor:**
   ```bash
   npm run dev -- -p 3001
   ```

2. **Acesse:** http://localhost:3001/agenda

3. **Clique em "Conectar Google Calendar"**

4. **Resultado esperado:** Tela de autorização do Google sem erro 403

## 📋 **CHECKLIST DE VERIFICAÇÃO:**

- [ ] App configurado como "Em teste" ou "Em produção"
- [ ] Email `joeltere8@gmail.com` na lista de usuários de teste
- [ ] Escopos do Calendar API configurados
- [ ] URLs de redirecionamento corretas para porta 3001
- [ ] Servidor rodando na porta 3001

## 🆘 **SE AINDA DER ERRO:**

1. **Aguarde 5-10 minutos** (propagação das configurações)
2. **Limpe o cache do navegador**
3. **Teste em aba anônima**
4. **Verifique se o projeto está selecionado corretamente**

---
**✅ SOLUÇÃO MAIS RÁPIDA:** Adicionar seu email como usuário de teste (Opção 1)