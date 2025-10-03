#!/usr/bin/env node

/**
 * Teste Direto da API OAuth
 * 
 * Testa a API de autorização do Google Calendar diretamente
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testando API OAuth diretamente...\n');

// Função para fazer requisição HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testOAuthAPI() {
  console.log('📡 Testando endpoint de autorização...');
  
  try {
    // Testar se o servidor está rodando
    console.log('1️⃣ Verificando se o servidor está ativo...');
    const healthCheck = await makeRequest('http://localhost:3001/api/calendar/auth?user_id=test&check_only=true');
    
    console.log(`   Status: ${healthCheck.statusCode}`);
    console.log(`   Response: ${healthCheck.body}`);
    
    if (healthCheck.statusCode === 200) {
      console.log('   ✅ Servidor está respondendo');
      
      // Testar geração de URL de autorização
      console.log('\n2️⃣ Testando geração de URL de autorização...');
      const authResponse = await makeRequest('http://localhost:3001/api/calendar/auth?user_id=test');
      
      console.log(`   Status: ${authResponse.statusCode}`);
      console.log(`   Response: ${authResponse.body}`);
      
      if (authResponse.statusCode === 200) {
        try {
          const authData = JSON.parse(authResponse.body);
          console.log('   ✅ URL de autorização gerada com sucesso');
          console.log(`   🔗 URL: ${authData.authUrl}`);
          
          // Verificar se a URL contém os parâmetros corretos
          if (authData.authUrl.includes('client_id=48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com')) {
            console.log('   ✅ Client ID correto na URL');
          } else {
            console.log('   ❌ Client ID incorreto na URL');
          }
          
          if (authData.authUrl.includes('redirect_uri=http%3A//localhost%3A3001')) {
            console.log('   ✅ Redirect URI correto na URL');
          } else {
            console.log('   ❌ Redirect URI incorreto na URL');
          }
          
          if (authData.authUrl.includes('scope=https%3A//www.googleapis.com/auth/calendar')) {
            console.log('   ✅ Scopes corretos na URL');
          } else {
            console.log('   ❌ Scopes incorretos na URL');
          }
          
        } catch (parseError) {
          console.log('   ❌ Erro ao parsear resposta JSON');
          console.log(`   Erro: ${parseError.message}`);
        }
      } else {
        console.log('   ❌ Erro ao gerar URL de autorização');
      }
      
    } else {
      console.log('   ❌ Servidor não está respondendo corretamente');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API:');
    console.log(`   ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('   O servidor não está rodando na porta 3001');
      console.log('\n💡 SOLUÇÕES:');
      console.log('   1. Inicie o servidor: npm run dev');
      console.log('   2. Verifique se está rodando na porta correta');
      console.log('   3. Verifique se não há conflitos de porta');
    }
  }
}

// Função para testar URL de autorização manualmente
function generateTestAuthUrl() {
  console.log('\n🔧 URL de autorização manual para teste:');
  
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: '48131222137-al6p4lk0r607at3lqni60uhr7ms5n5g3.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:3001/agenda',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state: 'test_manual'
  });
  
  const fullUrl = `${baseUrl}?${params.toString()}`;
  console.log(`🔗 ${fullUrl}`);
  console.log('\n💡 Teste manual:');
  console.log('   1. Copie a URL acima');
  console.log('   2. Cole no navegador');
  console.log('   3. Se funcionar, o problema está na implementação da API');
  console.log('   4. Se não funcionar, o problema está no Google Cloud Console');
}

// Executar testes
async function runTests() {
  await testOAuthAPI();
  generateTestAuthUrl();
  
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('   - Se a API responder corretamente mas o OAuth falhar, o problema é no Google Cloud Console');
  console.log('   - Se a API não responder, o problema é no servidor local');
  console.log('   - Se a URL manual funcionar, o problema é na implementação da API');
  console.log('\n🎯 Próximo passo: Analise os resultados acima para identificar a causa');
}

runTests();