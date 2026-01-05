const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigarReceitasParceladas() {
  console.log('🔍 INVESTIGANDO PROBLEMA DAS RECEITAS PARCELADAS');
  console.log('='.repeat(60));

  try {
    // 1. Verificar se existem transações parceladas de receita na tabela transactions
    console.log('\n1️⃣ Verificando transações parceladas de receita na tabela transactions...');
    
    const { data: installmentRevenues, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'revenue')
      .eq('is_installment', true);

    if (installmentError) {
      console.error('❌ Erro ao buscar transações parceladas de receita:', installmentError);
      return;
    }

    console.log(`📊 Transações parceladas de receita encontradas: ${installmentRevenues?.length || 0}`);
    
    if (installmentRevenues && installmentRevenues.length > 0) {
      console.log('\n📋 Detalhes das transações parceladas de receita:');
      installmentRevenues.forEach((transaction, index) => {
        console.log(`   ${index + 1}. ${transaction.description}`);
        console.log(`      - Valor: R$ ${transaction.amount}`);
        console.log(`      - User ID: ${transaction.user_id}`);
        console.log(`      - Parcela: ${transaction.installment_info?.currentInstallment}/${transaction.installment_info?.totalInstallments}`);
        console.log(`      - Data: ${transaction.date}`);
        console.log(`      - ID: ${transaction.id}`);
        console.log('');
      });
    }

    // 2. Verificar receitas normais na tabela revenues
    console.log('\n2️⃣ Verificando receitas normais na tabela revenues...');
    
    const { data: normalRevenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .limit(5);

    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas normais:', revenuesError);
      return;
    }

    console.log(`💰 Receitas normais encontradas: ${normalRevenues?.length || 0}`);
    
    if (normalRevenues && normalRevenues.length > 0) {
      console.log('\n📋 Primeiras 5 receitas normais:');
      normalRevenues.forEach((revenue, index) => {
        console.log(`   ${index + 1}. ${revenue.description} - R$ ${revenue.amount} (${revenue.category})`);
      });
    }

    // 3. Testar API de receitas atual
    console.log('\n3️⃣ Testando API de receitas atual...');
    
    // Pegar um user_id que tenha transações parceladas de receita
    if (installmentRevenues && installmentRevenues.length > 0) {
      const testUserId = installmentRevenues[0].user_id;
      console.log(`🧪 Testando API para user_id: ${testUserId}`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/revenues/get?user_id=${testUserId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API retornou: ${data.revenues?.length || 0} receitas`);
          
          if (data.revenues && data.revenues.length > 0) {
            console.log('📋 Receitas retornadas pela API:');
            data.revenues.forEach((revenue, index) => {
              console.log(`   ${index + 1}. ${revenue.description} - R$ ${revenue.amount}`);
            });
          } else {
            console.log('⚠️ API não retornou nenhuma receita para este usuário');
          }
        } else {
          console.log(`❌ Erro na API: ${response.status}`);
        }
      } catch (apiError) {
        console.log('❌ Erro ao chamar API:', apiError.message);
      }
    }

    // 4. Conclusão e recomendações
    console.log('\n4️⃣ CONCLUSÃO E RECOMENDAÇÕES');
    console.log('='.repeat(40));
    
    if (installmentRevenues && installmentRevenues.length > 0) {
      console.log('🔍 PROBLEMA IDENTIFICADO:');
      console.log(`   - Existem ${installmentRevenues.length} transações parceladas de receita na tabela 'transactions'`);
      console.log('   - A API de receitas busca apenas na tabela "revenues"');
      console.log('   - As transações parceladas de receita não aparecem na aba de receitas');
      console.log('');
      console.log('💡 SOLUÇÃO RECOMENDADA:');
      console.log('   - Modificar /api/revenues/get/route.ts para incluir transações parceladas');
      console.log('   - Buscar na tabela "transactions" onde type = "revenue" e is_installment = true');
      console.log('   - Combinar receitas normais + receitas parceladas em uma única lista');
    } else {
      console.log('✅ Não foram encontradas transações parceladas de receita');
      console.log('   - O problema pode estar em outro lugar');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar investigação
investigarReceitasParceladas();
