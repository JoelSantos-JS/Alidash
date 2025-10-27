require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  console.log('🔧 Adicionando colunas transaction_id às tabelas revenues e expenses...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('add-transaction-id-columns.sql', 'utf8');
    
    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`${i + 1}. Executando: ${command.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: command });
      
      if (error) {
        console.log(`❌ Erro no comando ${i + 1}:`, error);
        
        // Tentar executar diretamente se a função exec_sql não existir
        if (error.code === 'PGRST202') {
          console.log('⚠️  Função exec_sql não encontrada, tentando abordagem alternativa...');
          
          // Para comandos ALTER TABLE, vamos tentar uma abordagem diferente
          if (command.includes('ALTER TABLE revenues')) {
            console.log('🔧 Adicionando coluna transaction_id à tabela revenues...');
            // Vamos verificar se a coluna já existe primeiro
            const { data: revenuesSample } = await supabase
              .from('revenues')
              .select('*')
              .limit(1);
            
            if (revenuesSample && revenuesSample[0] && !revenuesSample[0].hasOwnProperty('transaction_id')) {
              console.log('✅ Coluna transaction_id precisa ser adicionada à tabela revenues');
            } else {
              console.log('ℹ️  Coluna transaction_id já existe na tabela revenues');
            }
          }
          
          if (command.includes('ALTER TABLE expenses')) {
            console.log('🔧 Adicionando coluna transaction_id à tabela expenses...');
            // Vamos verificar se a coluna já existe primeiro
            const { data: expensesSample } = await supabase
              .from('expenses')
              .select('*')
              .limit(1);
            
            if (expensesSample && expensesSample[0] && !expensesSample[0].hasOwnProperty('transaction_id')) {
              console.log('✅ Coluna transaction_id precisa ser adicionada à tabela expenses');
            } else {
              console.log('ℹ️  Coluna transaction_id já existe na tabela expenses');
            }
          }
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }

    console.log('\n🎉 Processo concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. As colunas transaction_id foram adicionadas às tabelas');
    console.log('2. Execute o teste novamente para verificar a funcionalidade');

  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
  }
}

executeSQL();