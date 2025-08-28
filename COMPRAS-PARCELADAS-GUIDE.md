# 🛒 Guia de Compras Parceladas no Cartão

## 📋 Visão Geral

A funcionalidade de **Compras Parceladas no Cartão** permite que você gerencie e acompanhe todas as suas compras parceladas no cartão de crédito de forma organizada e intuitiva.

## ✨ Funcionalidades Principais

### 🔍 **Detecção Automática**
- Identifica automaticamente compras parceladas
- Categoriza como "Compras Parceladas"
- Adiciona tags específicas (`parcelado`, `cartão-credito`)

### 📊 **Controle Completo**
- Acompanha o progresso de cada compra
- Mostra valor total, parcelas pagas e restantes
- Calcula automaticamente valores de cada parcela
- Exibe data de vencimento de cada parcela

### 📈 **Dashboard Intuitivo**
- Estatísticas em tempo real
- Filtros por status (Todas, Pendentes, Pagas)
- Visualização clara do progresso
- Alertas de vencimento

## 🚀 Como Usar

### 1. **Acessar a Funcionalidade**
- Vá para a página de **Transações** (`/transacoes`)
- Clique na aba **"Compras Parceladas"**
- A funcionalidade está integrada diretamente na página de transações
- **Dados Reais**: A funcionalidade usa as transações reais do seu banco de dados
- **Sem Dados**: Se não há compras parceladas, mostra uma mensagem amigável

### 2. **Adicionar Nova Compra Parcelada**
1. Clique no botão "Nova Compra Parcelada"
2. Preencha os dados:
   - **Descrição**: Nome da compra (ex: "iPhone 15 Pro")
   - **Valor**: Valor total da compra
   - **Categoria**: Categoria da despesa
   - **Método de Pagamento**: Selecione "Cartão de Crédito"
   - **É parcelado?**: Marque a caixa
   - **Total de Parcelas**: Número de parcelas (ex: 12)
   - **Parcela Atual**: Qual parcela está sendo paga (ex: 1)

### 3. **Visualizar Informações**
- **Resumo do Parcelamento**: Preview das informações
- **Progresso**: Barra de progresso mostrando % pago
- **Valores**: Total, restante, valor da parcela
- **Datas**: Data de vencimento de cada parcela

### 4. **Gerenciar Parcelas**
- **Editar**: Clique em "Editar" para modificar dados
- **Excluir**: Remover compra parcelada
- **Marcar como Paga**: Alterar status da parcela

## 📱 Interface

### **Cards de Transação**
Cada compra parcelada é exibida em um card com:
- ✅ Descrição com número da parcela
- 💳 Ícone de cartão de crédito
- 📊 Barra de progresso
- 💰 Valores detalhados
- 📅 Data de vencimento
- 🏷️ Status (Paga/Pendente)

### **Estatísticas**
- **Total Parcelado**: Soma de todas as compras
- **Restante a Pagar**: Valor ainda pendente
- **Já Pago**: Valor total já quitado
- **Parcelas Pendentes**: Quantidade de parcelas em aberto

### **Filtros**
- **Todas**: Mostra todas as compras parceladas
- **Pendentes**: Apenas parcelas não pagas
- **Pagas**: Parcelas já quitadas

## 🔧 Configuração Técnica

### **Estrutura de Dados**
```typescript
interface Transaction {
  // ... campos básicos
  isInstallment?: boolean;
  installmentInfo?: {
    totalAmount: number;        // Valor total da compra
    totalInstallments: number;  // Número total de parcelas
    currentInstallment: number; // Parcela atual
    installmentAmount: number;  // Valor de cada parcela
    remainingAmount: number;    // Valor restante a pagar
    nextDueDate?: Date;        // Próxima data de vencimento
  };
}
```

### **Funções Utilitárias**
- `calculateInstallmentInfo()`: Calcula informações de parcelamento
- `generateInstallmentTransactions()`: Gera transações para todas as parcelas
- `isInstallmentTransaction()`: Verifica se é transação parcelada
- `getInstallmentProgress()`: Calcula % de progresso

## 💡 Dicas de Uso

### **Organização**
- Use descrições claras (ex: "iPhone 15 Pro" em vez de "Celular")
- Mantenha categorias consistentes
- Adicione observações quando necessário

### **Controle Financeiro**
- Monitore regularmente as parcelas pendentes
- Acompanhe o valor total comprometido
- Planeje pagamentos antecipados quando possível

### **Alertas**
- Configure lembretes para vencimentos
- Monitore o limite do cartão
- Evite parcelar demais compras simultaneamente

## 🎯 Benefícios

### **Para o Usuário**
- ✅ Controle total das compras parceladas
- 📊 Visualização clara do progresso
- ⏰ Lembretes de vencimento
- 💰 Planejamento financeiro melhorado

### **Para o Negócio**
- 🔄 Fidelização do cliente
- 📈 Engajamento com a plataforma
- 💡 Insights sobre comportamento de compra
- 🎯 Oportunidades de monetização

## 🔮 Próximas Funcionalidades

- [ ] **Lembretes Automáticos**: Notificações de vencimento
- [ ] **Relatórios**: Análises detalhadas de gastos
- [ ] **Integração Bancária**: Importação automática de faturas
- [ ] **Alertas de Limite**: Avisos sobre limite do cartão
- [ ] **Planejamento**: Sugestões de parcelamento inteligente

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:
1. Verifique se todos os campos estão preenchidos
2. Confirme se selecionou "Cartão de Crédito" como método de pagamento
3. Certifique-se de que o número de parcelas é maior que 1
4. Entre em contato com o suporte se o problema persistir

---

**Desenvolvido com ❤️ para melhorar sua organização financeira!** 