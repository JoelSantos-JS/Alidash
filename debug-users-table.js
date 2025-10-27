require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUsersTable() {
  console.log('🔍 Verificando estrutura da tabela users...');
  
  try {
    // 1. Verificar se a tabela existe e sua estrutura
    const { data: sample, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ Erro ao acessar tabela users:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('📋 Estrutura da tabela users (campos disponíveis):');
      Object.keys(sample[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[0][key]} = ${sample[0][key]}`);
      });
    } else {
      console.log('⚠️ Tabela users está vazia');
    }

    // 2. Tentar criar um usuário de teste para ver o erro específico
    console.log('\n🧪 Testando criação de usuário...');
    
    const testUserData = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      account_type: 'personal'
    };
    
    console.log('📤 Dados do usuário de teste:', JSON.stringify(testUserData, null, 2));
    
    const { data: createData, error: createError } = await supabase
      .from('users')
      .insert(testUserData)
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Erro ao criar usuário de teste:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
    } else {
      console.log('✅ Usuário de teste criado com sucesso:', createData);
      
      // Limpar o usuário de teste
      await supabase.from('users').delete().eq('id', testUserData.id);
      console.log('🧹 Usuário de teste removido');
    }

    // 3. Verificar se existe o usuário joeltere9@gmail.com
    console.log('\n👤 Verificando usuário joeltere9@gmail.com...');
    
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'joeltere9@gmail.com')
      .single();
      
    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar usuário:', userError);
    } else if (existingUser) {
      console.log('✅ Usuário encontrado:', existingUser);
    } else {
      console.log('⚠️ Usuário joeltere9@gmail.com não encontrado');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

debugUsersTable().catch(console.error);