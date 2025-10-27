require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAuth() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');
    
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`📊 Total de usuários encontrados: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Nome: ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email || 'Não informado'}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
    
    // Verificar se existe usuário com email específico
    const joelEmail = 'joel@example.com'; // ou outro email que você usa
    const { data: joelUser, error: joelError } = await supabase
      .from('users')
      .select('*')
      .eq('email', joelEmail)
      .single();
    
    if (joelError && joelError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário Joel:', joelError);
    } else if (joelUser) {
      console.log(`✅ Usuário Joel encontrado:`);
      console.log(`   Nome: ${joelUser.name}`);
      console.log(`   ID: ${joelUser.id}`);
      console.log(`   Email: ${joelUser.email}`);
    } else {
      console.log(`⚠️ Usuário com email ${joelEmail} não encontrado`);
    }
    
    // Verificar usuários na tabela auth.users do Supabase
    console.log('\n🔐 Verificando usuários na autenticação do Supabase...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
    } else {
      console.log(`📊 Total de usuários de auth: ${authUsers.users.length}\n`);
      
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAuth();