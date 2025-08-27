const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFirebaseUIDs() {
  console.log('🔧 Corrigindo Firebase UIDs no Supabase...');
  
  try {
    // 1. Buscar usuários sem Firebase UID
    console.log('1. Buscando usuários sem Firebase UID...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .is('firebase_uid', null);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log(`✅ Encontrados ${users.length} usuários sem Firebase UID`);
    
    if (users.length === 0) {
      console.log('✅ Todos os usuários já têm Firebase UID configurado!');
      return;
    }

    // 2. Para cada usuário, tentar determinar o Firebase UID
    for (const user of users) {
      console.log(`\n2. Processando usuário: ${user.email}`);
      
      // Tentar diferentes estratégias para encontrar o Firebase UID
      let firebaseUID = null;
      
      // Estratégia 1: Se o email for do WhatsApp, pode ser um usuário específico
      if (user.email === '557388229995@whatsapp.local') {
        console.log('   📱 Usuário WhatsApp detectado');
        // Você pode definir um Firebase UID específico aqui
        firebaseUID = 'whatsapp-user-uid'; // Substitua pelo UID real
      }
      
      // Estratégia 2: Se for o email principal
      else if (user.email === 'joeltere9@gmail.com') {
        console.log('   📧 Usuário principal detectado');
        // Você pode definir um Firebase UID específico aqui
        firebaseUID = 'joel-user-uid'; // Substitua pelo UID real
      }
      
      // Estratégia 3: Gerar um UID temporário baseado no email
      else {
        console.log('   🔄 Gerando UID temporário baseado no email');
        // Gerar um hash simples do email como UID temporário
        const emailHash = require('crypto').createHash('md5').update(user.email).digest('hex');
        firebaseUID = `temp-${emailHash}`;
      }
      
      if (firebaseUID) {
        console.log(`   🔧 Atualizando Firebase UID para: ${firebaseUID}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ firebase_uid: firebaseUID })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar usuário ${user.email}:`, updateError);
        } else {
          console.log(`   ✅ Usuário ${user.email} atualizado com sucesso`);
        }
      }
    }

    // 3. Verificar resultado
    console.log('\n3. Verificando resultado...');
    const { data: updatedUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .not('firebase_uid', 'is', null);
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários atualizados:', checkError);
    } else {
      console.log(`✅ Usuários com Firebase UID: ${updatedUsers.length}`);
      updatedUsers.forEach(user => {
        console.log(`   - ${user.email}: ${user.firebase_uid}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correção
fixFirebaseUIDs().then(() => {
  console.log('\n🏁 Correção concluída');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 