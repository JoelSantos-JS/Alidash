// Script para atualizar senha do usuário no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Dados do usuário (podem ser passados como argumentos)
const email = process.argv[2] || 'joeltere9@gmail.com';
const newPassword = process.argv[3] || 'joel123';

async function updateUserPassword() {
  try {
    console.log(`🔄 Atualizando senha para: ${email}`);
    
    // Buscar usuário no Auth pelo email
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao buscar usuários:', listError.message);
      return;
    }
    
    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      return;
    }
    
    console.log(`✅ Usuário encontrado:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    
    // Atualizar senha do usuário
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message);
      return;
    }
    
    console.log(`✅ Senha atualizada com sucesso!`);
    console.log(`   - User ID: ${updateData.user.id}`);
    console.log(`   - Email: ${updateData.user.email}`);
    console.log(`   - Última atualização: ${updateData.user.updated_at}`);
    
    console.log('\n🎉 Senha alterada com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    console.log(`🆔 User ID: ${user.id}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar o script
updateUserPassword();