// Test script using your actual transaction data
console.log("=== TESTING YOUR ACTUAL TRANSACTION DATA ===");
console.log("");

// Your actual transaction from database
const yourTransaction = {
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

console.log("1️⃣ Original Database Transaction:");
console.log(JSON.stringify(yourTransaction, null, 2));

console.log("\n2️⃣ Converting using your app's logic:");

// Simulate the exact conversion from transacoes/page.tsx
const convertedTransaction = {
  id: yourTransaction.id,
  date: new Date(yourTransaction.date),
  description: yourTransaction.description,
  amount: parseFloat(yourTransaction.amount),
  type: yourTransaction.type,
  category: yourTransaction.category,
  subcategory: yourTransaction.subcategory,
  paymentMethod: yourTransaction.payment_method,
  status: yourTransaction.status,
  notes: yourTransaction.notes,
  tags: yourTransaction.tags,
  productId: yourTransaction.product_id,
  isInstallment: yourTransaction.is_installment || false,
  installmentInfo: yourTransaction.installment_info ? JSON.parse(yourTransaction.installment_info) : null
};

console.log("✅ Converted Transaction:");
console.log({
  id: convertedTransaction.id,
  description: convertedTransaction.description,
  amount: convertedTransaction.amount,
  isInstallment: convertedTransaction.isInstallment,
  installmentInfo: convertedTransaction.installmentInfo
});

console.log("\n3️⃣ Testing isInstallmentTransaction filter:");

// Test the filtering function
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

const passesFilter = isInstallmentTransaction(convertedTransaction);
console.log("Filter Result:", passesFilter);

if (passesFilter) {
  console.log("\n🎉 SUCCESS! Your transaction WILL appear in 'Compras Parceladas'");
  
  console.log("\n📊 Transaction Details:");
  console.log(`• Description: ${convertedTransaction.description}`);
  console.log(`• Total Amount: R$ ${convertedTransaction.installmentInfo.totalAmount.toFixed(2)}`);
  console.log(`• Installment: ${convertedTransaction.installmentInfo.currentInstallment}/${convertedTransaction.installmentInfo.totalInstallments}`);
  console.log(`• Installment Amount: R$ ${convertedTransaction.installmentInfo.installmentAmount.toFixed(2)}`);
  console.log(`• Remaining: R$ ${convertedTransaction.installmentInfo.remainingAmount.toFixed(2)}`);
  console.log(`• Next Due: ${convertedTransaction.installmentInfo.nextDueDate}`);
  
  // Calculate progress
  const progress = Math.round((convertedTransaction.installmentInfo.currentInstallment / convertedTransaction.installmentInfo.totalInstallments) * 100);
  console.log(`• Progress: ${progress}%`);
  
  console.log("\n✅ This transaction should be visible in your InstallmentManager component!");
  
} else {
  console.log("\n❌ PROBLEM! Transaction will NOT appear in 'Compras Parceladas'");
  console.log("Debug info:");
  console.log("• isInstallment:", convertedTransaction.isInstallment);
  console.log("• installmentInfo:", convertedTransaction.installmentInfo ? "exists" : "missing");
}

console.log("\n4️⃣ Simulating Dashboard Statistics:");

// Simulate what would happen in InstallmentManager
const allTransactions = [convertedTransaction];
const installmentTransactions = allTransactions.filter(isInstallmentTransaction);

console.log(`Total Transactions: ${allTransactions.length}`);
console.log(`Installment Transactions: ${installmentTransactions.length}`);

if (installmentTransactions.length > 0) {
  // Calculate stats like in InstallmentManager
  const totalInstallmentAmount = installmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRemainingAmount = installmentTransactions
    .filter(t => t.installmentInfo)
    .reduce((sum, t) => sum + (t.installmentInfo?.remainingAmount || 0), 0);
  const totalPaidAmount = totalInstallmentAmount - totalRemainingAmount;
  
  console.log("\n📈 Dashboard would show:");
  console.log(`• Total Parcelado: R$ ${totalInstallmentAmount.toFixed(2)}`);
  console.log(`• Restante a Pagar: R$ ${totalRemainingAmount.toFixed(2)}`);
  console.log(`• Já Pago: R$ ${totalPaidAmount.toFixed(2)}`);
}

console.log("\n✅ Test completed!");