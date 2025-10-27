const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para simular o que o frontend faz
function isInstallmentTransaction(transaction) {
  return Boolean(transaction.isInstallment && transaction.installmentInfo);
}

async function testarMenuParcelas() {
  console.log('🧪 === TESTANDO MENU DE COMPRAS PARCELADAS ===\n');

  try {
    const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';

    // 1. Buscar todas as transações como o frontend faz
    console.log('1️⃣ Buscando transações como o frontend...');
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return;
    }

    console.log(`✅ Total de transações encontradas: ${transactions.length}`);

    // 2. Converter transações como o frontend faz
    console.log('\n2️⃣ Convertendo transações...');
    const convertedTransactions = transactions.map((t) => ({
      ...t,
      date: new Date(t.date),
      amount: parseFloat(t.amount),
      isInstallment: Boolean(t.is_installment),
      installmentInfo: t.installment_info ? 
        (typeof t.installment_info === 'string' ? JSON.parse(t.installment_info) : t.installment_info) : 
        null
    }));

    console.log('✅ Transações convertidas com sucesso');

    // 3. Filtrar transações parceladas
    console.log('\n3️⃣ Filtrando transações parceladas...');
    const installmentTransactions = convertedTransactions.filter(isInstallmentTransaction);
    
    console.log(`✅ Transações parceladas encontradas: ${installmentTransactions.length}`);

    if (installmentTransactions.length > 0) {
      console.log('\n📋 Detalhes das transações parceladas:');
      installmentTransactions.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.description}`);
        console.log(`      Valor: R$ ${t.amount}`);
        console.log(`      Data: ${t.date.toLocaleDateString('pt-BR')}`);
        console.log(`      Status: ${t.status}`);
        console.log(`      É Parcelada: ${t.isInstallment}`);
        console.log(`      Info Parcelas:`, t.installmentInfo);
        console.log('');
      });

      // 4. Simular cálculos do InstallmentManager
      console.log('4️⃣ Simulando cálculos do InstallmentManager...');
      
      const totalParcelado = installmentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const pendentes = installmentTransactions.filter(t => t.status === 'pending');
      const completadas = installmentTransactions.filter(t => t.status === 'completed');
      
      console.log(`   💰 Total Parcelado: R$ ${totalParcelado.toFixed(2)}`);
      console.log(`   ⏳ Pendentes: ${pendentes.length} (R$ ${pendentes.reduce((sum, t) => sum + t.amount, 0).toFixed(2)})`);
      console.log(`   ✅ Completadas: ${completadas.length} (R$ ${completadas.reduce((sum, t) => sum + t.amount, 0).toFixed(2)})`);
    }

    // 5. Testar API endpoint
    console.log('\n5️⃣ Testando endpoint da API...');
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log(`   Período: ${startDate.toISOString()} até ${endDate.toISOString()}`);

    // Simular chamada da API
    const apiUrl = `http://localhost:3000/api/transactions/get?user_id=${userId}&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
    console.log(`   URL da API: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const apiResult = await response.json();
        console.log(`   ✅ API retornou ${apiResult.transactions.length} transações`);
        
        const apiInstallments = apiResult.transactions.filter(t => 
          Boolean(t.isInstallment && t.installmentInfo)
        );
        console.log(`   ✅ Transações parceladas via API: ${apiInstallments.length}`);
      } else {
        console.log(`   ❌ API retornou erro: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`   ⚠️ Erro ao testar API (servidor pode não estar rodando): ${apiError.message}`);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testarMenuParcelas();