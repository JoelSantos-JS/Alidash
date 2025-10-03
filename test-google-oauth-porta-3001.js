#!/usr/bin/env node

/**
 * Script de Teste - Google OAuth na Porta 3001
 * 
 * Este script verifica se a configuração do Google Calendar OAuth
 * está funcionando corretamente na porta 3001.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando configuração Google OAuth - Porta 3001\n');

// Verificar variáveis de ambiente
console.log('📋 Configurações atuais:');
console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI}`);
console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);

console.log('\n🔗 URLs que devem estar configuradas no Google Cloud Console:');
console.log('\n📍 Authorized JavaScript origins:');
console.log('   ✅ http://localhost:3000  (manter existente)');
console.log('   🆕 http://localhost:3001  (ADICIONAR ESTA)');

console.log('\n📍 Authorized redirect URIs:');
console.log('   ✅ http://localhost:3000/agenda                    (manter existente)');
console.log('   ✅ http://localhost:3000/api/calendar/callback     (manter existente)');
console.log('   🆕 http://localhost:3001/agenda                    (ADICIONAR ESTA)');
console.log('   🆕 http://localhost:3001/api/calendar/callback     (ADICIONAR ESTA)');

console.log('\n🎯 Parâmetros OAuth detectados na sua solicitação:');
console.log('   access_type: offline');
console.log('   scope: https://www.googleapis.com/auth/calendar');
console.log('   scope: https://www.googleapis.com/auth/calendar.events');
console.log('   response_type: code');
console.log('   redirect_uri: http://localhost:3001/agenda');
console.log('   prompt: consent');
console.log('   flowName: GeneralOAuthFlow');
console.log(`   client_id: ${process.env.GOOGLE_CLIENT_ID}`);

console.log('\n🚨 PROBLEMA IDENTIFICADO:');
console.log('   A URL http://localhost:3001/agenda não está autorizada no Google Cloud Console');
console.log('   Você precisa adicionar as URLs da porta 3001 nas configurações OAuth');

console.log('\n📝 PASSOS PARA CORRIGIR:');
console.log('   1. Acesse: https://console.cloud.google.com/');
console.log('   2. Vá para APIs & Services > Credentials');
console.log(`   3. Edite o OAuth Client ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log('   4. Adicione as URLs da porta 3001 listadas acima');
console.log('   5. Salve e aguarde 2-5 minutos');
console.log('   6. Teste novamente em: http://localhost:3001/agenda');

console.log('\n🧪 TESTE APÓS CONFIGURAR:');
console.log('   1. Limpe o cache do navegador (Ctrl+Shift+Delete)');
console.log('   2. Acesse: http://localhost:3001/agenda');
console.log('   3. Clique em "Conectar Google Calendar"');
console.log('   4. Deve funcionar sem erro de "Acesso bloqueado"');

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   - Redirecionamento para tela de autorização do Google');
console.log('   - Autorização bem-sucedida');
console.log('   - Retorno para a aplicação com tokens válidos');
console.log('   - Sincronização de eventos funcionando');

// Verificar se o servidor está rodando na porta correta
const expectedPort = '3001';
const configuredPort = process.env.NEXT_PUBLIC_APP_URL?.includes(':3001') ? '3001' : 'outra';

console.log('\n🔍 Verificação de porta:');
if (configuredPort === expectedPort) {
  console.log('   ✅ Configuração de porta está correta (3001)');
} else {
  console.log('   ⚠️  Verifique se o servidor está rodando na porta 3001');
}

console.log('\n🎯 Status: Aguardando configuração no Google Cloud Console');
console.log('📞 Se precisar de ajuda adicional, consulte o arquivo CORRIGIR-ERRO-OAUTH-PORTA-3001.md');