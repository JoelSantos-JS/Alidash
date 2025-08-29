// Debug completo do fluxo frontend para compras parceladas

// Simular dados reais do Supabase (como retornados pela API)
const mockApiResponse = {
  transactions: [
    {
      "id": "51e7f92a-59f1-437b-a3af-3c25fdf32c29",
      "user_id": "f06c3c27-5862-4332-96f2-d0f1e62bf9cc",
      "date": "2025-08-28 19:42:42.084+00",
      "description": "Gastei 600 numa compra parcelada de 600 reais",
      "amount": "50.00",
      "type": "expense",
      "category": "lazer",
      "subcategory": null,
      "payment_method": null,
      "status": "completed",
      "notes": null,
      "tags": null,
      "product_id": null,
      "created_at": "2025-08-28 19:42:41.710235+00",
      "updated_at": "2025-08-28 19:42:41.710235+00",
      "value": "50.00",
      "transaction_date": "2025-08-28 19:42:41.710235+00",
      "is_installment": true,
      "installment_info": "{\"nextDueDate\": \"2025-09-28T19:42:42.084Z\", \"totalAmount\": 600, \"remainingAmount\": 550, \"installmentAmount\": 50, \"totalInstallments\": 12, \"currentInstallment\": 1}"
    },
    {
      "id": "normal-transaction-1",
      "user_id": "f06c3c27-5862-4332-96f2-d0f1e62bf9cc",
      "date": "2025-08-27 10:00:00.000+00",
      "description": "Compra normal no supermercado",
      "amount": "150.00",
      "type": "expense",
      "category": "alimentacao",
      "subcategory": null,
      "payment_method": "debit_card",
      "status": "completed",
      "notes": null,
      "tags": null,
      "product_id": null,
      "created_at": "2025-08-27 10:00:00.000000+00",
      "updated_at": "2025-08-27 10:00:00.000000+00",
      "value": "150.00",
      "transaction_date": "2025-08-27 10:00:00.000000+00",
      "is_installment": false,
      "installment_info": null
    },
    {
      "id": "installment-transaction-2",
      "user_id": "f06c3c27-5862-4332-96f2-d0f1e62bf9cc",
      "date": "2025-08-26 15:30:00.000+00",
      "description": "Parcelei uma compra de 600 reais em 12x",
      "amount": "50.00",
      "type": "expense",
      "category": "eletronicos",
      "subcategory": null,
      "payment_method": "credit_card",
      "status": "pending",
      "notes": null,
      "tags": null,
      "product_id": null,
      "created_at": "2025-08-26 15:30:00.000000+00",
      "updated_at": "2025-08-26 15:30:00.000000+00",
      "value": "50.00",
      "transaction_date": "2025-08-26 15:30:00.000000+00",
      "is_installment": true,
      "installment_info": "{\"nextDueDate\": \"2025-09-26T15:30:00.000Z\", \"totalAmount\": 600, \"remainingAmount\": 550, \"installmentAmount\": 50, \"totalInstallments\": 12, \"currentInstallment\": 1}"
    }
  ]
};

