# 🔄 Guia de Sincronização Dual - Firebase + Supabase

Este guia explica como usar o sistema de sincronização dual que permite gravar dados simultaneamente no Firebase e Supabase.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Modos de Sincronização](#modos-de-sincronização)
4. [Uso Básico](#uso-básico)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Melhores Práticas](#melhores-práticas)

## 🎯 Visão Geral

### Por que Sincronização Dual?

- **🔒 Redundância**: Dados seguros em dois bancos diferentes
- **⚡ Performance**: Leitura otimizada de qualquer banco
- **🔄 Migração Gradual**: Transição suave do Firebase para Supabase
- **🛡️ Backup Automático**: Proteção contra perda de dados
- **🔧 Flexibilidade**: Diferentes estratégias de sincronização

### Arquitetura

```
┌─────────────┐    ┌─────────────────────────────┐
│   Aplicação │───▶│    DualDatabaseSync         │
│   (React)   │    │                             │
└─────────────┘    │  ┌─────────┐  ┌───────────┐ │
                   │  │Firebase │  │ Supabase  │ │
                   │  │   ✅     │  │    ✅      │ │
                   │  └─────────┘  └───────────┘ │
                   └─────────────────────────────┘
```

## ⚙️ Como Funciona

### Fluxo de Sincronização

1. **Operação Iniciada**: Usuário cria/atualiza/deleta dados
2. **Dual Write**: Sistema tenta gravar em ambos os bancos
3. **Verificação**: Checa sucesso/falha de cada operação
4. **Rollback** (se necessário): Desfaz operações em caso de falha
5. **Resultado**: Retorna status detalhado da sincronização

### Tipos de Operação Suportados

- ✅ **Produtos**: Criar, atualizar, deletar
- ✅ **Transações**: Criar, atualizar, deletar
- ✅ **Sonhos**: Criar, atualizar, deletar
- ✅ **Apostas**: Criar, atualizar, deletar
- ✅ **Metas**: Criar, atualizar, deletar
- ✅ **Dívidas**: Criar, atualizar, deletar

## 🎛️ Modos de Sincronização

### 1. **BEST_EFFORT** (Recomendado)
```typescript
// Mantém dados onde conseguir gravar
// Não faz rollback em caso de falha parcial
const dualSync = useDualSync(userId, 'BEST_EFFORT')
```

**Quando usar**: Situações onde é importante manter os dados, mesmo que em apenas um banco.

### 2. **FIREBASE_PRIORITY**
```typescript
// Prioriza Firebase - falha se Firebase falhar
const dualSync = useDualSync(userId, 'FIREBASE_PRIORITY')
```

**Quando usar**: Durante migração, quando Firebase ainda é o banco principal.

### 3. **SUPABASE_PRIORITY**
```typescript
// Prioriza Supabase - falha se Supabase falhar
const dualSync = useDualSync(userId, 'SUPABASE_PRIORITY')
```

**Quando usar**: Após migração, quando Supabase é o banco principal.

### 4. **STRICT_DUAL**
```typescript
// Exige sucesso em ambos - faz rollback se algum falhar
const dualSync = useDualSync(userId, 'STRICT_DUAL')
```

**Quando usar**: Situações críticas onde consistência total é obrigatória.

## 🚀 Uso Básico

### 1. Importar o Hook

```typescript
import { useDualSync } from '@/lib/dual-database-sync'
import { useAuth } from '@/hooks/use-auth'
```

### 2. Configurar no Componente

```typescript
function MeuComponente() {
  const { user } = useAuth()
  const dualSync = useDualSync(user?.firebase_uid || '', 'BEST_EFFORT')
  
  // Usar métodos de sincronização...
}
```

### 3. Criar Dados

```typescript
const handleCreateProduct = async () => {
  const result = await dualSync.createProduct({
    name: 'iPhone 15',
    category: 'Eletrônicos',
    purchasePrice: 3000,
    sellingPrice: 4000,
    status: 'purchased',
    quantity: 1
  })
  
  if (result.success) {
    console.log('Produto criado com sucesso!')
    console.log(`Firebase: ${result.firebaseSuccess ? '✅' : '❌'}`)
    console.log(`Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
  } else {
    console.error('Falha na criação:', result.errors)
  }
}
```

## 📝 Exemplos Práticos

### Exemplo 1: Criar Produto

```typescript
import { useDualSync } from '@/lib/dual-database-sync'

