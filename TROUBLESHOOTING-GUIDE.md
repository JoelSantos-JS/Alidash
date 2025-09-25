# 🔧 Guia de Troubleshooting - Alidash

Este guia ajuda a identificar e resolver problemas comuns que podem ocorrer durante o desenvolvimento e deploy da aplicação.

## 📋 Índice

1. [Problemas de Build e Deploy](#problemas-de-build-e-deploy)
2. [Erros de Chunks e Recursos](#erros-de-chunks-e-recursos)
3. [Problemas de Autenticação OAuth](#problemas-de-autenticação-oauth)
4. [Problemas de Cache](#problemas-de-cache)
5. [Verificação Pré-Deploy](#verificação-pré-deploy)
6. [Problemas de Banco de Dados](#problemas-de-banco-de-dados)

---

## 🚀 Problemas de Build e Deploy

### ❌ Erro: "ChunkLoadError: Loading chunk failed"

**Sintomas:**
```
ChunkLoadError: Loading chunk 2798 failed.
ChunkLoadError: Loading chunk app/page failed.
```

**Causas:**
- Build incompleto ou corrompido
- Cache desatualizado
- Problemas de rede durante o carregamento

**Soluções:**

1. **Limpar cache e rebuild:**
```bash
npm run build:clean
```

2. **Verificar build antes do deploy:**
```bash
npm run deploy:check
```

3. **Forçar limpeza completa:**
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### ❌ Erro: "ERR_ABORTED 404 (Not Found)" para recursos estáticos

**Sintomas:**
```
GET /_next/static/css/eeb41c51f4d8e01.css net::ERR_ABORTED 404
GET /_next/static/chunks/2798-1f2de67c21dc4b.js net::ERR_ABORTED 404
```

**Causas:**
- Arquivos não foram gerados durante o build
- Problemas na configuração do Vercel
- Build ID inconsistente

**Soluções:**

1. **Verificar se o build foi bem-sucedido:**
```bash
npm run build
ls -la .next/static/
```

2. **Verificar configuração do Next.js:**
   - Confirme que `next.config.ts` está correto
   - Verifique se não há erros de TypeScript/ESLint bloqueando o build

3. **Redeployar no Vercel:**
   - Vá ao dashboard do Vercel
   - Force um novo deploy
   - Verifique os logs de build

---

## 🔐 Problemas de Autenticação OAuth

### ❌ Erro: "The current domain is not authorized for OAuth operations"

**Sintomas:**
```
The current domain is not authorized for OAauth operations. 
This will prevent signInWithPopup, signInWithRedirect...
```

**Causas:**
- Domínio não configurado no Firebase Console
- Configuração incorreta das variáveis de ambiente

**Soluções:**

1. **Configurar domínios autorizados no Firebase:**
   - Acesse [Firebase Console](https://console.firebase.google.com)
   - Vá em Authentication > Settings > Authorized domains
   - Adicione seu domínio de produção (ex: `alidash.vercel.app`)

2. **Verificar variáveis de ambiente:**
```bash
npm run pre-deploy
```

3. **Configurar OAuth no Google Cloud Console:**
   - Acesse [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services > Credentials
   - Edite seu OAuth 2.0 Client ID
   - Adicione URIs de redirecionamento autorizadas

---

## 💾 Problemas de Cache

### ❌ Navegador carregando versões antigas

**Sintomas:**
- Mudanças não aparecem após deploy
- Erros 404 para recursos que deveriam existir
- Comportamento inconsistente

**Soluções:**

1. **Forçar atualização no navegador:**
   - `Ctrl + F5` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)

2. **Limpar cache do navegador:**
   - Abra DevTools (F12)
   - Clique com botão direito no botão de refresh
   - Selecione "Empty Cache and Hard Reload"

3. **Verificar headers de cache:**
   - Nossa configuração no `next.config.ts` já otimiza o cache
   - Arquivos estáticos têm cache de 1 ano
   - Build ID único previne problemas de cache

---

## ✅ Verificação Pré-Deploy

### Script de Verificação Automática

Execute antes de cada deploy:

```bash
npm run deploy:check
```

Este script verifica:
- ✅ Variáveis de ambiente configuradas
- ✅ Build executado com sucesso
- ✅ Dependências atualizadas
- ✅ Configuração do Firebase
- ✅ Tamanho do bundle
- ✅ Configuração do Vercel

### Checklist Manual

Antes de fazer deploy, verifique:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Build local executa sem erros
- [ ] Testes passam (se houver)
- [ ] Não há console.log desnecessários
- [ ] Domínios OAuth estão configurados
- [ ] Banco de dados está acessível

---

## 🗄️ Problemas de Banco de Dados

### ❌ Erro: "Foreign key constraint violation"

**Sintomas:**
```
23503: insert or update on table "personal_salary_settings" 
violates foreign key constraint
```

**Soluções:**

1. **Verificar se o usuário existe:**
```sql
SELECT id, firebase_uid FROM users WHERE firebase_uid = 'SEU_FIREBASE_UID';
```

2. **Corrigir constraints de chave estrangeira:**
   - Verifique se as tabelas referenciam `users(id)` e não `auth.users(id)`
   - Execute migrations necessárias no Supabase Dashboard

### ❌ Erro: "RLS policy violation"

**Sintomas:**
- Dados não carregam
- Erro 403 em operações de banco

**Soluções:**

1. **Verificar políticas RLS:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'NOME_DA_TABELA';
```

2. **Verificar se o usuário está autenticado:**
   - Confirme que o token JWT está sendo enviado
   - Verifique se o usuário existe na tabela `users`

---

## 🚨 Problemas Críticos

### Se nada funcionar:

1. **Rollback para versão anterior:**
   - No Vercel, vá em Deployments
   - Clique em "Promote to Production" na versão anterior

2. **Deploy de emergência:**
```bash
# Limpar tudo
rm -rf .next node_modules
npm install
npm run build

# Verificar se está tudo OK
npm run deploy:check

# Deploy manual se necessário
vercel --prod
```

3. **Verificar status dos serviços:**
   - [Vercel Status](https://www.vercel-status.com/)
   - [Firebase Status](https://status.firebase.google.com/)
   - [Supabase Status](https://status.supabase.com/)

---

## 📞 Contato e Suporte

Se os problemas persistirem:

1. **Logs detalhados:**
   - Capture screenshots dos erros
   - Copie logs completos do console
   - Anote passos para reproduzir

2. **Informações do ambiente:**
   - Versão do Node.js: `node --version`
   - Versão do npm: `npm --version`
   - Sistema operacional
   - Navegador e versão

3. **Verificação rápida:**
```bash
npm run deploy:check
```

---

## 🔄 Atualizações

Este guia é atualizado conforme novos problemas são identificados e resolvidos.

**Última atualização:** Janeiro 2025

**Versão:** 1.0.0