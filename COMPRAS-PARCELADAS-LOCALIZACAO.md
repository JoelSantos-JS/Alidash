# 📍 Localização das Compras Parceladas

## 🔍 Onde as Compras Parceladas Estão Sendo Salvas

### **Problema Identificado**
As compras parceladas estão sendo salvas no **Supabase**, mas a tabela `transactions` não possui os campos necessários para armazenar as informações de parcelamento.

### **Fluxo Atual de Salvamento**

#### 1. **Formulário de Transação** (`src/components/transaction/transaction-form.tsx`)
```typescript
// Quando o usuário marca como parcelado
if (data.isInstallment && data.totalInstallments && data.totalInstallments > 1) {
  const installmentInfo = calculateInstallmentInfo(
    data.amount,
    data.totalInstallments,
    data.currentInstallment || 1
  );
  
  transaction = {
    ...transaction,
    isInstallment: true,
    installmentInfo,
    tags: [...(transaction.tags || []), 'parcelado', 'cartão-credito'],
  };
}
```

#### 2. **Página de Transações** (`src/app/transacoes/page.tsx`)
```typescript
// Salva no Supabase via API
const createResponse = await fetch('/api/transactions/create', {
  method: 'POST',
  body: JSON.stringify({
    user_id: supabaseUser.id,
    transaction: newTransaction // Inclui isInstallment e installmentInfo
  })
});
```

#### 3. **API Route** (`src/app/api/transactions/create/route.ts`)
```typescript
// Passa os dados para o serviço Supabase
const createdTransaction = await supabaseAdminService.createTransaction(user_id, {
  // ... outros campos
  isInstallment: transaction.isInstallment,
  installmentInfo: transaction.installmentInfo
});
```

#### 4. **Serviço Supabase** (`src/lib/supabase-service.ts`)
```typescript
// Tenta salvar no Supabase
const { data, error } = await this.client
  .from('transactions')
  .insert({
    // ... outros campos
    is_installment: transactionData.isInstallment || false,
    installment_info: transactionData.installmentInfo ? JSON.stringify(transactionData.installmentInfo) : null
  })
```

### **❌ Problema: Campos Não Existem na Tabela**

A tabela `transactions` no Supabase **não possui** os campos:
- `is_installment` (BOOLEAN)
- `installment_info` (JSONB)

### **✅ Solução: Adicionar Campos à Tabela**

Execute o script SQL para adicionar os campos necessários:

```sql
-- Adicionar campos para compras parceladas
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_info JSONB;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_is_installment ON transactions(is_installment);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_info ON transactions USING GIN(installment_info);
```

### **📊 Estrutura dos Dados de Parcelamento**

#### **Campo `is_installment`**
- **Tipo**: BOOLEAN
- **Padrão**: FALSE
- **Função**: Indica se a transação é uma compra parcelada

#### **Campo `installment_info` (JSONB)**
```json
{
  "totalAmount": 1200.00,        // Valor total da compra
  "totalInstallments": 12,       // Número total de parcelas
  "currentInstallment": 3,       // Parcela atual
  "installmentAmount": 100.00,   // Valor de cada parcela
  "remainingAmount": 900.00,     // Valor restante a pagar
  "nextDueDate": "2024-02-15T00:00:00Z" // Próxima data de vencimento
}
```

### **🔄 Conversão de Dados**

#### **Salvamento (TypeScript → Supabase)**
```typescript
// TypeScript
{
  isInstallment: true,
  installmentInfo: {
    totalAmount: 1200,
    totalInstallments: 12,
    currentInstallment: 3,
    // ...
  }
}

// Supabase
{
  is_installment: true,
  installment_info: '{"totalAmount":1200,"totalInstallments":12,"currentInstallment":3,...}'
}
```

#### **Carregamento (Supabase → TypeScript)**
```typescript
// Supabase
{
  is_installment: true,
  installment_info: '{"totalAmount":1200,"totalInstallments":12,"currentInstallment":3,...}'
}

// TypeScript
{
  isInstallment: true,
  installmentInfo: {
    totalAmount: 1200,
    totalInstallments: 12,
    currentInstallment: 3,
    // ...
  }
}
```

### **🚨 Status Atual**

- ✅ **Frontend**: Funcionando corretamente
- ✅ **API Routes**: Funcionando corretamente
- ✅ **Serviço Supabase**: Funcionando corretamente
- ❌ **Tabela Supabase**: Campos não existem

### **📋 Próximos Passos**

1. **Executar o script SQL** para adicionar os campos
2. **Testar criação** de compras parceladas
3. **Verificar carregamento** das transações parceladas
4. **Validar conversão** de dados

### **🔧 Como Executar o Script**

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o conteúdo do arquivo `add-installment-fields.sql`
4. Verifique se os campos foram adicionados

### **📝 Logs Esperados**

Após adicionar os campos, você deve ver:
```
💰 Criando transação no Supabase: { isInstallment: true, installmentInfo: {...} }
✅ Transação criada com sucesso: abc123
📊 Transações do Supabase: 25 (incluindo parceladas)
```

### **⚠️ Importante**

- **Backup**: Faça backup antes de alterar a estrutura da tabela
- **Teste**: Teste em ambiente de desenvolvimento primeiro
- **Migração**: Dados existentes não serão afetados
- **Compatibilidade**: Campos são opcionais, não quebram funcionalidade existente 