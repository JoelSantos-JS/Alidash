/**
 * Test Script: Verify Installment Transaction Processing
 * This script simulates how your transaction data is processed in the frontend
 */

// Your actual database transaction data
const databaseTransaction = {
  "id": "51e7f92a-59f1-437b-a3af-3c25fdf32c29",
  "description": "Gastei 600 numa compra parcelada de 600 reais",
  "amount": "50.00",
  "type": "expense",
  "category": "lazer",
  "payment_method": null,
  "status": "completed",
  "is_installment": true,
  "installment_info": "{\"nextDueDate\": \"2025-09-28T19:42:42.084Z\", \"totalAmount\": 600, \"remainingAmount\": 550, \"installmentAmount\": 50, \"totalInstallments\": 12, \"currentInstallment\": 1}"
};

// Simulate the conversion process from the transactions page
function convertTransaction(transaction) {
  console.log('🔄 Converting transaction:', {
    id: transaction.id,
    description: transaction.description,
    is_installment: transaction.is_installment,
    installment_info: transaction.installment_info,
    has_installment_fields: 'is_installment' in transaction && 'installment_info' in transaction
  });
  
  const convertedTransaction = {
    id: transaction.id,
    date: new Date(transaction.date || transaction.created_at),
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

  return convertedTransaction;
}

// Test the isInstallmentTransaction function
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Test the conversion
console.log('🧪 TESTING INSTALLMENT TRANSACTION CONVERSION');
console.log('==========================================\n');

console.log('📄 Original Database Transaction:');
console.log(JSON.stringify(databaseTransaction, null, 2));
console.log('\n');

console.log('🔄 Converting to frontend format...\n');
const converted = convertTransaction(databaseTransaction);

console.log('✅ Converted Transaction:');
console.log(JSON.stringify(converted, null, 2));
console.log('\n');

console.log('🔍 Installment Detection Test:');
console.log('isInstallment:', converted.isInstallment);
console.log('installmentInfo exists:', !!converted.installmentInfo);
console.log('isInstallmentTransaction():', isInstallmentTransaction(converted));
console.log('\n');

if (isInstallmentTransaction(converted)) {
  console.log('🎉 SUCCESS: Transaction is correctly identified as installment!');
  console.log('📊 Installment Details:');
  console.log(`  • Total Amount: R$ ${converted.installmentInfo.totalAmount.toFixed(2)}`);
  console.log(`  • Installment Amount: R$ ${converted.installmentInfo.installmentAmount.toFixed(2)}`);
  console.log(`  • Current Installment: ${converted.installmentInfo.currentInstallment}/${converted.installmentInfo.totalInstallments}`);
  console.log(`  • Remaining Amount: R$ ${converted.installmentInfo.remainingAmount.toFixed(2)}`);
  console.log(`  • Next Due Date: ${converted.installmentInfo.nextDueDate}`);
  
  // Calculate progress
  const progress = Math.round((converted.installmentInfo.currentInstallment / converted.installmentInfo.totalInstallments) * 100);
  console.log(`  • Progress: ${progress}%`);
  
} else {
  console.log('❌ PROBLEM: Transaction is not being identified as installment!');
  console.log('Debugging info:');
  console.log('  • isInstallment:', converted.isInstallment);
  console.log('  • installmentInfo:', converted.installmentInfo);
  console.log('  • installmentInfo type:', typeof converted.installmentInfo);
}

console.log('\n🔬 FRONTEND UI SIMULATION');
console.log('========================\n');

// Simulate filtering for installment transactions (like in InstallmentManager)
const allTransactions = [converted]; // In real app, this would be all transactions
const installmentTransactions = allTransactions.filter(isInstallmentTransaction);

console.log(`📊 Total transactions: ${allTransactions.length}`);
console.log(`💳 Installment transactions found: ${installmentTransactions.length}`);

if (installmentTransactions.length > 0) {
  console.log('\n🎯 This transaction SHOULD appear in the "Compras Parceladas" tab!');
  
  // Simulate statistics calculation
  const totalInstallmentAmount = installmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRemainingAmount = installmentTransactions
    .filter(t => t.installmentInfo)
    .reduce((sum, t) => sum + (t.installmentInfo?.remainingAmount || 0), 0);
  const totalPaidAmount = totalInstallmentAmount - totalRemainingAmount;
  
  console.log('\n📈 Dashboard Statistics:');
  console.log(`  • Total Parcelado: R$ ${totalInstallmentAmount.toFixed(2)}`);
  console.log(`  • Restante a Pagar: R$ ${totalRemainingAmount.toFixed(2)}`);
  console.log(`  • Já Pago: R$ ${totalPaidAmount.toFixed(2)}`);
} else {
  console.log('\n❌ This transaction will NOT appear in the "Compras Parceladas" tab!');
}