// Teste da função isInstallmentTransaction

// Simular a função isInstallmentTransaction
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Dados reais da transação (como vem do Supabase após conversão)
const realTransactionData = {
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
};

// Simular a conversão que acontece no frontend
function convertTransaction(transaction) {
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

console.log('🧪 Testando função isInstallmentTransaction...');
console.log('\n📊 Dados originais do Supabase:');
console.log('  is_installment:', realTransactionData.is_installment, '(tipo:', typeof realTransactionData.is_installment, ')');
console.log('  installment_info:', realTransactionData.installment_info, '(tipo:', typeof realTransactionData.installment_info, ')');

// Converter a transação
const convertedTransaction = convertTransaction(realTransactionData);

console.log('\n📊 Dados após conversão:');
console.log('  isInstallment:', convertedTransaction.isInstallment, '(tipo:', typeof convertedTransaction.isInstallment, ')');
console.log('  installmentInfo:', convertedTransaction.installmentInfo, '(tipo:', typeof convertedTransaction.installmentInfo, ')');

// Testar a função isInstallmentTransaction
const isInstallment = isInstallmentTransaction(convertedTransaction);
console.log('\n🔍 Resultado da função isInstallmentTransaction:', isInstallment);

// Testar condições individuais
console.log('\n🔍 Testando condições individuais:');
console.log('  convertedTransaction.isInstallment:', convertedTransaction.isInstallment);
console.log('  convertedTransaction.installmentInfo:', !!convertedTransaction.installmentInfo);
console.log('  convertedTransaction.isInstallment && convertedTransaction.installmentInfo:', convertedTransaction.isInstallment && convertedTransaction.installmentInfo);

// Testar com diferentes cenários
console.log('\n🧪 Testando diferentes cenários:');

const testCases = [
  {
    name: 'Transação parcelada válida (dados reais)',
    transaction: convertedTransaction
  },
  {
    name: 'Transação com isInstallment=true mas installmentInfo=null',
    transaction: { isInstallment: true, installmentInfo: null }
  },
  {
    name: 'Transação com isInstallment=false mas installmentInfo presente',
    transaction: { isInstallment: false, installmentInfo: { totalAmount: 100 } }
  },
  {
    name: 'Transação normal (não parcelada)',
    transaction: { isInstallment: false, installmentInfo: null }
  }
];

testCases.forEach((testCase, index) => {
  const result = isInstallmentTransaction(testCase.transaction);
  console.log(`  ${index + 1}. ${testCase.name}: ${result ? '✅ SIM' : '❌ NÃO'}`);
});

console.log('\n🏁 Teste concluído!');