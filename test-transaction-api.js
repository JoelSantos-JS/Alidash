// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTransactionCreation() {
  console.log('🔍 Testando criação de transação...');
  
  try {
    // 1. Buscar um usuário existente
    console.log('1. Buscando usuário...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Nenhum usuário encontrado');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ Usuário encontrado:', userId);
    
    // 2. Simular transação normal
    console.log('\n2. Testando transação normal...');
    const normalTransaction = {
      user_id: userId,
      date: new Date().toISOString(),
      description: 'Teste de transação normal',
      amount: 50.00,
      type: 'expense',
      category: 'alimentação',
      payment_method: 'pix',
      status: 'completed',
      is_installment: false,
      installment_info: null
    };
    
    const { data: normalResult, error: normalError } = await supabase
      .from('transactions')
      .insert(normalTransaction)
      .select()
      .single();
    
    if (normalError) {
      console.error('❌ Erro na transação normal:', normalError);
    } else {
      console.log('✅ Transação normal criada:', normalResult.id);
      await supabase.from('transactions').delete().eq('id', normalResult.id);
    }
    
    // 3. Simular transação parcelada
    console.log('\n3. Testando transação parcelada...');
    const installmentTransaction = {
      user_id: userId,
      date: new Date().toISOString(),
      description: 'Teste de transação parcelada',
      amount: 1200.00,
      type: 'expense',
      category: 'cartão',
      payment_method: 'credit_card',
      status: 'completed',
      is_installment: true,
      installment_info: JSON.stringify({
        totalAmount: 1200.00,
        totalInstallments: 12,
        currentInstallment: 1,
        installmentAmount: 100.00,
        remainingAmount: 1100.00,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    };
    
    const { data: installmentResult, error: installmentError } = await supabase
      .from('transactions')
      .insert(installmentTransaction)
      .select()
      .single();
    
    if (installmentError) {
      console.error('❌ Erro na transação parcelada:', installmentError);
      console.error('Detalhes:', {
        code: installmentError.code,
        message: installmentError.message,
        details: installmentError.details,
        hint: installmentError.hint
      });
    } else {
      console.log('✅ Transação parcelada criada:', installmentResult.id);
      await supabase.from('transactions').delete().eq('id', installmentResult.id);
    }
    
    // 4. Testar com dados exatamente como o frontend envia
    console.log('\n4. Testando com dados do frontend...');
    const frontendTransaction = {
      user_id: userId,
      date: new Date().toISOString(),
      description: 'Teste do frontend',
      amount: 100.00,
      type: 'expense',
      category: 'teste',
      subcategory: null,
      paymentMethod: 'pix',
      status: 'completed',
      notes: null,
      tags: [],
      productId: null,
      isInstallment: false,
      installmentInfo: null
    };
    
    // Converter para formato do Supabase
    const supabaseTransaction = {
      user_id: frontendTransaction.user_id,
      date: frontendTransaction.date,
      description: frontendTransaction.description,
      amount: frontendTransaction.amount,
      type: frontendTransaction.type,
      category: frontendTransaction.category,
      subcategory: frontendTransaction.subcategory,
      payment_method: frontendTransaction.paymentMethod,
      status: frontendTransaction.status,
      notes: frontendTransaction.notes,
      tags: frontendTransaction.tags,
      product_id: frontendTransaction.productId,
      is_installment: frontendTransaction.isInstallment || false,
      installment_info: frontendTransaction.installmentInfo ? JSON.stringify(frontendTransaction.installmentInfo) : null
    };
    
    console.log('📝 Dados convertidos:', {
      is_installment: supabaseTransaction.is_installment,
      installment_info: supabaseTransaction.installment_info
    });
    
    const { data: frontendResult, error: frontendError } = await supabase
      .from('transactions')
      .insert(supabaseTransaction)
      .select()
      .single();
    
    if (frontendError) {
      console.error('❌ Erro com dados do frontend:', frontendError);
      console.error('Detalhes:', {
        code: frontendError.code,
        message: frontendError.message,
        details: frontendError.details,
        hint: frontendError.hint
      });
    } else {
      console.log('✅ Transação do frontend criada:', frontendResult.id);
      await supabase.from('transactions').delete().eq('id', frontendResult.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testTransactionCreation()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 