function ProductForm() {
  const { user } = useAuth()
  const dualSync = useDualSync(user?.firebase_uid || '')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (formData) => {
    setLoading(true)
    
    try {
      const result = await dualSync.createProduct({
        name: formData.name,
        category: formData.category,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        status: 'purchased',
        quantity: 1,
        purchaseDate: new Date()
      })
      
      if (result.success) {
        toast.success('Produto criado com sucesso!')
        // Mostrar status de cada banco
        console.log('Status:', {
          firebase: result.firebaseSuccess,
          supabase: result.supabaseSuccess
        })
      } else {
        toast.error('Erro ao criar produto')
        console.error('Erros:', result.errors)
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos do formulário */}
      <button type="submit" disabled={loading}>
        {loading ? 'Sincronizando...' : 'Criar Produto'}
      </button>
    </form>
  )
}
```

### Exemplo 2: Criar Transação

```typescript
function TransactionForm() {
  const { user } = useAuth()
  const dualSync = useDualSync(user?.firebase_uid || '', 'SUPABASE_PRIORITY')
  
  const handleCreateTransaction = async (data) => {
    const result = await dualSync.createTransaction({
      description: data.description,
      amount: data.amount,
      type: data.type, // 'revenue' | 'expense'
      category: data.category,
      paymentMethod: data.paymentMethod,
      status: 'completed',
      date: new Date()
    })
    
    // Verificar resultado
    if (result.success) {
      console.log('Transação criada!')
    } else {
      console.error('Falha:', result.errors)
    }
  }
  
  return (
    // JSX do formulário
  )
}
```

### Exemplo 3: Configuração Personalizada

```typescript
import { DualDatabaseSync, DualSyncPresets } from '@/lib/dual-database-sync'

function AdvancedComponent() {
  const { user } = useAuth()
  
  // Configuração personalizada
  const customSync = new DualDatabaseSync(user?.firebase_uid || '', {
    prioritizeFirebase: false,
    prioritizeSupabase: true,
    rollbackOnFailure: false // Permite falha parcial
  })
  
  // Ou usar preset
  const presetSync = new DualDatabaseSync(user?.firebase_uid || '', 
    DualSyncPresets.BEST_EFFORT
  )
  
  return (
    // Componente
  )
}
```

## ⚠️ Tratamento de Erros

### Estrutura do Resultado

```typescript
interface DualSyncResult {
  success: boolean           // Sucesso geral da operação
  firebaseSuccess: boolean   // Sucesso específico do Firebase
  supabaseSuccess: boolean   // Sucesso específico do Supabase
  errors: string[]          // Lista de erros detalhados
}
```

### Cenários de Erro

#### 1. **Falha Parcial** (Modo BEST_EFFORT)
```typescript
const result = await dualSync.createProduct(productData)

if (result.success) {
  if (result.firebaseSuccess && result.supabaseSuccess) {
    // ✅ Sucesso total
    console.log('Dados salvos em ambos os bancos!')
  } else if (result.firebaseSuccess) {
    // ⚠️ Sucesso parcial - apenas Firebase
    console.log('Dados salvos apenas no Firebase')
  } else if (result.supabaseSuccess) {
    // ⚠️ Sucesso parcial - apenas Supabase
    console.log('Dados salvos apenas no Supabase')
  }
} else {
  // ❌ Falha total
  console.error('Falha em ambos os bancos:', result.errors)
}
```

#### 2. **Falha com Rollback** (Modo STRICT_DUAL)
```typescript
const result = await dualSync.createProduct(productData)

if (!result.success) {
  // Sistema fez rollback automático
  console.log('Operação cancelada - dados não foram salvos')
  console.error('Erros:', result.errors)
}
```

### Logs Detalhados

O sistema gera logs automáticos para debug:

```
✅ Produto criado no Firebase: abc123
✅ Produto criado no Supabase: def456
🔄 Rollback: Produto removido do Firebase
❌ Erro no rollback Supabase: Connection timeout
```

## 🎯 Melhores Práticas

### 1. **Escolha do Modo Correto**

```typescript
// ✅ Para operações críticas
const strictSync = useDualSync(userId, 'STRICT_DUAL')

// ✅ Para operações normais
const normalSync = useDualSync(userId, 'BEST_EFFORT')

// ✅ Durante migração
const migrationSync = useDualSync(userId, 'FIREBASE_PRIORITY')
```

### 2. **Feedback Visual para o Usuário**

```typescript
const [syncStatus, setSyncStatus] = useState({
  loading: false,
  lastResult: null
})

const handleCreate = async (data) => {
  setSyncStatus({ loading: true, lastResult: null })
  
  const result = await dualSync.createProduct(data)
  
  setSyncStatus({ loading: false, lastResult: result })
  
  // Mostrar toast baseado no resultado
  if (result.success) {
    if (result.firebaseSuccess && result.supabaseSuccess) {
      toast.success('Dados salvos com segurança!')
    } else {
      toast.warning('Dados salvos parcialmente')
    }
  } else {
    toast.error('Falha ao salvar dados')
  }
}
```

### 3. **Monitoramento de Performance**

```typescript
const handleCreateWithMetrics = async (data) => {
  const startTime = Date.now()
  
  const result = await dualSync.createProduct(data)
  
  const duration = Date.now() - startTime
  
  // Log de performance
  console.log(`Sync completed in ${duration}ms`, {
    firebase: result.firebaseSuccess,
    supabase: result.supabaseSuccess,
    errors: result.errors.length
  })
  
  return result
}
```

### 4. **Tratamento de Conectividade**

```typescript
const handleOfflineSync = async (data) => {
  try {
    const result = await dualSync.createProduct(data)
    
    if (!result.success) {
      // Salvar para sincronização posterior
      await saveToLocalStorage('pending_sync', data)
      toast.info('Dados salvos localmente - sincronizarão quando conectar')
    }
    
    return result
  } catch (error) {
    // Fallback para armazenamento local
    await saveToLocalStorage('pending_sync', data)
    toast.warning('Sem conexão - dados salvos localmente')
  }
}
```

## 🔧 Configurações Avançadas

### Timeout Personalizado

```typescript
// Implementar timeout personalizado
const syncWithTimeout = async (operation, timeout = 5000) => {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ])
}
```

### Retry Logic

```typescript
const syncWithRetry = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 📊 Monitoramento e Métricas

