# Sincronização Dual de Produtos - Firebase + Supabase

Este documento explica como funciona a sincronização dual de produtos entre Firebase e Supabase, seguindo o mesmo padrão implementado para despesas, receitas e transações.

## 📋 Visão Geral

A sincronização dual permite que os produtos sejam gravados simultaneamente nos dois bancos de dados (Firebase e Supabase), garantindo redundância e confiabilidade dos dados.

## 🏗️ Arquitetura

### APIs Criadas

1. **GET** `/api/products/get?user_id={userId}` - Buscar produtos do usuário
2. **POST** `/api/products/create?user_id={userId}` - Criar novo produto
3. **PUT** `/api/products/update?user_id={userId}&product_id={productId}` - Atualizar produto
4. **DELETE** `/api/products/delete?user_id={userId}&product_id={productId}` - Deletar produto

### Serviço de Sincronização Dual

O `DualDatabaseSync` agora inclui métodos para produtos:

- `getProducts()` - Busca produtos (prioriza Supabase, fallback para Firebase)
- `createProduct(productData)` - Cria produto em ambos os bancos
- `updateProduct(productId, updates)` - Atualiza produto em ambos os bancos
- `deleteProduct(productId)` - Deleta produto de ambos os bancos

## 🔄 Como Funciona

### 1. Criação de Produtos

```typescript
const dualSync = new DualDatabaseSync(userId, DualSyncPresets.BEST_EFFORT);
const result = await dualSync.createProduct({
  name: 'Produto Teste',
  category: 'Eletrônicos',
  purchasePrice: 100,
  sellingPrice: 150,
  // ... outros campos
});

console.log(`Firebase: ${result.firebaseSuccess ? '✅' : '❌'}`);
console.log(`Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
```

### 2. Busca de Produtos

```typescript
const products = await dualSync.getProducts();
// Prioriza Supabase, com fallback para Firebase
```

### 3. Atualização de Produtos

```typescript
const result = await dualSync.updateProduct(productId, {
  sellingPrice: 200,
  status: 'selling'
});
```

### 4. Exclusão de Produtos

```typescript
const result = await dualSync.deleteProduct(productId);
```

## 🎯 Estratégias de Sincronização

### BEST_EFFORT (Padrão)
- Permite falha parcial
- Mantém dados onde conseguir gravar
- Não faz rollback em caso de falha

### FIREBASE_PRIORITY
- Prioriza Firebase
- Falha se Firebase falhar
- Faz rollback se necessário

### SUPABASE_PRIORITY
- Prioriza Supabase
- Falha se Supabase falhar
- Faz rollback se necessário

### STRICT_DUAL
- Exige sucesso em ambos
- Faz rollback se algum falhar

## 🚀 Scripts de Teste e Migração

### Teste de Sincronização

```bash
node test-products-sync.js
```

Este script:
1. Verifica produtos existentes em ambos os bancos
2. Cria um produto de teste no Firebase
3. Verifica se foi sincronizado para o Supabase
4. Testa a API de produtos

### Migração de Produtos Existentes

```bash
node migrate-products-to-supabase.js
```

Este script:
1. Busca todos os usuários no Firebase
2. Migra todos os produtos para o Supabase
3. Converte dados do formato Firebase para Supabase
4. Mantém compatibilidade com IDs existentes

## 📊 Estrutura de Dados

### Firebase (Formato Original)
```javascript
{
  id: "1234567890",
  name: "Produto Teste",
  category: "Eletrônicos",
  purchasePrice: 100,
  sellingPrice: 150,
  purchaseDate: Timestamp,
  sales: [...],
  // ... outros campos
}
```

### Supabase (Formato Normalizado)
```sql
{
  id: "uuid",
  user_id: "uuid",
  name: "Produto Teste",
  category: "Eletrônicos",
  purchase_price: 100.00,
  selling_price: 150.00,
  purchase_date: "2024-01-01T00:00:00Z",
  // ... outros campos
}
```

## 🔧 Configuração

### Variáveis de Ambiente Necessárias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## 🎯 Uso no Frontend

### Exemplo de Uso em Componente React

```typescript
import { useDualSync } from '@/lib/dual-database-sync';

function ProductManager({ userId }) {
  const { createProduct, updateProduct, deleteProduct } = useDualSync(userId);

  const handleCreateProduct = async (productData) => {
    try {
      const result = await createProduct(productData);
      
      if (result.success) {
        toast({
          title: "Produto Criado!",
          description: `Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`,
        });
      } else {
        toast({
          title: "Erro ao Criar Produto",
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  // ... outros handlers
}
```

## 🔍 Monitoramento

### Logs de Sincronização

O sistema gera logs detalhados para monitoramento:

```
✅ Produto criado no Firebase: abc123
✅ Produto criado no Supabase: def456
✅ Produto atualizado - Firebase: ✅ | Supabase: ✅
⚠️ Erro ao buscar produtos do Supabase, tentando Firebase
```

### Tratamento de Erros

- Erros são capturados e registrados
- Fallbacks automáticos entre bancos
- Rollback em caso de falha parcial (quando configurado)
- Mensagens de erro detalhadas para debugging

## 🚨 Considerações Importantes

1. **Performance**: A sincronização dual pode ser mais lenta que operações em um único banco
2. **Consistência**: Em caso de falha parcial, os dados podem ficar inconsistentes entre os bancos
3. **IDs**: Firebase usa IDs string, Supabase usa UUIDs
4. **Datas**: Conversão automática entre Timestamp (Firebase) e ISO string (Supabase)

## 🔄 Próximos Passos

1. Implementar sincronização em tempo real
2. Adicionar validação de dados
3. Implementar retry automático em caso de falha
4. Adicionar métricas de performance
5. Implementar limpeza de dados duplicados

## 📞 Suporte

Para dúvidas ou problemas com a sincronização de produtos, consulte:
- Logs do console para detalhes de erro
- Documentação do DualDatabaseSync
- Scripts de teste para validação 