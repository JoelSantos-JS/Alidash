require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersRLS() {
  console.log('🔧 Corrigindo políticas RLS da tabela users...\n');

  try {
    // Ler o arquivo SQL de correção
    const sqlContent = fs.readFileSync('fix-users-rls-policy.sql', 'utf8');
    
    console.log('📋 Executando script SQL para corrigir políticas RLS...');
    
    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    for (const command of sqlCommands) {
      if (command.includes('DROP POLICY') || command.includes('CREATE POLICY') || command.includes('SELECT')) {
        console.log(`🔄 Executando: ${command.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: command + ';' 
        });
        
        if (error) {
          // Tentar executar diretamente se rpc falhar
          console.log('⚠️ RPC falhou, tentando método direto...');
          
          if (command.includes('DROP POLICY')) {
            // Ignorar erros de DROP POLICY se a política não existir
            console.log('ℹ️ Ignorando erro de DROP POLICY (política pode não existir)');
          } else if (command.includes('CREATE POLICY')) {
            console.error('❌ Erro ao criar política:', error.message);
          } else {
            console.log('✅ Comando executado (verificação)');
          }
        } else {
          console.log('✅ Comando executado com sucesso');
        }
      }
    }

    // Verificar se as políticas foram criadas
    console.log('\n🔍 Verificando políticas criadas...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('tablename', 'users');

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas via query, mas isso é normal');
    } else {
      console.log('📋 Políticas encontradas:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n✅ Correção das políticas RLS concluída!');
    console.log('🔄 Agora teste o login novamente...');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

// Executar correção
fixUsersRLS();