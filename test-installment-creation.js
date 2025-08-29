// Teste de criação de transação parcelada
// Execute este script para testar se os dados estão sendo salvos corretamente

const { calculateInstallmentInfo } = require('./src/lib/utils');

// Simular dados de uma transação parcelada
const transactionData = {
  description: "Teste de compra parcelada - R$ 600 em 12x",
  amount: 50, // Valor da parcela
  type: "expense",
  category: "teste",
  status: "completed",
  date: new Date(),
  isInstallment: true,
  installmentInfo: calculateInstallmentInfo(600, 12, 1) // R$ 600 total, 12x, parcela 1
};

console.log('🎯 Dados da transação parcelada:');
console.log('Descrição:', transactionData.description);
console.log('Valor da parcela:', transactionData.amount);
console.log('É parcelada:', transactionData.isInstallment);
console.log('Info de parcelamento:', JSON.stringify(transactionData.installmentInfo, null, 2));

// Simular dados que seriam enviados para o Supabase
const supabaseData = {
  user_id: "test-user-id",
  date: transactionData.date.toISOString(),
  description: transactionData.description,
  amount: transactionData.amount,
  type: transactionData.type,
  category: transactionData.category,
  status: transactionData.status,
  is_installment: transactionData.isInstallment,
  installment_info: JSON.stringify(transactionData.installmentInfo)
};

console.log('\n📝 Dados para inserção no Supabase:');
console.log('is_installment:', supabaseData.is_installment);
console.log('installment_info:', supabaseData.installment_info);

// Simular conversão de volta
const parsedInstallmentInfo = JSON.parse(supabaseData.installment_info);
console.log('\n🔄 Dados convertidos de volta:');
console.log('installment_info parseado:', parsedInstallmentInfo);
console.log('Tipo do installment_info:', typeof parsedInstallmentInfo);
console.log('É objeto:', typeof parsedInstallmentInfo === 'object');

// Verificar se os dados estão corretos
const expectedInfo = {
  totalAmount: 600,
  totalInstallments: 12,
  currentInstallment: 1,
  installmentAmount: 50,
  remainingAmount: 550,
  nextDueDate: expect.any(String)
};

console.log('\n✅ Verificação dos dados:');
console.log('Total amount correto:', parsedInstallmentInfo.totalAmount === 600);
console.log('Total installments correto:', parsedInstallmentInfo.totalInstallments === 12);
console.log('Current installment correto:', parsedInstallmentInfo.currentInstallment === 1);
console.log('Installment amount correto:', parsedInstallmentInfo.installmentAmount === 50);
console.log('Remaining amount correto:', parsedInstallmentInfo.remainingAmount === 550); 