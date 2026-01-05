const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured');
  process.exit(1);
}

async function checkDatabaseWithServiceKey() {
  console.log('🔍 Verificação do banco de dados com SERVICE ROLE KEY...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase com SERVICE ROLE...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar tabelas disponíveis
    console.log('\n1. Verificando tabelas disponíveis...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('❌ Erro ao buscar tabelas (tentando método alternativo):', tablesError.message);
      
      // Método alternativo - tentar buscar diretamente das tabelas conhecidas
      console.log('\n📋 Tentando acessar tabelas conhecidas diretamente...');
      
      const knownTables = ['users', 'products', 'transactions', 'personal_income', 'personal_expenses'];
      
      for (const tableName of knownTables) {
        try {
          console.log(`\n🔍 Verificando tabela: ${tableName}`);
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`   ❌ Erro ao acessar ${tableName}:`, error.message);
          } else {
            console.log(`   ✅ ${tableName}: ${count || 0} registros`);
          }
        } catch (err) {
          console.log(`   ❌ Erro ao verificar ${tableName}:`, err.message);
        }
      }
    } else {
      console.log('✅ Tabelas encontradas:', tables);
    }
    
    // 2. Buscar todos os usuários
    console.log('\n2. Buscando todos os usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log(`✅ ${users.length} usuário(s) encontrado(s)`);
      
      if (users.length > 0) {
        console.log('\n👥 USUÁRIOS ENCONTRADOS:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id}`);
          console.log(`   Email: ${user.email || 'N/A'}`);
          console.log(`   Nome: ${user.name || 'N/A'}`);
          console.log(`   Firebase UID: ${user.firebase_uid || 'N/A'}`);
          console.log(`   Criado em: ${user.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }
    
    // 3. Buscar todos os produtos
    console.log('\n3. Buscando todos os produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
    } else {
      console.log(`✅ ${products.length} produto(s) encontrado(s)`);
      
      if (products.length > 0) {
        console.log('\n📦 PRODUTOS ENCONTRADOS:');
        products.forEach((product, index) => {
          const quantitySold = product.quantity_sold || 0;
          const availableStock = product.quantity - quantitySold;
          const shouldAppear = availableStock > 0 && 
                             (product.status === 'selling' || product.status === 'received') &&
                             product.is_public === true;
          
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   User ID: ${product.user_id}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Status: ${product.status}`);
          console.log(`   Quantidade: ${product.quantity}`);
          console.log(`   Vendidos: ${quantitySold}`);
          console.log(`   Disponível: ${availableStock}`);
          console.log(`   Público: ${product.is_public}`);
          console.log(`   Deveria aparecer: ${shouldAppear ? '✅ SIM' : '❌ NÃO'}`);
          console.log(`   Criado em: ${product.created_at || 'N/A'}`);
          console.log('');
        });
      }
    }
    
    // 4. Verificar outras tabelas importantes
    console.log('\n4. Verificando outras tabelas...');
    const otherTables = ['transactions', 'personal_income', 'personal_expenses'];
    
    for (const tableName of otherTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(5);
        
        if (error) {
          console.log(`❌ ${tableName}: Erro - ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${count || 0} registros`);
          if (data && data.length > 0) {
            console.log(`   Primeiros registros:`, data.slice(0, 2));
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: Erro - ${err.message}`);
      }
    }
    
    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`- Usuários: ${users ? users.length : 'Erro ao buscar'}`);
    console.log(`- Produtos: ${products ? products.length : 'Erro ao buscar'}`);
    
    if (users && users.length === 0 && products && products.length === 0) {
      console.log('\n🚨 DIAGNÓSTICO: Banco de dados está vazio!');
      console.log('   Possíveis causas:');
      console.log('   1. Dados foram limpos recentemente');
      console.log('   2. Estamos conectando ao ambiente errado');
      console.log('   3. Políticas RLS estão bloqueando o acesso');
      console.log('   4. Dados estão em outro schema/database');
      
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   1. Fazer login na aplicação para criar dados');
      console.log('   2. Verificar se há dados no Firebase');
      console.log('   3. Executar scripts de criação de dados de teste');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkDatabaseWithServiceKey();
