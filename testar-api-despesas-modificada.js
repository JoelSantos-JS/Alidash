require('dotenv').config();

async function testarAPIDespesas() {
  console.log('🧪 TESTANDO API DE DESPESAS MODIFICADA\n');

  try {
    // Testar com os dois user_ids que têm transações parceladas
    const userIds = [
      '4a32dbb0-4fe8-4d1c-be21-97d402b41b27',
      'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b'
    ];

    for (const userId of userIds) {
      console.log(`🔍 Testando com user_id: ${userId}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/expenses/get?user_id=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ API retornou ${data.expenses?.length || 0} despesas`);
          
          if (data.expenses && data.expenses.length > 0) {
            data.expenses.forEach((exp, index) => {
              const isInstallment = exp.is_installment ? ' (PARCELADA)' : '';
              console.log(`      ${index + 1}. ${exp.description} - R$ ${exp.amount}${isInstallment}`);
              
              if (exp.installment_info) {
                console.log(`         📊 Parcela ${exp.installment_info.currentInstallment}/${exp.installment_info.totalInstallments}`);
              }
            });
          } else {
            console.log('   ⚠️ Nenhuma despesa retornada pela API!');
          }
        } else {
          console.log(`   ❌ Erro na API: ${response.status}`);
          const errorText = await response.text();
          console.log(`   Detalhes: ${errorText}`);
        }
      } catch (apiError) {
        console.log(`   ❌ Erro ao chamar API: ${apiError.message}`);
      }
      
      console.log(''); // Linha em branco
    }

    console.log('🎯 RESULTADO ESPERADO:');
    console.log('   - Cada user_id deve retornar pelo menos 1 transação parcelada');
    console.log('   - As transações parceladas devem aparecer marcadas como (PARCELADA)');
    console.log('   - Deve mostrar informações das parcelas (ex: 1/12)');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testarAPIDespesas();