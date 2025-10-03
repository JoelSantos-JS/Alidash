#!/usr/bin/env node

/**
 * Diagnóstico Avançado - Google OAuth
 * 
 * Script para identificar problemas persistentes no OAuth do Google Calendar
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Diagnóstico Avançado - Google OAuth\n');

// Verificar configurações básicas
console.log('📋 Configurações atuais:');
console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID}`);
console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI}`);
console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);

console.log('\n🚨 POSSÍVEIS CAUSAS DO ERRO PERSISTENTE:\n');

console.log('1️⃣ PROPAGAÇÃO DAS CONFIGURAÇÕES:');
console.log('   ⏰ As alterações no Google Cloud Console podem levar até 10-15 minutos');
console.log('   💡 Solução: Aguarde mais tempo e teste novamente');

console.log('\n2️⃣ CACHE DO NAVEGADOR:');
console.log('   🧹 O navegador pode estar usando cache antigo');
console.log('   💡 Soluções:');
console.log('      - Ctrl+Shift+Delete (limpar cache completo)');
console.log('      - Teste em aba anônima/privada');
console.log('      - Teste em navegador diferente');

console.log('\n3️⃣ SESSÃO OAUTH ATIVA:');
console.log('   🔐 Pode haver uma sessão OAuth anterior conflitante');
console.log('   💡 Soluções:');
console.log('      - Desconecte da conta Google em accounts.google.com');
console.log('      - Revogue acesso em myaccount.google.com/permissions');
console.log('      - Faça logout completo do Google');

console.log('\n4️⃣ PROJETO GOOGLE CLOUD:');
console.log('   ⚙️ Verificar se o projeto está ativo e configurado corretamente');
console.log('   💡 Verificações:');
console.log('      - API do Google Calendar está habilitada?');
console.log('      - Tela de consentimento OAuth está publicada?');
console.log('      - Não há limites de quota atingidos?');

console.log('\n5️⃣ FORMATO DAS URLs:');
console.log('   📝 Verificar se não há espaços ou caracteres especiais');
console.log('   💡 URLs devem ser exatamente:');
console.log('      - http://localhost:3001/agenda');
console.log('      - http://localhost:3001/api/calendar/callback');

console.log('\n6️⃣ ESTADO DO SERVIDOR:');
console.log('   🔄 O servidor pode estar em estado inconsistente');
console.log('   💡 Soluções:');
console.log('      - Reinicie o servidor (Ctrl+C e npm run dev)');
console.log('      - Limpe node_modules e reinstale (npm ci)');

console.log('\n🧪 TESTES PARA FAZER:\n');

console.log('✅ TESTE 1 - Verificar URL de autorização:');
console.log('   1. Acesse: http://localhost:3001/agenda');
console.log('   2. Abra DevTools (F12) > Network');
console.log('   3. Clique em "Conectar Google Calendar"');
console.log('   4. Verifique a URL gerada na aba Network');

console.log('\n✅ TESTE 2 - Testar API diretamente:');
console.log('   1. Abra: http://localhost:3001/api/calendar/auth?user_id=test');
console.log('   2. Deve retornar uma URL de autorização válida');

console.log('\n✅ TESTE 3 - Verificar logs do servidor:');
console.log('   1. Monitore o terminal onde o servidor está rodando');
console.log('   2. Procure por erros durante o processo OAuth');

console.log('\n🔧 SOLUÇÕES ALTERNATIVAS:\n');

console.log('🔄 OPÇÃO 1 - Recriar credenciais OAuth:');
console.log('   1. No Google Cloud Console, delete o OAuth Client atual');
console.log('   2. Crie um novo OAuth Client ID');
console.log('   3. Configure as URLs desde o início');
console.log('   4. Atualize o .env.local com as novas credenciais');

console.log('\n🔄 OPÇÃO 2 - Usar porta 3000:');
console.log('   1. Altere NEXT_PUBLIC_APP_URL para http://localhost:3000');
console.log('   2. Altere GOOGLE_REDIRECT_URI para http://localhost:3000/agenda');
console.log('   3. Inicie o servidor na porta 3000: npm run dev');

console.log('\n🔄 OPÇÃO 3 - Verificar implementação:');
console.log('   1. Teste a API de autorização isoladamente');
console.log('   2. Verifique se os tokens estão sendo salvos corretamente');
console.log('   3. Confirme se o callback está funcionando');

console.log('\n📞 PRÓXIMOS PASSOS:\n');
console.log('1. Execute os testes acima');
console.log('2. Aguarde 15 minutos após configurar no Google Cloud');
console.log('3. Teste em aba anônima');
console.log('4. Se ainda não funcionar, tente recriar as credenciais');

console.log('\n🎯 INFORMAÇÕES PARA SUPORTE:');
console.log('   - Erro específico que aparece');
console.log('   - Horário da última alteração no Google Cloud Console');
console.log('   - Navegador e versão sendo usados');
console.log('   - Se o erro acontece sempre ou esporadicamente');

console.log('\n📋 Status: Investigando causa do erro persistente...');