require('dotenv').config({ path: '.env.local' });

// Import the updated SupabaseService
const { SupabaseService } = require('./src/lib/supabase-service.ts');

async function testCreateUserFix() {
  console.log('🧪 Testando correção do createUser...');
  
  try {
    // Create admin service instance
    const supabaseAdminService = new SupabaseService(true);
    
    // Test 1: Non-UUID ID (should use firebase_uid)
    console.log('\n📝 Teste 1: ID não-UUID (deve usar firebase_uid)');
    const testUserData1 = {
      id: 'test-user-' + Date.now(),
      email: 'test1@example.com',
      name: 'Test User 1',
      account_type: 'personal'
    };
    
    console.log('📤 Dados do usuário 1:', JSON.stringify(testUserData1, null, 2));
    
    try {
      const result1 = await supabaseAdminService.createUser(testUserData1);
      console.log('✅ Usuário 1 criado com sucesso:', result1);
      
      // Clean up
      await supabaseAdminService.client.from('users').delete().eq('id', result1.id);
      console.log('🧹 Usuário 1 removido');
    } catch (error1) {
      console.error('❌ Erro ao criar usuário 1:', error1.message);
    }
    
    // Test 2: Valid UUID ID (should use id)
    console.log('\n📝 Teste 2: UUID válido (deve usar id)');
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const testUserData2 = {
      id: validUuid,
      email: 'test2@example.com',
      name: 'Test User 2',
      account_type: 'personal'
    };
    
    console.log('📤 Dados do usuário 2:', JSON.stringify(testUserData2, null, 2));
    
    try {
      const result2 = await supabaseAdminService.createUser(testUserData2);
      console.log('✅ Usuário 2 criado com sucesso:', result2);
      
      // Clean up
      await supabaseAdminService.client.from('users').delete().eq('id', result2.id);
      console.log('🧹 Usuário 2 removido');
    } catch (error2) {
      console.error('❌ Erro ao criar usuário 2:', error2.message);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testCreateUserFix().catch(console.error);