### Dashboard de Status

```typescript
function SyncStatusDashboard() {
  const [metrics, setMetrics] = useState({
    totalOperations: 0,
    successfulSyncs: 0,
    partialSyncs: 0,
    failedSyncs: 0,
    averageLatency: 0
  })
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard 
        title="Operações Totais" 
        value={metrics.totalOperations} 
      />
      <MetricCard 
        title="Sincronizações Completas" 
        value={metrics.successfulSyncs}
        color="green"
      />
      <MetricCard 
        title="Sincronizações Parciais" 
        value={metrics.partialSyncs}
        color="yellow"
      />
      <MetricCard 
        title="Falhas" 
        value={metrics.failedSyncs}
        color="red"
      />
    </div>
  )
}
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. **Timeout de Conexão**
```
Erro: Firebase: Connection timeout
Solução: Verificar conectividade e configurar retry
```

#### 2. **Dados Inconsistentes**
```
Erro: Supabase: Constraint violation
Solução: Validar dados antes da sincronização
```

#### 3. **Rollback Falhou**
```
Erro: Rollback failed - manual cleanup required
Solução: Verificar dados manualmente nos bancos
```

### Debug Mode

```typescript
// Ativar logs detalhados
const debugSync = new DualDatabaseSync(userId, {
  ...options,
  debug: true // Adicionar esta opção
})
```

## ✅ Checklist de Implementação

- [ ] Configurar variáveis de ambiente
- [ ] Escolher modo de sincronização apropriado
- [ ] Implementar tratamento de erros
- [ ] Adicionar feedback visual
- [ ] Configurar logs e monitoramento
- [ ] Testar cenários de falha
- [ ] Implementar fallback offline
- [ ] Documentar uso para equipe

---

## 🎉 Conclusão

A sincronização dual oferece:

- **🔒 Segurança**: Dados protegidos em dois bancos
- **⚡ Performance**: Flexibilidade de leitura
- **🔄 Migração**: Transição suave entre bancos
- **🛡️ Confiabilidade**: Múltiplas estratégias de sincronização

**Próximos passos**: Implemente gradualmente, começando com operações não-críticas e evoluindo para o modo STRICT_DUAL conforme a confiança no sistema aumenta.

---

**📞 Suporte**
- GitHub Issues: Para bugs e melhorias
- Documentação: Para referência técnica
- Discord: Para discussões da comunidade