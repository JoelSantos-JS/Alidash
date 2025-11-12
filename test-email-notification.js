require('dotenv').config({ path: '.env.local' });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const userId = process.argv[2] || 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';

    const payload = {
      user_id: userId,
      email: {
        type: 'general',
        subject: 'Teste de Notificação Alidash',
        body: '<h1>Teste</h1><p>Este é um envio de teste via Resend.</p>'
      }
    };

    console.log('🔎 Enviando POST para /api/notifications/email...');
    const res = await fetch(`${baseUrl}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('📥 Status:', res.status);
    console.log('📄 Resposta:', text);
  } catch (err) {
    console.error('❌ Erro no teste de envio:', err.message);
  }
}

run();