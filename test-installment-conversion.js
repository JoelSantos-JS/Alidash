// Teste específico para conversão do installmentInfo
console.log('🧪 Testando conversão do installmentInfo...\n');

// Dados reais do Supabase (baseado no que você mostrou)
const supabaseData = {
  id: "51e7f92a-59f1-437b-a3af-3c25fdf32c29",
  user_id: "f06c3c27-5862-4332-96f2-d0f1e62bf9cc",
  date: "2025-08-28 19:42:42.084+00",
  description: "Gastei 600 numa compra parcelada de 600 reais",
  amount: "50.00",
  type: "expense",
  category: "lazer",
  subcategory: null,
  payment_method: null,
  status: "completed",
  notes: null,
  tags: null,
  product_id: null,
  is_installment: true,
  installment_info: "{\"nextDueDate\": \"2025-09-28T19:42:42.084Z\", \"totalAmount\": 600, \"remainingAmount\": 550, \"installmentAmount\": 50, \"totalInstallments\": 12, \"currentInstallment\": 1}"
};

// Função de conversão (copiada do código)
function convertTransactionFromSupabase(data) {
  console.log('🔄 convertTransactionFromSupabase - Dados brutos:', {
    id: data.id,
    description: data.description,
    is_installment: data.is_installment,
    installment_info: data.installment_info,
    has_installment_fields: 'is_installment' in data && 'installment_info' in data
  });

  // Tratar campos de parcelamento com segurança
  let installmentInfo = undefined;
  if (data.installment_info) {
    try {
      installmentInfo = JSON.parse(data.installment_info);
      console.log('✅ installment_info parseado com sucesso:', installmentInfo);
    } catch (error) {
      console.warn('⚠️ Erro ao fazer parse do installment_info:', error);
      console.warn('⚠️ Valor original:', data.installment_info);
      installmentInfo = undefined;
    }
  } else {
    console.log('⚠️ installment_info é null/undefined');
  }

  const convertedTransaction = {
    id: data.id,
    date: new Date(data.date),
    description: data.description,
    amount: parseFloat(data.amount) || 0,
    type: data.type,
    category: data.category,
    subcategory: data.subcategory,
    paymentMethod: data.payment_method,
    status: data.status,
    notes: data.notes,
    tags: data.tags || [],
    // Campos para compras parceladas
    isInstallment: Boolean(data.is_installment),
    installmentInfo
  };

  console.log('✅ Transação convertida:', {
    id: convertedTransaction.id,
    description: convertedTransaction.description,
    isInstallment: convertedTransaction.isInstallment,
    installmentInfo: convertedTransaction.installmentInfo,
    isInstallmentTransaction: convertedTransaction.isInstallment && convertedTransaction.installmentInfo
  });

  return convertedTransaction;
}

// Função de verificação (copiada do utils.ts)
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Teste 1: Converter dados do Supabase
console.log('1️⃣ Convertendo dados do Supabase:');
const convertedTransaction = convertTransactionFromSupabase(supabaseData);

// Teste 2: Verificar se é uma transação parcelada
console.log('\n2️⃣ Verificando se é transação parcelada:');
const isInstallment = isInstallmentTransaction(convertedTransaction);
console.log('✅ É transação parcelada?', isInstallment);

// Teste 3: Verificar campos específicos
console.log('\n3️⃣ Verificando campos específicos:');
console.log('✅ isInstallment:', convertedTransaction.isInstallment, typeof convertedTransaction.isInstallment);
console.log('✅ installmentInfo:', convertedTransaction.installmentInfo, typeof convertedTransaction.installmentInfo);
console.log('✅ installmentInfo !== null:', convertedTransaction.installmentInfo !== null);
console.log('✅ installmentInfo !== undefined:', convertedTransaction.installmentInfo !== undefined);
console.log('✅ installmentInfo !== false:', convertedTransaction.installmentInfo !== false);
console.log('✅ installmentInfo !== 0:', convertedTransaction.installmentInfo !== 0);
console.log('✅ installmentInfo !== "":', convertedTransaction.installmentInfo !== "");

// Teste 4: Verificar conteúdo do installmentInfo
if (convertedTransaction.installmentInfo) {
  console.log('\n4️⃣ Verificando conteúdo do installmentInfo:');
  console.log('✅ Chaves:', Object.keys(convertedTransaction.installmentInfo));
  console.log('✅ totalAmount:', convertedTransaction.installmentInfo.totalAmount);
  console.log('✅ totalInstallments:', convertedTransaction.installmentInfo.totalInstallments);
  console.log('✅ currentInstallment:', convertedTransaction.installmentInfo.currentInstallment);
  console.log('✅ installmentAmount:', convertedTransaction.installmentInfo.installmentAmount);
  console.log('✅ remainingAmount:', convertedTransaction.installmentInfo.remainingAmount);
  console.log('✅ nextDueDate:', convertedTransaction.installmentInfo.nextDueDate);
}

// Teste 5: Simular filtro de transações parceladas
console.log('\n5️⃣ Simulando filtro de transações parceladas:');
const transactions = [convertedTransaction];
const installmentTransactions = transactions.filter(isInstallmentTransaction);
console.log('✅ Total de transações:', transactions.length);
console.log('✅ Transações parceladas encontradas:', installmentTransactions.length);

if (installmentTransactions.length > 0) {
  console.log('🎉 SUCESSO: Transação parcelada encontrada!');
  console.log('✅ Transação:', {
    id: installmentTransactions[0].id,
    description: installmentTransactions[0].description,
    amount: installmentTransactions[0].amount,
    installmentInfo: installmentTransactions[0].installmentInfo
  });
} else {
  console.log('❌ PROBLEMA: Nenhuma transação parcelada encontrada!');
  console.log('Isso indica que a função isInstallmentTransaction está falhando.');
}

// Teste 6: Verificar se o problema está na condição
console.log('\n6️⃣ Verificando condição da função isInstallmentTransaction:');
const condition1 = convertedTransaction.isInstallment;
const condition2 = convertedTransaction.installmentInfo;
const condition3 = condition1 && condition2;

console.log('✅ condition1 (isInstallment):', condition1);
console.log('✅ condition2 (installmentInfo):', condition2);
console.log('✅ condition3 (condition1 && condition2):', condition3);

console.log('\n🏁 Teste concluído!'); 