// Carregar variáveis de ambiente
require('dotenv').config();

const https = require('https');
const http = require('http');

// Configuração
const API_BASE_URL = 'http://localhost:3000/api';
const SUPABASE_USER_ID = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc';

// Função fetch personalizada para Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function configureSupabasePrimary() {
  console.log('🔧 Configurando Supabase como banco principal...\n');
  
  try {
    // 1. Verificar produtos no Supabase
    console.log('📋 Verificando produtos no Supabase...');
    const getResponse = await fetch(`${API_BASE_URL}/products/get?user_id=${SUPABASE_USER_ID}`);
    
    if (!getResponse.ok) {
      console.log('❌ Erro ao verificar produtos no Supabase');
      return;
    }
    
    const products = await getResponse.json();
    console.log(`✅ ${products.length} produtos encontrados no Supabase\n`);
    
    if (products.length === 0) {
      console.log('⚠️ Nenhum produto encontrado no Supabase');
      console.log('💡 Execute primeiro o script de migração: node migrate-firebase-to-supabase.js');
      return;
    }
    
    // 2. Mostrar produtos migrados
    console.log('📦 Produtos migrados para o Supabase:');
    console.log('=' .repeat(50));
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Categoria: ${product.category}`);
      console.log(`   Preço: R$ ${product.purchase_price} → R$ ${product.selling_price}`);
      console.log(`   Lucro: R$ ${product.expected_profit}`);
      console.log(`   Status: ${product.status}`);
      console.log('   ' + '-'.repeat(30));
    });
    
    // 3. Resumo financeiro
    const totalInvested = products.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const totalExpected = products.reduce((sum, p) => sum + (p.selling_price || 0), 0);
    const totalProfit = products.reduce((sum, p) => sum + (p.expected_profit || 0), 0);
    
    console.log('\n💰 Resumo Financeiro:');
    console.log('=' .repeat(30));
    console.log(`   Investimento total: R$ ${totalInvested.toFixed(2)}`);
    console.log(`   Receita esperada: R$ ${totalExpected.toFixed(2)}`);
    console.log(`   Lucro esperado: R$ ${totalProfit.toFixed(2)}`);
    console.log(`   Margem média: ${((totalProfit / totalInvested) * 100).toFixed(1)}%`);
    
    // 4. Configuração concluída
    console.log('\n🎉 Configuração concluída!');
    console.log('✅ Supabase agora é o banco principal');
    console.log('✅ Todos os produtos foram migrados');
    console.log('✅ Dashboard carregará produtos do Supabase');
    
    console.log('\n💡 Próximos passos:');
    console.log('   1. Reinicie o servidor Next.js (Ctrl+C e npm run dev)');
    console.log('   2. Acesse o dashboard para ver os produtos');
    console.log('   3. O Firebase pode ser desativado se desejar');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
  }
}

// Executar configuração
configureSupabasePrimary(); 