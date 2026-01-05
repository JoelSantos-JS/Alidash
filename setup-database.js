// Script para executar comandos SQL no Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables not configured');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🗄️ Configurando banco de dados...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('create-notification-preferences-table.sql', 'utf8');
    
    console.log('📋 Executando script SQL para criar tabela notification_preferences...');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar método alternativo - criar tabela diretamente
      console.log('\n🔄 Tentando método alternativo...');
      
      const { error: createError } = await supabase
        .from('notification_preferences')
        .select('count')
        .limit(1);
        
      if (createError && createError.code === '42P01') {
        console.log('❌ Tabela notification_preferences não existe');
        console.log('📝 Você precisa executar o SQL manualmente no Supabase SQL Editor');
        console.log('📍 Arquivo: create-notification-preferences-table.sql');
        return false;
      }
    } else {
      console.log('✅ Script SQL executado com sucesso!');
    }

    // Verificar se a tabela foi criada
    console.log('\n🔍 Verificando se a tabela foi criada...');
    
    const { data: tableCheck, error: checkError } = await supabase
      .from('notification_preferences')
      .select('count')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('❌ Tabela notification_preferences ainda não existe');
        console.log('\n📋 Instruções para criar manualmente:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o conteúdo do arquivo: create-notification-preferences-table.sql');
        return false;
      } else {
        console.log('⚠️ Erro ao verificar tabela:', checkError.message);
      }
    } else {
      console.log('✅ Tabela notification_preferences existe e está acessível!');
      return true;
    }

  } catch (error) {
    console.error('❌ Erro durante configuração:', error.message);
    return false;
  }
}

// Executar configuração
setupDatabase()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Banco de dados configurado com sucesso!');
      console.log('📝 Próximo passo: Testar notificações na interface');
    } else {
      console.log('\n⚠️ Configuração manual necessária');
      console.log('📖 Consulte as instruções acima');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
