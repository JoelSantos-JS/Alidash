# 🔧 Correção do Erro na API de Transações

## 🚨 Problema Identificado

Erro na API `/api/transactions/get` retornando "Erro interno do servidor" sem detalhes específicos.

## ✅ Melhorias Implementadas

### 1. **Melhor Tratamento de Erro na API** (`src/app/api/transactions/get/route.ts`)

**Antes**:
```typescript
} catch (error) {
  console.error('❌ Erro inesperado:', error);
  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}
```

**Depois**:
```typescript
} catch (error) {
  console.error('❌ Erro detalhado na API de transações:', {
    message: error instanceof Error ? error.message : 'Erro desconhecido',
    stack: error instanceof Error ? error.stack : undefined,
    error: error,
    timestamp: new Date().toISOString()
  });
  
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  
  return NextResponse.json(
    { 
      error: 'Erro interno do servidor',
      details: errorMessage,
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}
```

### 2. **Validação de Usuário** (`src/app/api/transactions/get/route.ts`)

**Adicionado**: Verificação se o usuário existe antes de buscar transações
```typescript
// Verificar se o usuário existe primeiro
try {
  const user = await supabaseAdminService.getUserById(userId);
  console.log('✅ Usuário encontrado:', user.id);
} catch (userError) {
  console.error('❌ Usuário não encontrado:', userError);
  return NextResponse.json(
    { error: 'Usuário não encontrado' },
    { status: 404 }
  );
}
```

### 3. **Conversão Robusta de Transações** (`src/lib/supabase-service.ts`)

**Melhorado**: Tratamento seguro dos campos de parcelamento
```typescript
private convertTransactionFromSupabase(data: any): Transaction {
  // Tratar campos de parcelamento com segurança
  let installmentInfo = undefined;
  if (data.installment_info) {
    try {
      installmentInfo = JSON.parse(data.installment_info);
    } catch (error) {
      console.warn('⚠️ Erro ao fazer parse do installment_info:', error);
      installmentInfo = undefined;
    }
  }

  return {
    // ... outros campos
    amount: parseFloat(data.amount) || 0,
    tags: data.tags || [],
    isInstallment: Boolean(data.is_installment),
    installmentInfo
  }
}
```

### 4. **Logs Detalhados** (`src/app/api/transactions/get/route.ts`)

**Adicionado**: Logs mais detalhados para debug
```typescript
console.log('🔍 Iniciando busca de transações:', {
  userId,
  type,
  category,
  startDate,
  endDate,
  url: request.url
});

console.log('✅ Transações encontradas:', {
  count: transactions?.length || 0,
  transactions: transactions?.slice(0, 3) // Log das primeiras 3 transações
});
```

### 5. **Melhor Tratamento de Erro no Frontend** (`src/app/transacoes/page.tsx`)

**Melhorado**: Logs mais detalhados sobre erros da API
```typescript
} else {
  const errorText = await transactionsResponse.text();
  console.error('❌ Erro ao buscar transações:', {
    status: transactionsResponse.status,
    statusText: transactionsResponse.statusText,
    error: errorText
  });
  
  // Tentar fazer parse do erro para mostrar detalhes
  try {
    const errorJson = JSON.parse(errorText);
    console.error('❌ Detalhes do erro:', errorJson);
  } catch (parseError) {
    console.error('❌ Erro não é JSON válido:', errorText);
  }
}
```

### 6. **Script de Teste** (`test-transactions-api.js`)

**Criado**: Script para testar a API independentemente
```javascript
// Testa diferentes cenários:
// 1. Endpoint básico
// 2. User ID inválido
// 3. User ID válido
```

## 🔍 Possíveis Causas do Erro

### 1. **Campos de Parcelamento Não Existem**
- A tabela `transactions` pode não ter os campos `is_installment` e `installment_info`
- **Solução**: Executar `add-installment-fields.sql`

### 2. **Configuração do Supabase**
- Variáveis de ambiente podem estar incorretas
- **Verificar**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 3. **Usuário Não Existe**
- O user_id pode não existir no Supabase
- **Verificar**: Se o usuário foi sincronizado corretamente

### 4. **Permissões RLS**
- Row Level Security pode estar bloqueando acesso
- **Verificar**: Políticas de segurança na tabela `transactions`

## 📋 Como Debugar

### 1. **Verificar Logs do Servidor**
```bash
# No terminal onde o Next.js está rodando
# Procurar por logs como:
🔍 Iniciando busca de transações: { userId: "...", ... }
❌ Erro detalhado na API de transações: { message: "...", ... }
```

### 2. **Testar API Diretamente**
```bash
# Usar o script de teste
node test-transactions-api.js <user_id>

# Ou usar curl
curl "http://localhost:3000/api/transactions/get?user_id=<user_id>"
```

### 3. **Verificar Console do Navegador**
- Abrir DevTools (F12)
- Ir para aba Console
- Recarregar a página de transações
- Procurar por logs de erro

### 4. **Verificar Supabase Dashboard**
- Acessar Supabase Dashboard
- Verificar se a tabela `transactions` existe
- Verificar se os campos de parcelamento existem
- Verificar se há dados na tabela

## 🚀 Próximos Passos

1. **Executar o script de teste** para identificar o problema específico
2. **Verificar logs detalhados** no console do servidor
3. **Executar `add-installment-fields.sql`** se necessário
4. **Verificar configuração do Supabase** no `.env.local`
5. **Testar com usuário válido** no Supabase

## 📝 Logs Esperados Após Correção

```
🔍 Iniciando busca de transações: { userId: "abc123", ... }
✅ Usuário encontrado: abc123
🔍 Buscando transações no Supabase para usuário: abc123
✅ Transações encontradas: { count: 5, transactions: [...] }
```

## ⚠️ Importante

- **Backup**: Sempre faça backup antes de alterar a estrutura do banco
- **Teste**: Teste em ambiente de desenvolvimento primeiro
- **Logs**: Monitore os logs para identificar problemas futuros
- **Documentação**: Mantenha documentação atualizada das mudanças 