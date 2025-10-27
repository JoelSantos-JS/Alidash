const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzIzNDEsImV4cCI6MjA3MTQ0ODM0MX0.qFHcONpGQVAwWfMhCdh2kX5ZNBk5qtNM1M7_GS-LXZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function obterUserId() {
  console.log('🔍 Procurando user_id válido...');
  
  try {
    // Tentar buscar na tabela de usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!usersError && users && users.length > 0) {
      console.log('✅ User ID encontrado na tabela users:', users[0].id);
      return users[0].id;
    }

    // Se não encontrar, tentar buscar em outras tabelas que podem ter user_id
    const tables = ['products', 'sales', 'dreams', 'bets', 'revenues', 'expenses', 'debts', 'goals'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('user_id')
          .limit(1);

        if (!error && data && data.length > 0 && data[0].user_id) {
          console.log(`✅ User ID encontrado na tabela ${table}:`, data[0].user_id);
          return data[0].user_id;
        }
      } catch (e) {
        console.log(`⚠️ Tabela ${table} não existe ou não tem user_id`);
      }
    }

    // Se não encontrar nenhum, criar um UUID válido
    const { v4: uuidv4 } = require('crypto');
    const newUserId = crypto.randomUUID();
    console.log('🆕 Criando novo UUID:', newUserId);
    return newUserId;
    
  } catch (error) {
    console.error('❌ Erro ao obter user_id:', error);
    // Fallback: criar UUID manualmente
    const newUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    console.log('🆕 UUID gerado manualmente:', newUserId);
    return newUserId;
  }
}

obterUserId().then(userId => {
  console.log('\n📋 Use este user_id:', userId);
});