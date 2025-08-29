// Script para testar campos de parcelamento no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInstallmentFields() {
  console.log('🔍 Testando campos de parcelamento no Supabase...\n');

  try {
    // 1. Verificar se a tabela transactions existe
    console.log('1️⃣ Verificando se a tabela transactions existe...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'transactions');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
      return;
    }

    if (tables.length === 0) {
      console.error('❌ Tabela transactions não existe!');
      return;
    }

    console.log('✅ Tabela transactions existe');

    // 2. Verificar campos da tabela
    console.log('\n2️⃣ Verificando campos da tabela transactions...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'transactions')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('📊 Campos encontrados:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Verificar especificamente os campos de parcelamento
    console.log('\n3️⃣ Verificando campos de parcelamento...');
    const installmentFields = columns.filter(col => 
      col.column_name === 'is_installment' || col.column_name === 'installment_info'
    );

    if (installmentFields.length === 0) {
      console.log('❌ Campos de parcelamento NÃO EXISTEM!');
      console.log('Campos necessários:');
      console.log('  - is_installment (BOOLEAN)');
      console.log('  - installment_info (JSONB)');
      console.log('\nExecute o script SQL para adicionar os campos:');
      console.log('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE;');
      console.log('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_info JSONB;');
      return;
    }

    console.log('✅ Campos de parcelamento encontrados:');
    installmentFields.forEach(field => {
      console.log(`  - ${field.column_name}: ${field.data_type}`);
    });

    // 4. Verificar dados existentes
    console.log('\n4️⃣ Verificando dados existentes...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, description, amount, is_installment, installment_info')
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactionsError) {
      console.error('❌ Erro ao buscar transações:', transactionsError);
      return;
    }

    console.log(`📊 Transações encontradas: ${transactions.length}`);
    transactions.forEach((t, index) => {
      console.log(`\nTransação ${index + 1}:`);
      console.log(`  ID: ${t.id}`);
      console.log(`  Descrição: ${t.description}`);
      console.log(`  Valor: ${t.amount}`);
      console.log(`  is_installment: ${t.is_installment}`);
      console.log(`  installment_info: ${t.installment_info ? 'presente' : 'ausente'}`);
      
      if (t.installment_info) {
        try {
          const parsed = JSON.parse(t.installment_info);
          console.log(`  installment_info parseado:`, parsed);
        } catch (error) {
          console.log(`  ❌ Erro ao fazer parse do installment_info:`, error.message);
        }
      }
    });

    // 5. Contar transações parceladas
    console.log('\n5️⃣ Contando transações parceladas...');
    const { data: installmentCount, error: countError } = await supabase
      .from('transactions')
      .select('is_installment', { count: 'exact' });

    if (countError) {
      console.error('❌ Erro ao contar transações:', countError);
      return;
    }

    const total = installmentCount.length;
    const parceladas = installmentCount.filter(t => t.is_installment).length;
    const naoParceladas = total - parceladas;

    console.log(`📊 Resumo:`);
    console.log(`  Total: ${total}`);
    console.log(`  Parceladas: ${parceladas}`);
    console.log(`  Não parceladas: ${naoParceladas}`);

    if (parceladas === 0) {
      console.log('\n⚠️ Nenhuma transação parcelada encontrada!');
      console.log('Isso pode indicar que:');
      console.log('1. Os campos existem mas não há dados');
      console.log('2. As transações não estão sendo salvas corretamente');
      console.log('3. O campo is_installment não está sendo definido como true');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o teste
testInstallmentFields().then(() => {
  console.log('\n🏁 Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 