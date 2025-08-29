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

// Simular o que a API route faz
async function testApiRoute() {
  console.log('🔍 Testando simulação da API route...');
  
  try {
    // 1. Buscar usuário
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
    
    // 2. Simular dados que vêm do frontend
    const transactionData = {
      id: new Date().getTime().toString(),
      date: new Date(),
      description: 'Teste da API route',
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
    
    console.log('📝 Dados do frontend:', {
      description: transactionData.description,
      amount: transactionData.amount,
      isInstallment: transactionData.isInstallment,
      installmentInfo: transactionData.installmentInfo
    });
    
    // 3. Simular o que o supabaseAdminService.createTransaction faz
    const insertData = {
      user_id: userId,
      date: transactionData.date.toISOString(),
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      subcategory: transactionData.subcategory,
      payment_method: transactionData.paymentMethod,
      status: transactionData.status,
      notes: transactionData.notes,
      tags: transactionData.tags,
      is_installment: transactionData.isInstallment || false,
      installment_info: transactionData.installmentInfo ? JSON.stringify(transactionData.installmentInfo) : null
    };
    
    console.log('📝 Dados para inserção:', {
      is_installment: insertData.is_installment,
      installment_info: insertData.installment_info
    });
    
    // 4. Tentar inserir
    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar transação:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return;
    }
    
    console.log('✅ Transação criada com sucesso:', {
      id: data.id,
      description: data.description,
      is_installment: data.is_installment,
      installment_info: data.installment_info
    });
    
    // 5. Simular conversão de volta
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
      isInstallment: Boolean(data.is_installment),
      installmentInfo: data.installment_info ? JSON.parse(data.installment_info) : null
    };
    
    console.log('✅ Transação convertida:', {
      id: convertedTransaction.id,
      description: convertedTransaction.description,
      isInstallment: convertedTransaction.isInstallment,
      installmentInfo: convertedTransaction.installmentInfo
    });
    
    // Limpar
    await supabase.from('transactions').delete().eq('id', data.id);
    console.log('✅ Transação removida');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testApiRoute()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 