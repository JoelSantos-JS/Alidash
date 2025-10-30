const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthState() {
  console.log('🔍 Verificando estado de autenticação...');
  
  try {
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('📋 Sessão atual:', {
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null,
      error: sessionError?.message
    });
    
    // Verificar usuários na tabela auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    console.log('👥 Usuários registrados:', {
      count: users?.users?.length || 0,
      users: users?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      })) || [],
      error: usersError?.message
    });
    
    // Testar API de goals com um user_id conhecido
    if (users?.users && users.users.length > 0) {
      const testUserId = users.users[0].id;
      console.log(`\n🧪 Testando API de goals com user_id: ${testUserId}`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/goals?user_id=${testUserId}`);
        const data = await response.json();
        
        console.log('📊 Resultado da API:', {
          status: response.status,
          success: data.success,
          goalsCount: data.goals?.length || 0
        });
      } catch (apiError) {
        console.error('❌ Erro na API:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAuthState();