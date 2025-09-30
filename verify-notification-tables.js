// Script para verificar se as tabelas de notificação existem no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando variáveis de ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNotificationTables() {
  console.log('🔍 Verificando tabelas de notificação no Supabase...\n');

  const tablesToCheck = [
    'notification_preferences',
    'push_subscriptions', 
    'notification_logs'
  ];

  const results = {};

  for (const tableName of tablesToCheck) {
    try {
      console.log(`📋 Verificando tabela: ${tableName}`);
      
      // Tentar fazer uma consulta simples para verificar se a tabela existe
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Código de erro para "relation does not exist"
          results[tableName] = { exists: false, error: 'Tabela não existe' };
          console.log(`   ❌ Tabela ${tableName} NÃO existe`);
        } else {
          results[tableName] = { exists: false, error: error.message };
          console.log(`   ⚠️  Erro ao verificar ${tableName}: ${error.message}`);
        }
      } else {
        results[tableName] = { exists: true, error: null };
        console.log(`   ✅ Tabela ${tableName} existe`);
      }
    } catch (err) {
      results[tableName] = { exists: false, error: err.message };
      console.log(`   ❌ Erro ao verificar ${tableName}: ${err.message}`);
    }
  }

  console.log('\n📊 Resumo da verificação:');
  console.log('================================');
  
  let allTablesExist = true;
  for (const [tableName, result] of Object.entries(results)) {
    const status = result.exists ? '✅ EXISTE' : '❌ NÃO EXISTE';
    console.log(`${tableName}: ${status}`);
    if (!result.exists) {
      allTablesExist = false;
      console.log(`   Erro: ${result.error}`);
    }
  }

  console.log('\n🎯 Próximos passos:');
  if (allTablesExist) {
    console.log('✅ Todas as tabelas existem! O banco está configurado corretamente.');
    console.log('📝 Próximo passo: Configurar variáveis VAPID para push notifications');
  } else {
    console.log('❌ Algumas tabelas estão faltando.');
    console.log('📝 Execute o script SQL create-notification-tables.sql no Supabase SQL Editor');
    console.log('📍 Caminho do arquivo: create-notification-tables.sql');
  }

  return allTablesExist;
}

// Executar verificação
verifyNotificationTables()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro durante verificação:', error);
    process.exit(1);
  });