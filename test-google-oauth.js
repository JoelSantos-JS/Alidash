require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testando configuração Google OAuth...\n');

// Verificar variáveis de ambiente
console.log('📋 Variáveis de ambiente:');
console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Definida' : '❌ Não definida');
console.log('- GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Definida' : '❌ Não definida');
console.log('- GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || '❌ Não definida');
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ Não definida');

if (process.env.GOOGLE_CLIENT_ID) {
  console.log('\n🔑 Client ID detectado:', process.env.GOOGLE_CLIENT_ID);
  
  // Verificar se é um placeholder
  if (process.env.GOOGLE_CLIENT_ID.includes('aqhqhqhqhq')) {
    console.log('⚠️  ATENÇÃO: Client ID parece ser um placeholder!');
    console.log('   Você precisa configurar credenciais reais no Google Cloud Console.');
  } else {
    console.log('✅ Client ID parece ser real');
  }
}

console.log('\n🌐 URLs configuradas:');
console.log('- Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL);

console.log('\n📝 Para corrigir o erro "Acesso bloqueado":');
console.log('1. Acesse: https://console.cloud.google.com/');
console.log('2. Vá para APIs & Services > Credentials');
console.log('3. Edite o OAuth 2.0 Client ID');
console.log('4. Adicione estas URIs autorizadas:');
console.log('   - JavaScript origins: http://localhost:3001');
console.log('   - Redirect URIs: http://localhost:3001/agenda');
console.log('   - Redirect URIs: http://localhost:3001/api/calendar/callback');
console.log('\n5. Salve as alterações e teste novamente');

console.log('\n🔗 URL de teste após configurar:');
console.log(`   ${process.env.NEXT_PUBLIC_APP_URL}/agenda`);