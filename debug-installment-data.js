// Script para debugar dados de transações parceladas
console.log('🔍 Debugando dados de transações parceladas...\n');

// Simular dados reais do Supabase (baseado no que você mostrou)
const mockSupabaseData = [
  {
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
  },
  {
    id: "6157ba34-d3bb-41ed-9062-7a0abfd1dalc",
    user_id: "f06c3c27-5862-4332-96f2-d0f1e62bf9cc",
    date: "2025-08-28 19:43:20.351+00",
    description: "Gastei 300 parcelado em 3x",
    amount: "1.00",
    type: "expense",
    category: "outros",
    subcategory: null,
    payment_method: null,
    status: "completed",
    notes: null,
    tags: null,
    product_id: null,
    is_installment: true,
    installment_info: "{\"nextDueDate\": \"2025-09-28T19:43:20.351Z\", \"totalAmount\": 300, \"remainingAmount\": 200, \"installmentAmount\": 100, \"totalInstallments\": 3, \"currentInstallment\": 1}"
  }
];

// Função de conversão (copiada do código)
function convertTransactionFromSupabase(data) {
  console.log('🔄 Convertendo transação:', {
    id: data.id,
    description: data.description,
    is_installment: data.is_installment,
    installment_info: data.installment_info
  });

  let installmentInfo = undefined;
  if (data.installment_info) {
    try {
      installmentInfo = JSON.parse(data.installment_info);
      console.log('✅ installment_info parseado:', installmentInfo);
    } catch (error) {
      console.warn('⚠️ Erro ao fazer parse:', error);
      installmentInfo = undefined;
    }
  }

  return {
    id: data.id,
    date: new Date(data.date),
    description: data.description,
    amount: parseFloat(data.amount),
    type: data.type,
    category: data.category,
    subcategory: data.subcategory,
    paymentMethod: data.payment_method,
    status: data.status,
    notes: data.notes,
    tags: data.tags || [],
    isInstallment: Boolean(data.is_installment),
    installmentInfo
  };
}

// Função de verificação (copiada do utils.ts)
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Teste 1: Converter dados do Supabase
console.log('1️⃣ Convertendo dados do Supabase:');
const convertedTransactions = mockSupabaseData.map(convertTransactionFromSupabase);

// Teste 2: Verificar transações parceladas
console.log('\n2️⃣ Verificando transações parceladas:');
const installmentTransactions = convertedTransactions.filter(isInstallmentTransaction);

console.log('📊 Resumo:');
console.log('  Total de transações:', convertedTransactions.length);
console.log('  Transações parceladas:', installmentTransactions.length);

// Teste 3: Verificar cada transação
convertedTransactions.forEach((transaction, index) => {
  console.log(`\nTransação ${index + 1}:`);
  console.log('  ID:', transaction.id);
  console.log('  Descrição:', transaction.description);
  console.log('  isInstallment:', transaction.isInstallment);
  console.log('  installmentInfo:', transaction.installmentInfo ? 'presente' : 'ausente');
  console.log('  É parcelada?', isInstallmentTransaction(transaction) ? 'SIM' : 'NÃO');
});

// Teste 4: Simular InstallmentManager
console.log('\n3️⃣ Simulando InstallmentManager:');
console.log('🔍 InstallmentManager - Transações recebidas:', {
  total: convertedTransactions.length,
  transactions: convertedTransactions.map(t => ({
    id: t.id,
    description: t.description,
    isInstallment: t.isInstallment,
    installmentInfo: t.installmentInfo ? 'presente' : 'ausente'
  }))
});

console.log('🔍 InstallmentManager - Transações parceladas filtradas:', {
  total: installmentTransactions.length,
  installmentTransactions: installmentTransactions.map(t => ({
    id: t.id,
    description: t.description,
    isInstallment: t.isInstallment,
    installmentInfo: t.installmentInfo
  }))
});

// Teste 5: Verificar se o problema está na condição
console.log('\n4️⃣ Verificando condição isInstallmentTransaction:');
convertedTransactions.forEach((transaction, index) => {
  const condition1 = transaction.isInstallment;
  const condition2 = transaction.installmentInfo;
  const result = condition1 && condition2;
  
  console.log(`Transação ${index + 1}:`);
  console.log('  isInstallment:', condition1);
  console.log('  installmentInfo:', condition2 ? 'presente' : 'ausente');
  console.log('  Resultado:', result);
});

// Teste 6: Verificar se há transações com isInstallment=true mas sem installmentInfo
console.log('\n5️⃣ Verificando transações com isInstallment=true mas sem installmentInfo:');
const problematicTransactions = convertedTransactions.filter(t => 
  t.isInstallment && !t.installmentInfo
);

if (problematicTransactions.length > 0) {
  console.log('❌ PROBLEMA: Transações com isInstallment=true mas sem installmentInfo:');
  problematicTransactions.forEach(t => {
    console.log('  -', t.description);
  });
} else {
  console.log('✅ Nenhuma transação problemática encontrada');
}

console.log('\n🏁 Debug concluído!');
console.log('\n📋 Resumo:');
console.log('- Se installmentTransactions.length > 0: O problema está na renderização');
console.log('- Se installmentTransactions.length = 0: O problema está na conversão/filtro');
console.log('- Verifique os logs no console do navegador para comparar'); 