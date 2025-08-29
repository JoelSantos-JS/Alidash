# 🚨 Problema: Formato Incorreto do installmentInfo

## 🔍 **Problema Identificado**

Olhando a imagem do Supabase, vejo que:

1. **✅ Campos existem**: `is_installment` (bool) e `installment_info` (jsonb)
2. **✅ Dados estão sendo salvos**: `is_installment: TRUE` e `installment_info` tem conteúdo
3. **❌ FORMATO INCORRETO**: O `installment_info` está sendo salvo com formato diferente do esperado

## 📊 **Comparação dos Formatos**

### **❌ Formato atual (incorreto) - Visto no Supabase:**
```json
{"nextDueDate":"2025-09-28T..."}
```

### **✅ Formato esperado (correto) - Definido no código:**
```json
{
  "totalAmount": 600,
  "totalInstallments": 12,
  "currentInstallment": 1,
  "installmentAmount": 50,
  "remainingAmount": 600
}
```

## 🔍 **Onde o Problema Pode Estar**

### **1. Formulário de Transação** (`src/components/transaction/transaction-form.tsx`)
```typescript
// ✅ CORRETO - Usando calculateInstallmentInfo
const installmentInfo = calculateInstallmentInfo(
  data.amount,
  data.totalInstallments,
  data.currentInstallment || 1
);
```

### **2. Função calculateInstallmentInfo** (`src/lib/utils.ts`)
```typescript
// ✅ CORRETO - Retorna o formato esperado
export function calculateInstallmentInfo(
  totalAmount: number,
  totalInstallments: number,
  currentInstallment: number = 1
) {
  return {
    totalAmount,
    totalInstallments,
    currentInstallment,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
  };
}
```

### **3. Salvamento no Supabase** (`src/lib/supabase-service.ts`)
```typescript
// ✅ CORRETO - Converte para JSON
installment_info: transactionData.installmentInfo ? JSON.stringify(transactionData.installmentInfo) : null
```

## 🚨 **Possíveis Causas**

### **Cenário 1: Código não atualizado**
- O código pode não estar usando a versão mais recente
- Pode haver cache ou build antigo

### **Cenário 2: Outro código modificando**
- Pode haver outro lugar no código que está modificando o `installmentInfo`
- Pode haver um trigger ou função no Supabase modificando os dados

### **Cenário 3: Dados antigos**
- Os dados no Supabase podem ser de uma versão anterior do código
- Pode haver transações antigas com formato incorreto

## 🔧 **Soluções Implementadas**

### **1. Logs Detalhados Adicionados**
- **Formulário**: Logs para verificar o `installmentInfo` criado
- **API**: Logs para verificar dados recebidos e salvos
- **Supabase Service**: Logs para verificar conversão e salvamento

### **2. Verificação de Dados**
- Script para verificar campos no Supabase
- Logs para verificar conversão de dados

## 🎯 **Como Resolver**

### **Passo 1: Verificar logs no console**
1. Abra a página de transações
2. Abra DevTools (F12) → Console
3. Crie uma nova transação parcelada
4. Verifique os logs:
   ```
   📝 createTransaction - Dados recebidos: { installmentInfo: {...} }
   📝 createTransaction - Dados para inserção: { installment_info: "..." }
   ✅ createTransaction - Transação criada: { installment_info: "..." }
   ```

### **Passo 2: Verificar formato correto**
Os logs devem mostrar:
```json
{
  "totalAmount": 600,
  "totalInstallments": 12,
  "currentInstallment": 1,
  "installmentAmount": 50,
  "remainingAmount": 600
}
```

### **Passo 3: Se o formato estiver incorreto**
1. Verificar se há outro código modificando o `installmentInfo`
2. Verificar se há triggers no Supabase
3. Verificar se há cache ou build antigo

### **Passo 4: Limpar dados antigos**
Se necessário, limpar transações antigas com formato incorreto:
```sql
-- Verificar transações com formato incorreto
SELECT id, description, installment_info 
FROM transactions 
WHERE is_installment = true 
AND installment_info NOT LIKE '%totalAmount%';

-- Deletar transações antigas (se necessário)
DELETE FROM transactions 
WHERE is_installment = true 
AND installment_info NOT LIKE '%totalAmount%';
```

## 📋 **Checklist de Verificação**

- [ ] Logs mostram formato correto no formulário
- [ ] Logs mostram formato correto na API
- [ ] Logs mostram formato correto no Supabase
- [ ] Dados salvos no Supabase têm formato correto
- [ ] Conversão de dados funciona corretamente
- [ ] Transações parceladas aparecem na aba correta

## ⚠️ **Importante**

- **Formato correto**: Deve ter `totalAmount`, `totalInstallments`, `currentInstallment`, `installmentAmount`, `remainingAmount`
- **Formato incorreto**: Tem apenas `nextDueDate` ou outros campos
- **Verificação**: Sempre verificar os logs para identificar onde o formato está sendo modificado 