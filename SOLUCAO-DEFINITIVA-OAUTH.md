# 🎯 Solução Definitiva - Erro OAuth Google Calendar

## 🔍 **PROBLEMA IDENTIFICADO**

O teste revelou que **o servidor não está rodando na porta 3001**, mesmo que as configurações estejam corretas. Isso explica por que o erro persiste.

## ✅ **SOLUÇÕES DISPONÍVEIS**

### 🚀 **OPÇÃO 1: Iniciar servidor na porta 3001 (RECOMENDADO)**

```bash
# Parar o servidor atual (se estiver rodando)
Ctrl + C

# Iniciar na porta 3001
npm run dev -- -p 3001
```

**OU** configure o Next.js para usar porta 3001 por padrão:

1. Edite o `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

2. Reinicie o servidor:
```bash
npm run dev
```

### 🔄 **OPÇÃO 2: Alterar configuração para porta 3000**

Se preferir usar a porta 3000 (padrão do Next.js):

1. **Edite o `.env.local`**:
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/agenda
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **No Google Cloud Console**, certifique-se que estas URLs estão configuradas:
   - `http://localhost:3000/agenda`
   - `http://localhost:3000/api/calendar/callback`

3. **Inicie o servidor**:
```bash
npm run dev
```

## 🧪 **TESTE MANUAL PARA VERIFICAR**

Independente da opção escolhida, teste esta URL no navegador:

**Para porta 3001:**
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fagenda&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&access_type=offline&prompt=consent&state=test_manual
```

**Para porta 3000:**
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fagenda&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events&access_type=offline&prompt=consent&state=test_manual
```

## ✅ **RESULTADO ESPERADO**

Se a URL manual funcionar:
- ✅ Redirecionamento para tela de autorização do Google
- ✅ Após autorizar, retorna para sua aplicação
- ✅ Não mostra erro de "Acesso bloqueado"

## 🔧 **VERIFICAÇÃO FINAL**

Após escolher uma opção e configurar:

1. **Verifique se o servidor está rodando**:
```bash
# Para porta 3001
curl http://localhost:3001/api/calendar/auth?user_id=test

# Para porta 3000  
curl http://localhost:3000/api/calendar/auth?user_id=test
```

2. **Teste a aplicação**:
   - Acesse a página da agenda
   - Clique em "Conectar Google Calendar"
   - Deve funcionar sem erros

## 🚨 **CONFIGURAÇÕES GOOGLE CLOUD CONSOLE**

**Para porta 3001:**
- ✅ `http://localhost:3001` (JavaScript origins)
- ✅ `http://localhost:3001/agenda` (Redirect URIs)
- ✅ `http://localhost:3001/api/calendar/callback` (Redirect URIs)

**Para porta 3000:**
- ✅ `http://localhost:3000` (JavaScript origins)  
- ✅ `http://localhost:3000/agenda` (Redirect URIs)
- ✅ `http://localhost:3000/api/calendar/callback` (Redirect URIs)

## 💡 **DICA IMPORTANTE**

A **OPÇÃO 1** (porta 3001) é recomendada porque:
- Suas configurações atuais já estão corretas
- Não precisa alterar o Google Cloud Console
- Apenas precisa iniciar o servidor na porta correta

## 📞 **SE AINDA NÃO FUNCIONAR**

1. Aguarde 5-10 minutos após qualquer alteração
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Teste em aba anônima
4. Verifique se não há firewall bloqueando a porta

---
**Status**: 🎯 Solução identificada - Problema de porta do servidor
**Prioridade**: 🔴 Alta - Implementar uma das opções acima