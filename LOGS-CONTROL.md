# 🚫 Controle de Logs - Alidash

Este documento explica como controlar os logs da aplicação para evitar que apareçam em produção.

## 🎯 Problema Resolvido

Antes, a aplicação mostrava muitos logs no console, incluindo:
- 🔧 Configuração Supabase
- ✅ Clientes Supabase criados
- 🔄 Sincronizando usuário
- ✅ Usuário já existe no Supabase
- ⚠️ Erro ao buscar produtos do Firebase
- 🔄 Convertendo produto do Supabase
- ✅ X produtos encontrados

## 🛠️ Solução Implementada

### 1. **Sistema de Logs Condicional**
Todos os `console.log` agora só aparecem quando `NODE_ENV === 'development'`

### 2. **Logger Centralizado**
Criado em `src/lib/logger.ts` com métodos específicos:
- `logger.info()` - Logs informativos
- `logger.success()` - Logs de sucesso
- `logger.warn()` - Logs de aviso
- `logger.error()` - Logs de erro (sempre visíveis)
- `logger.debug()` - Logs de debug
- `logger.sync()` - Logs de sincronização
- `logger.convert()` - Logs de conversão
- `logger.config()` - Logs de configuração

### 3. **Script de Controle**
Script para alternar facilmente entre modos:
```bash
# Ver status atual
node scripts/toggle-logs.js

# Ativar logs (desenvolvimento)
node scripts/toggle-logs.js dev

# Ocultar logs (produção)
node scripts/toggle-logs.js prod
```

## 🔧 Como Usar

### **Modo Produção (Logs Ocultos)**
```bash
npm run dev    # Logs ocultos
npm run build  # Build para produção
npm run start  # Servidor de produção
```

### **Modo Desenvolvimento (Logs Visíveis)**
```bash
# Primeiro ativar modo dev
node scripts/toggle-logs.js dev

# Depois executar
npm run dev    # Logs visíveis
```

## 📁 Arquivos Modificados

### **Serviços**
- `src/lib/supabase-service.ts` - Logs de configuração e conversão
- `src/lib/dual-database-sync.ts` - Logs de sincronização dual

### **APIs**
- `src/app/api/auth/sync-user/route.ts` - Logs de sincronização de usuário

### **Hooks**
- `src/hooks/use-auth.tsx` - Logs de autenticação e backup

### **Componentes**
- `src/components/dashboard/transactions-section.tsx` - Logs de processamento
- `src/app/transacoes/page.tsx` - Logs de carregamento de dados
- `src/app/receitas/page.tsx` - Logs de carregamento de dados

## 🎨 Exemplos de Uso

### **Antes (Logs sempre visíveis)**
```typescript
console.log('🔧 Configuração Supabase:', config);
console.log('✅ Clientes Supabase criados com sucesso');
```

### **Depois (Logs condicionais)**
```typescript
// Opção 1: Verificação manual
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuração Supabase:', config);
}

// Opção 2: Usar logger centralizado
import { logger } from '@/lib/logger';
logger.config('Configuração Supabase', config);
logger.success('Clientes Supabase criados com sucesso');
```

## 🚀 Benefícios

1. **Produção Limpa**: Nenhum log aparece em produção
2. **Desenvolvimento Rico**: Logs detalhados durante desenvolvimento
3. **Fácil Controle**: Script simples para alternar modos
4. **Manutenível**: Sistema centralizado de logging
5. **Performance**: Logs não impactam performance em produção

## 🔍 Verificar Status

Para ver se os logs estão ativos ou não:

```bash
# Ver status atual
node scripts/toggle-logs.js

# Verificar variável de ambiente
echo $NODE_ENV
```

## ⚠️ Importante

- **Logs de erro** (`console.error`) sempre aparecem para facilitar debugging
- **Logs informativos** só aparecem em desenvolvimento
- **NODE_ENV** é definido automaticamente pelo Next.js
- **Scripts npm** são atualizados automaticamente pelo script de controle

## 🎯 Próximos Passos

1. **Migrar gradualmente** para o logger centralizado
2. **Adicionar níveis de log** (debug, info, warn, error)
3. **Implementar log em arquivo** para produção
4. **Adicionar métricas** de performance 