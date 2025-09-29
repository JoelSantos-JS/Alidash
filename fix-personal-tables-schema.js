require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPersonalTablesSchema() {
  console.log('🔧 Corrigindo schema das tabelas pessoais...\n');
  console.log('⚠️  AVISO: Este script tentará alterar as tabelas diretamente.');
  console.log('⚠️  Se não funcionar, você precisará executar o SQL manualmente no Supabase Dashboard.\n');

  const tables = ['personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals'];

  // Tentar uma abordagem diferente: usar uma função personalizada
  console.log('📋 Tentando executar alterações de schema...');

  try {
    // Primeiro, vamos tentar criar uma função temporária para executar SQL
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_execute_sql(sql_text text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_text;
        RETURN 'SUCCESS';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN 'ERROR: ' || SQLERRM;
      END;
      $$;
    `;

    console.log('🔧 Criando função temporária...');
    const { data: funcResult, error: funcError } = await supabase.rpc('temp_execute_sql', { sql_text: createFunctionSQL });
    
    if (funcError) {
      console.log('❌ Não foi possível criar função temporária:', funcError.message);
      console.log('\n📋 SOLUÇÃO MANUAL:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o seguinte SQL:');
      console.log('\n-- Alterar user_id para TEXT em todas as tabelas pessoais');
      for (const table of tables) {
        console.log(`ALTER TABLE ${table} ALTER COLUMN user_id TYPE TEXT;`);
      }
      console.log('\n-- Recriar índices');
      for (const table of tables) {
        console.log(`DROP INDEX IF EXISTS idx_${table}_user_id;`);
        console.log(`CREATE INDEX idx_${table}_user_id ON ${table}(user_id);`);
      }
      return;
    }

    console.log('✅ Função temporária criada');

    // Agora executar as alterações
    for (const table of tables) {
      console.log(`🔧 Alterando ${table}...`);
      
      const alterSQL = `ALTER TABLE ${table} ALTER COLUMN user_id TYPE TEXT;`;
      const { data: alterResult, error: alterError } = await supabase.rpc('temp_execute_sql', { sql_text: alterSQL });
      
      if (alterError) {
        console.log(`❌ Erro ao alterar ${table}:`, alterError.message);
      } else if (alterResult && alterResult.includes('SUCCESS')) {
        console.log(`✅ ${table} alterado com sucesso`);
      } else {
        console.log(`⚠️  ${table}: ${alterResult}`);
      }
    }

    // Limpar função temporária
    console.log('\n🧹 Removendo função temporária...');
    await supabase.rpc('temp_execute_sql', { sql_text: 'DROP FUNCTION IF EXISTS temp_execute_sql(text);' });

  } catch (error) {
    console.error('❌ Erro durante execução:', error.message);
    console.log('\n📋 SOLUÇÃO MANUAL:');
    console.log('Execute o seguinte SQL no Supabase Dashboard:');
    console.log('\n-- Alterar user_id para TEXT em todas as tabelas pessoais');
    for (const table of tables) {
      console.log(`ALTER TABLE ${table} ALTER COLUMN user_id TYPE TEXT;`);
    }
  }
}

// Executar correção
fixPersonalTablesSchema()
  .then(() => {
    console.log('\n🏁 Script concluído');
    console.log('\n📋 PRÓXIMO PASSO:');
    console.log('Execute: node check-personal-tables-structure.js');
    console.log('Para verificar se as alterações foram aplicadas.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });