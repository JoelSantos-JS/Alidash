// Script para verificar transações de um usuário específico
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

// Inicializar Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email do usuário a verificar
const userEmail = 'davi10@gmail.com';

async function checkUserTransactions() {
  console.log(`🔍 Verificando transações do usuário: ${userEmail}\n`);
  
  try {
    // 1. Primeiro, buscar o ID do usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, firebase_uid')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error(`❌ Erro ao buscar usuário ${userEmail}:`, userError.message);
      return;
    }
    
    if (!userData) {
      console.log(`❌ Usuário ${userEmail} não encontrado no Supabase`);
      return;
    }
    
    console.log(`✅ Usuário encontrado:`);
    console.log(`   ID: ${userData.id}`);
    console.log(`   Firebase UID: ${userData.firebase_uid || 'N/A'}`);
    
    // 2. Buscar transações pelo ID do usuário
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userData.id);
    
    if (transactionsError) {
      console.error('❌ Erro ao buscar transações:', transactionsError.message);
      return;
    }
    
    console.log(`\n📊 Total de transações encontradas: ${transactions?.length || 0}`);
    
    if (transactions && transactions.length > 0) {
      console.log('\n📝 Últimas 5 transações:');
      
      // Mostrar apenas as 5 últimas transações (ou todas se forem menos de 5)
      const recentTransactions = transactions.slice(-5);
      
      recentTransactions.forEach((transaction, index) => {
        console.log(`\n${index + 1}. ID: ${transaction.id}`);
        console.log(`   Descrição: ${transaction.description || 'N/A'}`);
        console.log(`   Valor: R$ ${parseFloat(transaction.amount).toFixed(2)}`);
        console.log(`   Data: ${transaction.date}`);
        console.log(`   Tipo: ${transaction.type}`);
        
        // Verificar se tem informações de parcelamento
        if (transaction.is_installment) {
          let installmentInfo;
          try {
            installmentInfo = transaction.installment_info ? 
              (typeof transaction.installment_info === 'string' ? 
                JSON.parse(transaction.installment_info) : 
                transaction.installment_info) : 
              null;
            
            if (installmentInfo) {
              console.log(`   Parcela: ${installmentInfo.currentInstallment}/${installmentInfo.totalInstallments}`);
            }
          } catch (e) {
            console.log(`   Erro ao processar informações de parcelamento: ${e.message}`);
          }
        }
      });
    } else {
      console.log('❌ Nenhuma transação encontrada para este usuário');
    }
    
    // 3. Verificar se há transações pelo Firebase UID (fallback)
    if (userData.firebase_uid && (!transactions || transactions.length === 0)) {
      console.log('\n🔍 Verificando transações pelo Firebase UID...');
      
      const { data: fbTransactions, error: fbTransactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.firebase_uid);
      
      if (fbTransactionsError) {
        console.error('❌ Erro ao buscar transações pelo Firebase UID:', fbTransactionsError.message);
        return;
      }
      
      console.log(`📊 Total de transações encontradas pelo Firebase UID: ${fbTransactions?.length || 0}`);
      
      if (fbTransactions && fbTransactions.length > 0) {
        console.log('\n📝 Últimas 5 transações pelo Firebase UID:');
        
        const recentFbTransactions = fbTransactions.slice(-5);
        
        recentFbTransactions.forEach((transaction, index) => {
          console.log(`\n${index + 1}. ID: ${transaction.id}`);
          console.log(`   Descrição: ${transaction.description || 'N/A'}`);
          console.log(`   Valor: R$ ${parseFloat(transaction.amount).toFixed(2)}`);
          console.log(`   Data: ${transaction.date}`);
          console.log(`   Tipo: ${transaction.type}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
  }
}

// Executar verificação
checkUserTransactions();