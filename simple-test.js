// Simple test for installment transaction conversion
const transaction = {
  "id": "51e7f92a-59f1-437b-a3af-3c25fdf32c29",
  "description": "Gastei 600 numa compra parcelada de 600 reais",
  "amount": "50.00",
  "type": "expense",
  "category": "lazer",
  "payment_method": null,
  "status": "completed",
  "is_installment": true,
  "installment_info": "{\"nextDueDate\": \"2025-09-28T19:42:42.084Z\", \"totalAmount\": 600, \"remainingAmount\": 550, \"installmentAmount\": 50, \"totalInstallments\": 12, \"currentInstallment\": 1}",
  "created_at": "2025-08-28 19:42:41.710235+00"
};

console.log("=== TESTING INSTALLMENT TRANSACTION CONVERSION ===");
console.log("");

// Step 1: Parse installment_info
console.log("Step 1: Parse installment_info");
try {
  const installmentInfo = JSON.parse(transaction.installment_info);
  console.log("✅ installment_info parsed successfully:");
  console.log(installmentInfo);
} catch (error) {
  console.log("❌ Failed to parse installment_info:", error.message);
  process.exit(1);
}

// Step 2: Convert transaction
console.log("\nStep 2: Convert to frontend format");
const converted = {
  id: transaction.id,
  date: new Date(transaction.created_at),
  description: transaction.description,
  amount: parseFloat(transaction.amount),
  type: transaction.type,
  category: transaction.category,
  paymentMethod: transaction.payment_method,
  status: transaction.status,
  isInstallment: transaction.is_installment || false,
  installmentInfo: transaction.installment_info ? JSON.parse(transaction.installment_info) : null
};

console.log("✅ Converted transaction:");
console.log("  • isInstallment:", converted.isInstallment);
console.log("  • installmentInfo exists:", !!converted.installmentInfo);

// Step 3: Test filtering
console.log("\nStep 3: Test isInstallmentTransaction filter");
function isInstallmentTransaction(t) {
  return t.isInstallment && t.installmentInfo;
}

const isInstallment = isInstallmentTransaction(converted);
console.log("✅ Filter result:", isInstallment);

if (isInstallment) {
  console.log("\n🎉 SUCCESS! Transaction should appear in Compras Parceladas tab");
  console.log("📊 Details:");
  console.log(`  • Total: R$ ${converted.installmentInfo.totalAmount}`);
  console.log(`  • Parcela: ${converted.installmentInfo.currentInstallment}/${converted.installmentInfo.totalInstallments}`);
  console.log(`  • Valor da parcela: R$ ${converted.installmentInfo.installmentAmount}`);
  console.log(`  • Restante: R$ ${converted.installmentInfo.remainingAmount}`);
} else {
  console.log("\n❌ PROBLEM! Transaction will NOT appear in Compras Parceladas tab");
}