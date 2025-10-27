// Script para verificar se uma dívida específica ainda existe no banco
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificDebt() {
  try {
    const debtId = '20762c21-b98a-4c76-ab06-f20a3fff1f4f';
    const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    console.log('🔍 Verificando se a dívida existe no banco...');
    console.log('Debt ID:', debtId);
    console.log('User ID:', userId);
    
    // Verificar se a dívida específica existe
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('id', debtId);
    
    if (error) {
      console.log('❌ Erro na consulta:', error);
    } else {
      console.log('📊 Resultado da consulta:');
      console.log('Total de registros encontrados:', data.length);
      if (data.length > 0) {
        console.log('✅ Dívida ainda existe no banco:', {
          id: data[0].id,
          user_id: data[0].user_id,
          creditor_name: data[0].creditor_name,
          status: data[0].status,
          created_at: data[0].created_at
        });
      } else {
        console.log('❌ Dívida não encontrada no banco de dados (foi deletada com sucesso)');
      }
    }
    
    // Verificar todas as dívidas do usuário
    console.log('\n🔍 Verificando todas as dívidas do usuário...');
    const { data: allDebts, error: allError } = await supabase
      .from('debts')
      .select('id, creditor_name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.log('❌ Erro ao buscar todas as dívidas:', allError);
    } else {
      console.log('📊 Total de dívidas do usuário:', allDebts.length);
      allDebts.forEach((debt, index) => {
        console.log(`${index + 1}. ID: ${debt.id} | Credor: ${debt.creditor_name} | Status: ${debt.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkSpecificDebt();