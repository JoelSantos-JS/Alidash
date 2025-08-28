# 🧹 Guia de Limpeza de Transações Duplicadas

Este guia explica como usar o script para limpar transações duplicadas no Firebase.

## 🔍 Problema Identificado

As transações estavam sendo duplicadas devido a:

1. **Inconsistência na estrutura do Firebase**: Transações sendo salvas em subcoleção mas lidas do documento principal
2. **Falta de deduplicação robusta**: Sistema não detectava adequadamente transações duplicadas
3. **Problemas na sincronização dual**: Possível criação duplicada durante sincronização

## ✅ Soluções Implementadas

### 1. Correção na Leitura de Transações
- **Antes**: Transações lidas do documento principal `user-data/{userId}`
- **Depois**: Transações lidas da subcoleção `user-data/{userId}/transactions`
- **Fallback**: Se a subcoleção falhar, tenta ler do documento principal

### 2. Deduplicação Robusta
- Implementada lógica de chave única baseada em: `data-valor-descrição`
- Verificação de duplicatas em múltiplas fontes (transações independentes, vendas, compras)
- Logs detalhados para identificar duplicatas

### 3. Melhorias na Sincronização Dual
- IDs únicos gerados para cada transação
- Melhor tratamento de erros e rollback
- Logs mais detalhados

## 🛠️ Script de Limpeza

### Pré-requisitos

1. **Node.js** instalado
2. **Variáveis de ambiente** configuradas:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=seu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
   ```

### Como Usar

1. **Execute o script**:
   ```bash
   node cleanup-duplicate-transactions.js <USER_ID>
   ```

2. **Exemplo**:
   ```bash
   node cleanup-duplicate-transactions.js abc123def456
   ```

### O que o Script Faz

1. **Busca todas as transações** da subcoleção do usuário
2. **Identifica duplicatas** usando a mesma lógica da aplicação
3. **Mostra detalhes** das transações duplicadas encontradas
4. **Remove duplicatas** mantendo apenas a primeira ocorrência
5. **Relata resultados** da operação

### Exemplo de Saída

```
🔍 Iniciando limpeza de transações duplicadas para o usuário: abc123def456
📊 Total de transações encontradas: 25
🚫 Encontradas 3 transações duplicadas para a chave: 2025-08-12-36-Compra: Estrela projetor galáxia luz da noite (3x)
   Transações: [
     { id: 'abc123', description: 'Compra: Estrela projetor galáxia luz da noite (3x)', amount: 36, date: '2025-08-12' },
     { id: 'def456', description: 'Compra: Estrela projetor galáxia luz da noite (3x)', amount: 36, date: '2025-08-12' },
     { id: 'ghi789', description: 'Compra: Estrela projetor galáxia luz da noite (3x)', amount: 36, date: '2025-08-12' }
   ]
🗑️ Total de transações duplicadas para exclusão: 2

⚠️ ATENÇÃO: As seguintes transações serão EXCLUÍDAS:
1. ID: def456 | Compra: Estrela projetor galáxia luz da noite (3x) | R$ 36 | 2025-08-12
2. ID: ghi789 | Compra: Estrela projetor galáxia luz da noite (3x) | R$ 36 | 2025-08-12

🗑️ Executando exclusões...
✅ Excluída transação: def456 - Compra: Estrela projetor galáxia luz da noite (3x)
✅ Excluída transação: ghi789 - Compra: Estrela projetor galáxia luz da noite (3x)

🎉 Limpeza concluída! 2 transações duplicadas foram removidas.
📊 Transações restantes: 23
```

## 🔧 Configuração Manual (Opcional)

Se quiser confirmar manualmente cada exclusão, descomente estas linhas no script:

```javascript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const answer = await new Promise(resolve => {
  rl.question('\nDeseja continuar com a exclusão? (y/N): ', resolve);
});
rl.close();

if (answer.toLowerCase() !== 'y') {
  console.log('❌ Operação cancelada pelo usuário');
  return;
}
```

## 📋 Listar Transações (Debug)

Para apenas listar todas as transações sem fazer alterações:

```javascript
// Descomente esta linha no final do script:
listAllTransactions(userId);
```

## ⚠️ Importante

- **Faça backup** dos dados antes de executar o script
- **Teste primeiro** com um usuário de teste
- **Verifique os logs** para entender o que será removido
- **Execute durante horário de baixo tráfego** para evitar conflitos

## 🔄 Prevenção Futura

Para evitar duplicatas no futuro:

1. **Use sempre a versão atualizada** do código
2. **Monitore os logs** da aplicação para detectar duplicatas
3. **Execute o script periodicamente** se necessário
4. **Considere implementar** validação no lado do servidor

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o USER_ID está correto
3. Verifique os logs de erro no console
4. Teste com um usuário de teste primeiro 