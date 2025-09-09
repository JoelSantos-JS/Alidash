const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserMapping() {
  console.log('🔍 Debugando mapeamento de usuários...');
  
  try {
    // 1. Buscar todos os usuários
    console.log('\n👥 Usuários na tabela users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. Email: ${user.email}`);
      console.log(`      Supabase ID: ${user.id}`);
      console.log(`      Firebase UID: ${user.firebase_uid || 'N/A'}`);
      console.log(`      Nome: ${user.name || 'N/A'}`);
      console.log('');
    });
    
    // 2. Verificar dados pessoais por usuário
    console.log('📊 Dados pessoais por usuário:');
    
    for (const user of users || []) {
      console.log(`\n👤 Usuário: ${user.email} (${user.id})`);
      
      // Verificar dados usando Supabase ID
      const tables = [
        { name: 'personal_incomes', label: 'Receitas' },
        { name: 'personal_expenses', label: 'Gastos' },
        { name: 'personal_budgets', label: 'Orçamentos' },
        { name: 'personal_goals', label: 'Metas' }
      ];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (error) {
            console.log(`   ❌ ${table.label}: Erro - ${error.message}`);
          } else {
            console.log(`   📊 ${table.label}: ${count || 0} registros`);
          }
        } catch (err) {
          console.log(`   💥 ${table.label}: Erro crítico - ${err.message}`);
        }
      }
      
      // Se o usuário tem firebase_uid, verificar dados usando Firebase UID
      if (user.firebase_uid) {
        console.log(`\n   🔍 Verificando com Firebase UID: ${user.firebase_uid}`);
        
        for (const table of tables) {
          try {
            const { count, error } = await supabase
              .from(table.name)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.firebase_uid);
            
            if (error) {
              console.log(`   ❌ ${table.label} (Firebase UID): Erro - ${error.message}`);
            } else {
              console.log(`   📊 ${table.label} (Firebase UID): ${count || 0} registros`);
            }
          } catch (err) {
            console.log(`   💥 ${table.label} (Firebase UID): Erro crítico - ${err.message}`);
          }
        }
      }
    }
    
    // 3. Verificar se há dados órfãos
    console.log('\n🔍 Verificando dados órfãos (sem usuário correspondente):');
    
    const tables = [
      { name: 'personal_incomes', label: 'Receitas' },
      { name: 'personal_expenses', label: 'Gastos' },
      { name: 'personal_budgets', label: 'Orçamentos' },
      { name: 'personal_goals', label: 'Metas' }
    ];
    
    for (const table of tables) {
      try {
        const { data: tableData, error } = await supabase
          .from(table.name)
          .select('user_id')
          .limit(100);
        
        if (error) {
          console.log(`❌ ${table.label}: Erro ao verificar - ${error.message}`);
          continue;
        }
        
        const uniqueUserIds = [...new Set(tableData?.map(row => row.user_id) || [])];
        const validUserIds = users?.map(u => u.id) || [];
        const validFirebaseUids = users?.map(u => u.firebase_uid).filter(Boolean) || [];
        
        console.log(`\n📋 ${table.label}:`);
        console.log(`   Total de user_ids únicos: ${uniqueUserIds.length}`);
        
        uniqueUserIds.forEach(userId => {
          const isValidSupabaseId = validUserIds.includes(userId);
          const isValidFirebaseUid = validFirebaseUids.includes(userId);
          const matchingUser = users?.find(u => u.id === userId || u.firebase_uid === userId);
          
          if (isValidSupabaseId) {
            console.log(`   ✅ ${userId} - Supabase ID válido (${matchingUser?.email})`);
          } else if (isValidFirebaseUid) {
            console.log(`   ✅ ${userId} - Firebase UID válido (${matchingUser?.email})`);
          } else {
            console.log(`   ❌ ${userId} - ID órfão (sem usuário correspondente)`);
          }
        });
        
      } catch (err) {
        console.log(`💥 ${table.label}: Erro crítico - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function fixUserMapping() {
  console.log('\n🔧 Corrigindo mapeamento de usuários...');
  
  try {
    // Buscar usuário joeltere9@gmail.com
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'joeltere9@gmail.com')
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return;
    }
    
    if (!user) {
      console.log('❌ Usuário joeltere9@gmail.com não encontrado');
      return;
    }
    
    console.log('👤 Usuário encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Supabase ID: ${user.id}`);
    console.log(`   Firebase UID: ${user.firebase_uid || 'N/A'}`);
    
    // Se não tem firebase_uid, vamos definir um
    if (!user.firebase_uid) {
      console.log('\n🔧 Definindo Firebase UID para o usuário...');
      
      // Usar o próprio ID do Supabase como Firebase UID para simplificar
      const { error: updateError } = await supabase
        .from('users')
        .update({ firebase_uid: user.id })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar Firebase UID:', updateError);
      } else {
        console.log('✅ Firebase UID definido como:', user.id);
      }
    }
    
    console.log('\n✅ Mapeamento corrigido!');
    console.log('💡 Agora o frontend deve usar o Firebase UID:', user.firebase_uid || user.id);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir mapeamento:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando debug do mapeamento de usuários...');
  
  await debugUserMapping();
  await fixUserMapping();
  
  console.log('\n🏁 Debug concluído!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugUserMapping, fixUserMapping };