// Função isInstallmentTransaction (copiada do utils.ts)
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Simular conversão do frontend (como no page.tsx)
function convertTransactionFromApi(transaction) {
  console.log('🔄 Convertendo transação:', {
    id: transaction.id,
    description: transaction.description,
    is_installment: transaction.is_installment,
    installment_info: transaction.installment_info,
    has_installment_fields: 'is_installment' in transaction && 'installment_info' in transaction
  });
  
  const convertedTransaction = {
    id: transaction.id,
    date: new Date(transaction.date),
    description: transaction.description,
    amount: parseFloat(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    subcategory: transaction.subcategory,
    paymentMethod: transaction.payment_method,
    status: transaction.status,
    notes: transaction.notes,
    tags: transaction.tags,
    productId: transaction.product_id,
    isInstallment: transaction.is_installment || false,
    installmentInfo: transaction.installment_info ? JSON.parse(transaction.installment_info) : null
  };

  // Log específico para verificar se a conversão está correta
  if (convertedTransaction.isInstallment && convertedTransaction.installmentInfo) {
    console.log('✅ Transação parcelada convertida corretamente:', {
      id: convertedTransaction.id,
      description: convertedTransaction.description,
      isInstallment: convertedTransaction.isInstallment,
      installmentInfo: convertedTransaction.installmentInfo,
      hasInstallmentInfo: !!convertedTransaction.installmentInfo,
      installmentInfoType: typeof convertedTransaction.installmentInfo
    });
  } else if (convertedTransaction.isInstallment && !convertedTransaction.installmentInfo) {
    console.log('❌ PROBLEMA: Transação marcada como parcelada mas sem installmentInfo:', {
      id: convertedTransaction.id,
      description: convertedTransaction.description,
      isInstallment: convertedTransaction.isInstallment,
      installmentInfo: convertedTransaction.installmentInfo,
      original_installment_info: transaction.installment_info
    });
  }
  
  console.log('✅ Transação convertida:', {
    id: convertedTransaction.id,
    description: convertedTransaction.description,
    isInstallment: convertedTransaction.isInstallment,
    installmentInfo: convertedTransaction.installmentInfo,
    isInstallmentTransaction: convertedTransaction.isInstallment && convertedTransaction.installmentInfo
  });
  
  return convertedTransaction;
}

// Simular lógica do InstallmentManager
function simulateInstallmentManager(transactions) {
  console.log('🔍 InstallmentManager - Transações recebidas:', {
    total: transactions.length,
    transactions: transactions.map(t => ({
      id: t.id,
      description: t.description,
      isInstallment: t.isInstallment,
      installmentInfo: t.installmentInfo
    }))
  });

  const installmentTransactions = transactions.filter(isInstallmentTransaction);
  
  console.log('🔍 InstallmentManager - Transações parceladas filtradas:', {
    total: installmentTransactions.length,
    installmentTransactions: installmentTransactions.map(t => ({
      id: t.id,
      description: t.description,
      isInstallment: t.isInstallment,
      installmentInfo: t.installmentInfo
    }))
  });
  
  // Separar por status
  const pendingInstallments = installmentTransactions.filter(t => t.status === 'pending');
  const completedInstallments = installmentTransactions.filter(t => t.status === 'completed');
  
  console.log('📊 Estatísticas do InstallmentManager:', {
    total: installmentTransactions.length,
    pending: pendingInstallments.length,
    completed: completedInstallments.length
  });
  
  // Simular renderização
  if (installmentTransactions.length === 0) {
    console.log('🚫 RESULTADO: Mostrando mensagem "Nenhuma compra parcelada encontrada"');
    return 'empty_state';
  } else {
    console.log('✅ RESULTADO: Mostrando', installmentTransactions.length, 'transações parceladas');
    console.log('📋 Transações que serão exibidas:');
    installmentTransactions.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.description} - R$ ${t.amount} (${t.status})`);
      console.log(`     Parcela ${t.installmentInfo.currentInstallment}/${t.installmentInfo.totalInstallments}`);
      console.log(`     Total: R$ ${t.installmentInfo.totalAmount} | Restante: R$ ${t.installmentInfo.remainingAmount}`);
    });
    return 'showing_transactions';
  }
}

console.log('🧪 === DEBUG COMPLETO DO FLUXO FRONTEND ===\n');

// Passo 1: Simular resposta da API
console.log('1️⃣ Simulando resposta da API /api/transactions/get');
console.log('📊 Dados brutos da API:', {
  total: mockApiResponse.transactions.length,
  installment_transactions: mockApiResponse.transactions.filter(t => t.is_installment).length
});

// Passo 2: Converter transações (como no page.tsx)
console.log('\n2️⃣ Convertendo transações (simulando page.tsx)');
const convertedTransactions = mockApiResponse.transactions.map(convertTransactionFromApi);

// Passo 3: Verificar transações parceladas após conversão
console.log('\n3️⃣ Verificando transações parceladas após conversão');
const installmentTransactions = convertedTransactions.filter(t => t.isInstallment && t.installmentInfo);
console.log('📊 Análise das transações:', {
  total: convertedTransactions.length,
  parceladas: installmentTransactions.length,
  naoParceladas: convertedTransactions.length - installmentTransactions.length
});

if (installmentTransactions.length > 0) {
  console.log('🎉 Transações parceladas encontradas:');
  installmentTransactions.forEach((t, index) => {
    console.log(`  ${index + 1}. ${t.description}`);
    console.log(`     - isInstallment: ${t.isInstallment}`);
    console.log(`     - installmentInfo: presente`);
    console.log(`     - Parcela: ${t.installmentInfo.currentInstallment}/${t.installmentInfo.totalInstallments}`);
  });
} else {
  console.log('❌ PROBLEMA: Nenhuma transação parcelada encontrada após conversão!');
}

// Passo 4: Simular InstallmentManager
console.log('\n4️⃣ Simulando InstallmentManager');
const managerResult = simulateInstallmentManager(convertedTransactions);

// Passo 5: Diagnóstico final
console.log('\n5️⃣ DIAGNÓSTICO FINAL');
if (managerResult === 'empty_state') {
  console.log('❌ PROBLEMA IDENTIFICADO: InstallmentManager está mostrando estado vazio');
  console.log('🔍 Possíveis causas:');
  console.log('  1. Função isInstallmentTransaction não está funcionando');
  console.log('  2. Dados não estão sendo convertidos corretamente');
  console.log('  3. Filtro está removendo as transações parceladas');
  
  // Debug adicional
  console.log('\n🔬 DEBUG ADICIONAL:');
  convertedTransactions.forEach((t, index) => {
    const isInstallment = isInstallmentTransaction(t);
    console.log(`Transação ${index + 1}: ${t.description}`);
    console.log(`  - isInstallment: ${t.isInstallment}`);
    console.log(`  - installmentInfo: ${t.installmentInfo ? 'presente' : 'ausente'}`);
    console.log(`  - isInstallmentTransaction(): ${isInstallment}`);
    console.log(`  - Será incluída no filtro: ${isInstallment ? 'SIM' : 'NÃO'}`);
  });
} else {
  console.log('✅ SUCESSO: InstallmentManager deveria estar mostrando as transações parceladas');
}

console.log('\n🏁 Debug concluído!');