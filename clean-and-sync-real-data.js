// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanAndSyncRealData() {
  console.log('🧹 Limpando dados de teste e preparando sincronização real...\n');

  try {
    // 1. Limpar todos os produtos de teste
    console.log('🗑️ Limpando produtos de teste...');
    const { error: deleteProductsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (deleteProductsError) {
      console.log('❌ Erro ao limpar produtos:', deleteProductsError.message);
    } else {
      console.log('✅ Produtos de teste removidos');
    }

    // 2. Verificar usuários existentes
    console.log('\n📋 Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, name')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    console.log(`✅ ${users?.length || 0} usuários encontrados`);

    if (users && users.length > 0) {
      console.log('\n📋 Usuários atuais:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.email || 'Sem nome'}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Firebase UID: ${user.firebase_uid || '❌ Não definido'}`);
        console.log(`   - Email: ${user.email || 'Não definido'}`);
        console.log('');
      });

      // 3. Atualizar usuários com Firebase UIDs reais
      console.log('🔄 Atualizando usuários com Firebase UIDs reais...');
      
      // Mapeamento de usuários reais (você deve ajustar estes IDs)
      const realUserMappings = [
        {
          currentEmail: '557388229995@whatsapp.local',
          firebaseUid: 'REAL_FIREBASE_UID_1', // Substitua pelo UID real
          name: 'Usuário WhatsApp'
        },
        {
          currentEmail: 'joeltere9@gmail.com', // Ajuste se necessário
          firebaseUid: 'REAL_FIREBASE_UID_2', // Substitua pelo UID real
          name: 'joeltere9'
        },
        {
          currentEmail: 'test@example.com', // Ajuste se necessário
          firebaseUid: 'REAL_FIREBASE_UID_3', // Substitua pelo UID real
          name: 'Usuário Teste'
        }
      ];

      for (const mapping of realUserMappings) {
        const user = users.find(u => u.email === mapping.currentEmail);
        if (user) {
          console.log(`   🔄 Atualizando ${user.name || user.email}...`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              firebase_uid: mapping.firebaseUid,
              name: mapping.name
            })
            .eq('id', user.id);

          if (updateError) {
            console.log(`   ❌ Erro ao atualizar ${user.name}: ${updateError.message}`);
          } else {
            console.log(`   ✅ ${user.name} atualizado com Firebase UID: ${mapping.firebaseUid}`);
          }
        } else {
          console.log(`   ⚠️ Usuário não encontrado: ${mapping.currentEmail}`);
        }
      }
    }

    console.log('\n📊 Resumo da limpeza:');
    console.log('   - Produtos de teste removidos');
    console.log('   - Usuários preparados para sincronização');
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   - Substitua os Firebase UIDs no script pelos UIDs reais');
    console.log('   - Execute a sincronização real após definir os UIDs corretos');
    console.log('✅ Limpeza concluída!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanAndSyncRealData().then(() => {
  console.log('\n🏁 Limpeza finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 