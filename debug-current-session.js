require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCurrentSession() {
  try {
    console.log('🔍 Debugando sessão atual e produtos...\n');
    
    // 1. Verificar usuários e produtos
    console.log('📊 1. Verificando usuários e produtos no banco...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError);
      return;
    }
    
    console.log(`✅ Usuários encontrados: ${users.length}`);
    console.log(`✅ Produtos encontrados: ${products.length}\n`);
    
    // 2. Mostrar detalhes dos usuários com produtos
    console.log('👥 2. Usuários com produtos:');
    users.forEach(user => {
      const userProducts = products.filter(p => p.user_id === user.id);
      if (userProducts.length > 0) {
        console.log(`   📧 ${user.email || user.name} (ID: ${user.id})`);
        console.log(`   📦 Produtos: ${userProducts.length}`);
        userProducts.forEach(product => {
          console.log(`      - ${product.name} (${product.status})`);
        });
        console.log('');
      }
    });
    
    // 3. Testar API diretamente
    console.log('🌐 3. Testando API de produtos...');
    
    const joelUserId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b';
    
    try {
      const response = await axios.get(`http://localhost:3001/api/products/get?user_id=${joelUserId}`, {
        timeout: 5000
      });
      
      console.log(`✅ API respondeu com status: ${response.status}`);
      console.log(`📦 Produtos retornados: ${response.data.products?.length || 0}`);
      
      if (response.data.products && response.data.products.length > 0) {
        console.log('📋 Produtos da API:');
        response.data.products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - ${product.status}`);
        });
      }
      
    } catch (apiError) {
      console.error('❌ Erro ao testar API:', apiError.message);
      if (apiError.code === 'ECONNREFUSED') {
        console.log('⚠️ Servidor não está rodando na porta 3001');
      }
    }
    
    // 4. Verificar se há produtos com status correto
    console.log('\n📊 4. Análise de status dos produtos:');
    const statusCount = {};
    products.forEach(product => {
      statusCount[product.status] = (statusCount[product.status] || 0) + 1;
    });
    
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} produtos`);
    });
    
    // 5. Verificar produtos "disponíveis" (não vendidos)
    const availableProducts = products.filter(p => 
      p.status !== 'sold' && p.status !== 'cancelled'
    );
    
    console.log(`\n📦 5. Produtos disponíveis para catálogo: ${availableProducts.length}`);
    availableProducts.forEach(product => {
      console.log(`   - ${product.name} (${product.status}) - Usuário: ${product.user_id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugCurrentSession();