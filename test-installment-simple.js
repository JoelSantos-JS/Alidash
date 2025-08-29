// Teste simples do cálculo de parcelamento
console.log('🧮 Testando cálculo de parcelamento: R$ 600 em 12x\n');

// Função de cálculo (copiada do utils.ts)
function calculateInstallmentInfo(totalAmount, totalInstallments, currentInstallment = 1) {
  const installmentAmount = totalAmount / totalInstallments;
  const remainingAmount = totalAmount - (installmentAmount * (currentInstallment - 1));
  
  return {
    totalAmount,
    totalInstallments,
    currentInstallment,
    installmentAmount: Math.round(installmentAmount * 100) / 100,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
  };
}

// Teste 1: Cálculo básico
console.log('1️⃣ Cálculo básico:');
const installmentInfo = calculateInstallmentInfo(600, 12, 1);
console.log('Primeira parcela:', installmentInfo);
console.log('Valor da parcela:', installmentInfo.installmentAmount);
console.log('Valor restante:', installmentInfo.remainingAmount);

// Teste 2: Todas as parcelas
console.log('\n2️⃣ Todas as 12 parcelas:');
for (let i = 1; i <= 12; i++) {
  const info = calculateInstallmentInfo(600, 12, i);
  console.log(`Parcela ${i}: R$ ${info.installmentAmount.toFixed(2)} | Restante: R$ ${info.remainingAmount.toFixed(2)}`);
}

// Teste 3: Soma total
console.log('\n3️⃣ Verificação da soma:');
let totalCalculated = 0;
for (let i = 1; i <= 12; i++) {
  const info = calculateInstallmentInfo(600, 12, i);
  totalCalculated += info.installmentAmount;
}
console.log('Soma das parcelas:', totalCalculated.toFixed(2));
console.log('Valor original:', 600);
console.log('Diferença:', (totalCalculated - 600).toFixed(2));

// Teste 4: Verificação de arredondamento
console.log('\n4️⃣ Verificação de arredondamento:');
const valorExato = 600 / 12;
console.log('Valor exato por parcela:', valorExato);
console.log('Valor arredondado:', Math.round(valorExato * 100) / 100);

// Teste 5: Cenários com valores que não dividem exatamente
console.log('\n5️⃣ Teste com R$ 100 em 3x:');
for (let i = 1; i <= 3; i++) {
  const info = calculateInstallmentInfo(100, 3, i);
  console.log(`Parcela ${i}: R$ ${info.installmentAmount.toFixed(2)} | Restante: R$ ${info.remainingAmount.toFixed(2)}`);
}

console.log('\n6️⃣ Teste com R$ 1000 em 7x:');
for (let i = 1; i <= 7; i++) {
  const info = calculateInstallmentInfo(1000, 7, i);
  console.log(`Parcela ${i}: R$ ${info.installmentAmount.toFixed(2)} | Restante: R$ ${info.remainingAmount.toFixed(2)}`);
}

// Teste 7: Análise do problema
console.log('\n7️⃣ Análise do problema:');
console.log('R$ 600 ÷ 12 = R$ 50,00 por parcela');
console.log('Mas o sistema está calculando:', installmentInfo.installmentAmount);
console.log('Isso está correto?', installmentInfo.installmentAmount === 50 ? 'SIM' : 'NÃO'); 