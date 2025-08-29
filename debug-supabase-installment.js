/**
 * Debug Script: Test Supabase Query for Installment Info
 * This script tests the direct Supabase query to see why installment_info is null
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Configuração do Supabase não encontrada!');
  console.log('Certifique-se de que as variáveis de ambiente estão definidas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInstallmentInfo() {
  try {
    console.log('🔍 Testando query direta para transação específica...');
    
    // Query específica para a transação do usuário
    const transactionId = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';
    
    console.log(`\n1️⃣ Buscando transação por ID: ${transactionId}`);
    const { data: specificTransaction, error: specificError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    
    if (specificError) {
      console.error('❌ Erro ao buscar transação específica:', specificError);
    } else {
      console.log('✅ Transação encontrada:');
      console.log(JSON.stringify(specificTransaction, null, 2));
      console.log('\n🔍 Análise dos campos:');
      console.log('- ID:', specificTransaction?.id);
      console.log('- Description:', specificTransaction?.description);
      console.log('- is_installment:', specificTransaction?.is_installment);
      console.log('- installment_info:', specificTransaction?.installment_info);
      console.log('- installment_info type:', typeof specificTransaction?.installment_info);
      console.log('- installment_info is null:', specificTransaction?.installment_info === null);
    }
    
    console.log('\n2️⃣ Buscando todas as transações com parcelamento...');
    const { data: allInstallments, error: allError } = await supabase
      .from('transactions')
      .select('id, description, is_installment, installment_info')
      .eq('is_installment', true);
    
    if (allError) {
      console.error('❌ Erro ao buscar transações parceladas:', allError);
    } else {
      console.log(`✅ Encontradas ${allInstallments?.length || 0} transações parceladas:`);
      allInstallments?.forEach((tx, index) => {
        console.log(`\n  ${index + 1}. ${tx.description}`);
        console.log(`     - ID: ${tx.id}`);
        console.log(`     - is_installment: ${tx.is_installment}`);
        console.log(`     - installment_info: ${tx.installment_info}`);
        console.log(`     - installment_info type: ${typeof tx.installment_info}`);
      });
    }
    
    console.log('\n3️⃣ Testando query com cast explícito...');
    const { data: castData, error: castError } = await supabase
      .from('transactions')
      .select('id, description, is_installment, installment_info::text as installment_info_text')
      .eq('id', transactionId)
      .single();
    
    if (castError) {
      console.error('❌ Erro com cast explícito:', castError);
    } else {
      console.log('✅ Resultado com cast para text:');
      console.log('- installment_info_text:', castData?.installment_info_text);
      console.log('- installment_info_text type:', typeof castData?.installment_info_text);
    }
    
    console.log('\n4️⃣ Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'transactions')
      .in('column_name', ['is_installment', 'installment_info']);
    
    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError);
    } else {
      console.log('✅ Estrutura dos campos de parcelamento:');
      tableInfo?.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    console.log('\n5️⃣ Testando RLS (Row Level Security)...');
    const { data: rlsTest, error: rlsError } = await supabase
      .rpc('check_transaction_access', { transaction_id: transactionId });
    
    if (rlsError) {
      console.log('⚠️ RLS function não encontrada (normal):', rlsError.message);
    } else {
      console.log('✅ RLS test result:', rlsTest);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugInstallmentInfo()
  .then(() => {
    console.log('\n✅ Debug concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });