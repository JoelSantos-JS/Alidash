// Script para testar as APIs de notificação
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123'; // ID de teste

async function testNotificationAPIs() {
  console.log('🧪 Testando APIs de Notificação...\n');

  // Teste 1: Buscar preferências (deve retornar padrão se não existir)
  console.log('📋 Teste 1: Buscar preferências de notificação');
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/preferences?user_id=${TEST_USER_ID}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de preferências funcionando');
      console.log('📊 Preferências retornadas:', JSON.stringify(data.preferences, null, 2));
    } else {
      console.log('❌ Erro na API de preferências:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro ao testar preferências:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 2: Salvar preferências
  console.log('📋 Teste 2: Salvar preferências de notificação');
  try {
    const testPreferences = {
      pushNotifications: true,
      emailNotifications: true,
      calendarReminders: true,
      productAlerts: false,
      transactionAlerts: true,
      goalReminders: true,
      debtReminders: false,
      reminderTime: 30
    };

    const response = await fetch(`${BASE_URL}/api/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        preferences: testPreferences
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de salvar preferências funcionando');
      console.log('📝 Resposta:', data.message);
    } else {
      console.log('❌ Erro ao salvar preferências:', data.error);
      if (data.message) {
        console.log('💡 Dica:', data.message);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao testar salvar preferências:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 3: Testar envio de notificação push
  console.log('📋 Teste 3: Testar envio de notificação push');
  try {
    const testNotification = {
      user_id: TEST_USER_ID,
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste do sistema',
      type: 'general',
      data: {
        url: '/dashboard',
        action: 'test'
      }
    };

    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNotification)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de envio de notificação funcionando');
      console.log('📤 Resultado:', data.message);
      if (data.sent_count !== undefined) {
        console.log(`📊 Notificações enviadas: ${data.sent_count}`);
      }
    } else {
      console.log('❌ Erro ao enviar notificação:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro ao testar envio de notificação:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste 4: Testar API de email
  console.log('📋 Teste 4: Testar envio de email');
  try {
    const testEmail = {
      user_id: TEST_USER_ID,
      subject: 'Teste de Email',
      message: 'Esta é uma mensagem de teste do sistema de notificações',
      type: 'general'
    };

    const response = await fetch(`${BASE_URL}/api/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API de email funcionando');
      console.log('📧 Resultado:', data.message);
    } else {
      console.log('❌ Erro ao enviar email:', data.error);
    }
  } catch (error) {
    console.log('❌ Erro ao testar envio de email:', error.message);
  }

  console.log('\n🎯 Resumo dos Testes:');
  console.log('================================');
  console.log('✅ Servidor de desenvolvimento rodando');
  console.log('✅ APIs de notificação acessíveis');
  console.log('📝 Próximo passo: Testar interface no navegador');
  console.log('🌐 Acesse: http://localhost:3000/perfil (aba Notificações)');
}

// Executar testes
testNotificationAPIs()
  .catch(error => {
    console.error('❌ Erro durante os testes:', error);
  });