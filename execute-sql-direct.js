const https = require('https');

// Configurações do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

// Comandos SQL para atualizar as políticas
const sqlCommands = [
  // Remover políticas existentes
  "DROP POLICY IF EXISTS users_own_data ON users;",
  "DROP POLICY IF EXISTS users_comprehensive_policy ON users;",
  "DROP POLICY IF EXISTS users_select_policy ON users;",
  "DROP POLICY IF EXISTS users_insert_policy ON users;",
  "DROP POLICY IF EXISTS users_update_policy ON users;",
  "DROP POLICY IF EXISTS users_delete_policy ON users;",
  "DROP POLICY IF EXISTS users_service_role_policy ON users;",
  
  // Criar novas políticas
  `CREATE POLICY users_select_policy ON users FOR SELECT 
   USING (
     auth.role() = 'service_role' 
     OR 
     auth.uid()::text = id::text
   );`,
   
  `CREATE POLICY users_insert_policy ON users FOR INSERT 
   WITH CHECK (
     auth.role() = 'service_role' 
     OR 
     (auth.uid() IS NOT NULL AND auth.uid()::text = id::text)
   );`,
   
  `CREATE POLICY users_update_policy ON users FOR UPDATE 
   USING (
     auth.role() = 'service_role' 
     OR 
     auth.uid()::text = id::text
   )
   WITH CHECK (
     auth.role() = 'service_role' 
     OR 
     auth.uid()::text = id::text
   );`,
   
  `CREATE POLICY users_delete_policy ON users FOR DELETE 
   USING (
     auth.role() = 'service_role' 
     OR 
     auth.uid()::text = id::text
   );`,
   
  // Garantir que RLS está habilitado
  "ALTER TABLE users ENABLE ROW LEVEL SECURITY;"
];

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'atyeakcunmhrzzpdcvxm.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData });
        } else {
          resolve({ success: false, error: responseData, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function updateUsersPolicies() {
  console.log('🔄 Executando comandos SQL para atualizar políticas da tabela users...\n');

  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i].trim();
    
    if (command.includes('DROP POLICY')) {
      const policyName = command.match(/DROP POLICY IF EXISTS (\w+)/)?.[1];
      console.log(`🗑️  Removendo política: ${policyName || 'desconhecida'}`);
    } else if (command.includes('CREATE POLICY')) {
      const policyName = command.match(/CREATE POLICY (\w+)/)?.[1];
      console.log(`✨ Criando política: ${policyName || 'desconhecida'}`);
    } else if (command.includes('ALTER TABLE')) {
      console.log('🔒 Habilitando RLS na tabela users');
    }

    try {
      const result = await executeSQL(command);
      
      if (result.success) {
        console.log('✅ Comando executado com sucesso');
      } else {
        console.log(`❌ Erro: ${result.error} (Status: ${result.statusCode})`);
      }
    } catch (error) {
      console.log(`❌ Erro de rede: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('✅ Processo concluído!');
  console.log('\n📋 RESUMO:');
  console.log('=====================================');
  console.log('✅ Tentativa de remoção de políticas antigas');
  console.log('✅ Tentativa de criação de novas políticas sem firebase_uid');
  console.log('✅ Tentativa de habilitação do RLS');
  console.log('');
  console.log('⚠️  Se houver erros, execute manualmente no painel do Supabase:');
  console.log('   https://supabase.com/dashboard/project/atyeakcunmhrzzpdcvxm/sql');
}

// Executar atualização
updateUsersPolicies();