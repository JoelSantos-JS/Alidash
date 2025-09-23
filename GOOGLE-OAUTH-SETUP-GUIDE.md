# Guia de Configuração do Google OAuth para Calendário

## Problema Identificado

O erro `invalid_client` que você está vendo indica que o `GOOGLE_CLIENT_ID` no arquivo `.env.local` está usando um valor placeholder em vez de credenciais reais do Google Cloud Console.

**Erro atual:**
```
https://accounts.google.com/signin/oauth/error?authError=Cg5pbnZhbGlkX2NsaWVudBIfVGhlIE9BdXRoIGNsaWVudCB3YXMgbm90IGZvdW5kLiCRAw%3D%3D&client_id=1088754433421-aqhqhqhqhqhqhqhqhqhqhqhqhqhqhqhq.apps.googleusercontent.com
```

## Solução: Configurar Google Cloud Console

### Passo 1: Acessar o Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Crie um novo projeto ou selecione um existente

### Passo 2: Habilitar a API do Google Calendar

1. No menu lateral, vá para **APIs & Services** > **Library**
2. Procure por "Google Calendar API"
3. Clique em **Enable** para habilitar a API

### Passo 3: Configurar a Tela de Consentimento OAuth

1. Vá para **APIs & Services** > **OAuth consent screen**
2. Selecione **External** como tipo de usuário
3. Clique em **Create**
4. Preencha as informações obrigatórias:
   - **App name**: Nome da sua aplicação (ex: "Alidash Calendar")
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
5. Clique em **Save and Continue**
6. Na seção **Scopes**, adicione os seguintes escopos:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Continue clicando **Save and Continue** até finalizar

### Passo 4: Criar Credenciais OAuth 2.0

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Selecione **Web application** como tipo de aplicação
4. Configure:
   - **Name**: "Alidash Web Client" (ou nome de sua escolha)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `https://seu-dominio.com` (se tiver em produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/agenda`
     - `http://localhost:3000/api/calendar/callback`
5. Clique em **Create**

### Passo 5: Copiar as Credenciais

Após criar, você receberá:
- **Client ID**: algo como `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: algo como `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx`

⚠️ **IMPORTANTE**: Copie e guarde essas credenciais em local seguro!

### Passo 6: Atualizar o arquivo .env.local

Substitua as credenciais placeholder no arquivo `.env.local`:

```env
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=SEU_CLIENT_ID_REAL_AQUI
GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET_REAL_AQUI
GOOGLE_REDIRECT_URI=http://localhost:3000/agenda
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Passo 7: Reiniciar o Servidor

Após atualizar as credenciais:
1. Pare o servidor de desenvolvimento (Ctrl+C)
2. Reinicie com `npm run dev`
3. Teste a conexão com Google Calendar

## Verificação

Para verificar se está funcionando:
1. Acesse `http://localhost:3000/agenda`
2. Clique em "Connect Google Calendar"
3. Você deve ser redirecionado para a tela de autorização do Google
4. Após autorizar, deve retornar para sua aplicação

## Troubleshooting

### Erro "redirect_uri_mismatch"
- Verifique se as URIs de redirecionamento no Google Cloud Console estão corretas
- Certifique-se de que `GOOGLE_REDIRECT_URI` no `.env.local` corresponde a uma URI autorizada

### Erro "access_denied"
- Verifique se os escopos estão configurados corretamente na tela de consentimento
- Certifique-se de que a API do Google Calendar está habilitada

### Erro "invalid_scope"
- Verifique se os escopos no código correspondem aos configurados no Google Cloud Console

## Segurança

- **NUNCA** commite credenciais reais no Git
- Use `.env.local` para desenvolvimento
- Para produção, use variáveis de ambiente seguras
- Considere usar Google Cloud Secret Manager para produção

## Próximos Passos

Após configurar corretamente:
1. Teste a integração básica
2. Implemente sincronização bidirecional
3. Configure webhooks para atualizações em tempo real
4. Adicione tratamento de erros robusto