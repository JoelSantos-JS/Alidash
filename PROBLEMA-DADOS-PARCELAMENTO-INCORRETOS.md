# 🚨 Problema: Dados de Parcelamento Incorretos no Banco

## 🔍 **Problema Identificado**

**Evidência**: Transação com descrição "Parcelei uma compra de 600 reais em 12x" está sendo carregada com:
- **`isInstallment: false`** ❌ (deveria ser `true`)
- **`installmentInfo: null`** ❌ (deveria ter dados de parcelamento)

## 📊 **Análise dos Dados**

### **✅ Tabela do Banco (Supabase):**
- **`is_installment`: `bool`** ✅ Campo existe
- **`installment_info`: `jsonb`** ✅ Campo existe

### **❌ Dados do Navegador:**
- **`description: "Parcelei uma compra de 600 reais em 12x"`** ✅ Descrição correta
- **`installmentInfo: null`** ❌ **PROBLEMA!**
- **`isInstallment: false`** ❌ **PROBLEMA!**

## 🚨 **Causas Possíveis**

### **1. Transação Antiga**
- A transação foi criada **antes** dos campos de parcelamento serem implementados
- Os campos `is_installment` e `installment_info` não foram preenchidos

### **2. Erro na Criação**
- Houve um erro ao salvar os dados de parcelamento
- A transação foi salva sem os campos corretos

### **3. Dados Corrompidos**
- Os dados foram modificados incorretamente
- Campos foram resetados para valores padrão

## 🔧 **Soluções Implementadas**

### **1. Logs Detalhados na API**
```typescript
// Log detalhado dos dados brutos do Supabase
console.log('📊 API de Transações - Dados brutos do Supabase:');
transactions.forEach((transaction: any, index: number) => {
  console.log(`Transação ${index + 1}:`, {
    id: transaction.id,
    description: transaction.description,
    is_installment: transaction.is_installment,
    installment_info: transaction.installment_info,
    has_installment_fields: 'is_installment' in transaction && 'installment_info' in transaction
  });
});
```

### **2. Script SQL para Verificação**
```sql
-- Verificar transações com descrição que contém "parcel"
SELECT id, description, amount, is_installment, installment_info, created_at
FROM transactions 
WHERE description ILIKE '%parcel%' OR description ILIKE '%12x%'
ORDER BY created_at DESC;
```

## 🎯 **Como Resolver**

### **Passo 1: Verificar Dados no Supabase**
Execute no **Supabase SQL Editor**:
```sql
-- Verificar a transação específica
SELECT id, description, amount, is_installment, installment_info, created_at
FROM transactions 
WHERE description ILIKE '%600 reais em 12x%'
ORDER BY created_at DESC;
```

### **Passo 2: Verificar Logs da API**
1. Abra a página de transações
2. Abra DevTools (F12) → Console
3. Recarregue a página
4. Procure por logs:
   ```
   📊 API de Transações - Dados brutos do Supabase:
   Transação 1: { is_installment: false, installment_info: null }
   ```

### **Passo 3: Corrigir Dados (Se Necessário)**
Se os dados no Supabase estiverem incorretos, execute:
```sql
-- Atualizar transação específica
UPDATE transactions 
SET 
  is_installment = true,
  installment_info = '{"totalAmount":600,"totalInstallments":12,"currentInstallment":1,"installmentAmount":50,"remainingAmount":600}'
WHERE description ILIKE '%600 reais em 12x%';
```

## 📋 **Resultados Esperados**

### **Se os dados estiverem corretos no banco:**
```
📊 API de Transações - Dados brutos do Supabase:
Transação 1: { is_installment: true, installment_info: {...} }
```

### **Se os dados estiverem incorretos no banco:**
```
📊 API de Transações - Dados brutos do Supabase:
Transação 1: { is_installment: false, installment_info: null }
```

## 🎉 **Próximos Passos**

1. **Execute o script SQL** para verificar os dados no Supabase
2. **Verifique os logs** da API no console do navegador
3. **Corrija os dados** se necessário
4. **Teste novamente** se as transações parceladas aparecem na aba correta

## ⚠️ **Importante**

- **Dados antigos**: Transações criadas antes da implementação dos campos de parcelamento precisam ser atualizadas
- **Novas transações**: Devem ser criadas com os campos corretos
- **Verificação**: Sempre verificar se `is_installment` e `installment_info` estão corretos 