// Script para debugar transações parceladas
console.log('🔍 Debugando transações parceladas...\n');

// Simular dados de transações do Supabase
const mockSupabaseTransactions = [
  {
    id: '1',
    date: '2024-01-15T00:00:00Z',
    description: 'Compra de Produto',
    amount: '50.00',
    type: 'expense',
    category: 'Eletrônicos',
    subcategory: null,
    payment_method: 'credit_card',
    status: 'completed',
    notes: null,
    tags: ['parcelado', 'cartão-credito'],
    product_id: null,
    is_installment: true,
    installment_info: '{"totalAmount":600,"totalInstallments":12,"currentInstallment":1,"installmentAmount":50,"remainingAmount":600}'
  },
  {
    id: '2',
    date: '2024-01-15T00:00:00Z',
    description: 'Compra Normal',
    amount: '100.00',
    type: 'expense',
    category: 'Alimentação',
    subcategory: null,
    payment_method: 'pix',
    status: 'completed',
    notes: null,
    tags: [],
    product_id: null,
    is_installment: false,
    installment_info: null
  },
  {
    id: '3',
    date: '2024-01-15T00:00:00Z',
    description: 'Outra Compra Parcelada',
    amount: '33.33',
    type: 'expense',
    category: 'Vestuário',
    subcategory: null,
    payment_method: 'credit_card',
    status: 'pending',
    notes: null,
    tags: ['parcelado'],
    product_id: null,
    is_installment: true,
    installment_info: '{"totalAmount":100,"totalInstallments":3,"currentInstallment":1,"installmentAmount":33.33,"remainingAmount":100}'
  }
];

// Função de conversão (copiada do código)
function convertTransactionFromSupabase(transaction) {
  let installmentInfo = null;
  if (transaction.installment_info) {
    try {
      installmentInfo = JSON.parse(transaction.installment_info);
    } catch (error) {
      console.warn('⚠️ Erro ao fazer parse do installment_info:', error);
      installmentInfo = null;
    }
  }

  return {
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
    tags: transaction.tags || [],
    productId: transaction.product_id,
    isInstallment: Boolean(transaction.is_installment),
    installmentInfo
  };
}

// Função de verificação (copiada do utils.ts)
function isInstallmentTransaction(transaction) {
  return transaction.isInstallment && transaction.installmentInfo;
}

// Teste 1: Converter transações
console.log('1️⃣ Convertendo transações do Supabase:');
const convertedTransactions = mockSupabaseTransactions.map(convertTransactionFromSupabase);

convertedTransactions.forEach((transaction, index) => {
  console.log(`\nTransação ${index + 1}:`);
  console.log('  ID:', transaction.id);
  console.log('  Descrição:', transaction.description);
  console.log('  Valor:', transaction.amount);
  console.log('  isInstallment:', transaction.isInstallment);
  console.log('  installmentInfo:', transaction.installmentInfo);
  console.log('  É parcelada?', isInstallmentTransaction(transaction) ? 'SIM' : 'NÃO');
});

// Teste 2: Filtrar transações parceladas
console.log('\n2️⃣ Filtrando transações parceladas:');
const installmentTransactions = convertedTransactions.filter(isInstallmentTransaction);
console.log('Total de transações:', convertedTransactions.length);
console.log('Transações parceladas encontradas:', installmentTransactions.length);

installmentTransactions.forEach((transaction, index) => {
  console.log(`\nParcela ${index + 1}:`);
  console.log('  Descrição:', transaction.description);
  console.log('  Valor da parcela:', transaction.amount);
  console.log('  Parcela atual:', transaction.installmentInfo.currentInstallment);
  console.log('  Total de parcelas:', transaction.installmentInfo.totalInstallments);
  console.log('  Valor total:', transaction.installmentInfo.totalAmount);
});

// Teste 3: Verificar campos específicos
console.log('\n3️⃣ Verificando campos específicos:');
convertedTransactions.forEach((transaction, index) => {
  console.log(`\nTransação ${index + 1} - Campos de parcelamento:`);
  console.log('  isInstallment (boolean):', transaction.isInstallment, typeof transaction.isInstallment);
  console.log('  installmentInfo (object):', transaction.installmentInfo, typeof transaction.installmentInfo);
  console.log('  installmentInfo !== null:', transaction.installmentInfo !== null);
  console.log('  installmentInfo !== undefined:', transaction.installmentInfo !== undefined);
  console.log('  installmentInfo !== false:', transaction.installmentInfo !== false);
  console.log('  installmentInfo !== 0:', transaction.installmentInfo !== 0);
  console.log('  installmentInfo !== "":', transaction.installmentInfo !== "");
});

// Teste 4: Testar função isInstallmentTransaction com diferentes cenários
console.log('\n4️⃣ Testando função isInstallmentTransaction:');
const testCases = [
  { name: 'Transação parcelada válida', transaction: convertedTransactions[0] },
  { name: 'Transação não parcelada', transaction: convertedTransactions[1] },
  { name: 'Transação com isInstallment=true mas sem installmentInfo', transaction: { isInstallment: true, installmentInfo: null } },
  { name: 'Transação com isInstallment=false mas com installmentInfo', transaction: { isInstallment: false, installmentInfo: { totalAmount: 100 } } },
  { name: 'Transação com isInstallment=true e installmentInfo válido', transaction: { isInstallment: true, installmentInfo: { totalAmount: 100 } } }
];

testCases.forEach((testCase, index) => {
  const result = isInstallmentTransaction(testCase.transaction);
  console.log(`  ${index + 1}. ${testCase.name}: ${result ? 'SIM' : 'NÃO'}`);
});

console.log('\n5️⃣ Resumo:');
console.log('Transações totais:', convertedTransactions.length);
console.log('Transações parceladas:', installmentTransactions.length);
console.log('Transações não parceladas:', convertedTransactions.length - installmentTransactions.length);

if (installmentTransactions.length === 0) {
  console.log('\n❌ PROBLEMA: Nenhuma transação parcelada foi encontrada!');
  console.log('Possíveis causas:');
  console.log('1. Campos is_installment e installment_info não existem na tabela');
  console.log('2. Dados não estão sendo salvos corretamente');
  console.log('3. Conversão está falhando');
  console.log('4. Função isInstallmentTransaction está com problema');
} else {
  console.log('\n✅ SUCESSO: Transações parceladas encontradas!');
} 