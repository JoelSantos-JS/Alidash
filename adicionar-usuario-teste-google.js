#!/usr/bin/env node

/**
 * 🚨 SCRIPT: Adicionar Usuário de Teste - Google OAuth
 * 
 * Este script orienta sobre como adicionar seu email como usuário de teste
 * para resolver o erro "access_denied" do Google OAuth.
 */

console.log('🚨 ERRO GOOGLE OAUTH: App em Modo de Teste');
console.log('=====================================\n');

console.log('❌ PROBLEMA ATUAL:');
console.log('- Erro 403: access_denied');
console.log('- App VoxCash não concluiu verificação do Google');
console.log('- Seu email não está na lista de usuários de teste\n');

console.log('🎯 CAUSA IDENTIFICADA:');
console.log('- App está em modo "Em teste" no Google Cloud Console');
console.log('- Email joeltere8@gmail.com não está autorizado\n');

console.log('✅ SOLUÇÃO IMEDIATA - ADICIONAR USUÁRIO DE TESTE:');
console.log('================================================\n');

console.log('📋 PASSO A PASSO:');
console.log('1. Acesse: https://console.cloud.google.com/');
console.log('2. Selecione o projeto: VoxCash');
console.log('3. Vá em: APIs e serviços → Tela de consentimento OAuth');
console.log('4. Role até a seção "Usuários de teste"');
console.log('5. Clique em "+ ADICIONAR USUÁRIOS"');
console.log('6. Digite: joeltere8@gmail.com');
console.log('7. Clique em "SALVAR"\n');

console.log('🔧 CONFIGURAÇÕES ATUAIS DO SEU PROJETO:');
console.log('=====================================');
console.log('Client ID: 48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com');
console.log('Projeto: VoxCash');
console.log('Email para adicionar: joeltere8@gmail.com\n');

console.log('⏱️ TEMPO ESTIMADO: 2-3 minutos');
console.log('🚀 RESULTADO: Acesso liberado imediatamente\n');

console.log('🧪 TESTE APÓS ADICIONAR:');
console.log('========================');
console.log('1. npm run dev -- -p 3001');
console.log('2. Acesse: http://localhost:3001/agenda');
console.log('3. Clique em "Conectar Google Calendar"');
console.log('4. ✅ Deve funcionar sem erro 403\n');

console.log('🆘 SE AINDA DER ERRO:');
console.log('1. Verifique se adicionou o email correto como usuário de teste');
console.log('2. Aguarde 5 minutos e tente novamente (pode haver atraso na propagação)');
console.log('3. Limpe os cookies do navegador e tente novamente');
console.log('4. Tente com outro navegador ou modo anônimo');
console.log('5. Verifique se as credenciais OAuth estão configuradas corretamente no .env.local');
console.log('6. Execute: node test-google-oauth.js para diagnóstico detalhado\n');

console.log('📝 NOTAS IMPORTANTES:');
console.log('- Este erro ocorre apenas em ambiente de desenvolvimento');
console.log('- Após a verificação do app pelo Google, esta limitação será removida');
console.log('- Você pode adicionar até 100 usuários de teste');
console.log('- Cada usuário de teste precisa ser adicionado individualmente\n');

console.log('🔄 PARA VERIFICAR STATUS:');
console.log('node test-google-oauth.js\n');

console.log('✅ SCRIPT CONCLUÍDO!');
console.log('====================');
console.log('- Aguarde 5 minutos (propagação)');
console.log('- Limpe cache do navegador');
console.log('- Teste em aba anônima');
console.log('- Verifique se salvou as configurações\n');

console.log('📱 ALTERNATIVA - PUBLICAR APP:');
console.log('==============================');
console.log('Se quiser que qualquer pessoa use:');
console.log('1. Na mesma tela de consentimento');
console.log('2. Clique em "PUBLICAR APP"');
console.log('3. Confirme a publicação\n');

console.log('✅ PRÓXIMOS PASSOS:');
console.log('===================');
console.log('1. Adicione seu email como usuário de teste');
console.log('2. Teste o OAuth novamente');
console.log('3. Se funcionar, problema resolvido! 🎉\n');

console.log('🔗 LINK DIRETO:');
console.log('https://console.cloud.google.com/apis/credentials/consent');