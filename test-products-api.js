// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ID de teste (UUID válido)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function testProductsAPI() {
  console.log('🚀 Testando APIs de produtos...\n');

  try {
    // 0. Criar usuário de teste se não existir
    console.log('👤 Verificando/criando usuário de teste...');
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', TEST_USER_ID)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // Usuário não existe, vamos criar
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: TEST_USER_ID,
          firebase_uid: 'test-firebase-uid',
          email: 'test@example.com',
          name: 'Usuário Teste',
          account_type: 'personal'
        })
        .select()
        .single();

      if (createUserError) {
        console.log('❌ Erro ao criar usuário de teste:', createUserError.message);
        return;
      } else {
        console.log('✅ Usuário de teste criado com sucesso');
      }
    } else if (userCheckError) {
      console.log('❌ Erro ao verificar usuário:', userCheckError.message);
      return;
    } else {
      console.log('✅ Usuário de teste já existe');
    }

    // 1. Verificar se a tabela de produtos existe
    console.log('\n📋 Verificando tabela de produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.log('❌ Erro ao acessar tabela de produtos:', productsError.message);
      console.log('   Verifique se a tabela "products" existe no Supabase');
      return;
    } else {
      console.log('✅ Tabela de produtos existe e está acessível');
    }

    // 2. Verificar produtos existentes
    console.log('\n📋 Verificando produtos existentes...');
    const { data: existingProducts, error: existingError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', TEST_USER_ID);

    if (existingError) {
      console.log('⚠️ Erro ao buscar produtos existentes:', existingError.message);
    } else {
      console.log(`✅ ${existingProducts?.length || 0} produtos encontrados para o usuário de teste`);
    }

    // 3. Testar criação de produto
    console.log('\n➕ Testando criação de produto...');
    const testProduct = {
      user_id: TEST_USER_ID,
      name: 'Produto Teste API',
      category: 'Teste',
      supplier: 'Fornecedor Teste',
      aliexpress_link: 'https://example.com',
      image_url: '',
      description: 'Produto criado para testar API',
      purchase_price: 100,
      shipping_cost: 20,
      import_taxes: 10,
      packaging_cost: 5,
      marketing_cost: 15,
      other_costs: 0,
      selling_price: 200,
      expected_profit: 50,
      profit_margin: 25,
      quantity: 1,
      quantity_sold: 0,
      status: 'purchased',
      purchase_date: new Date().toISOString(),
      roi: 33.33,
      actual_profit: 0
    };

    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (createError) {
      console.log('❌ Erro ao criar produto:', createError.message);
      console.log('   Detalhes do erro:', createError);
    } else {
      console.log('✅ Produto criado com sucesso!');
      console.log(`   - ID: ${newProduct.id}`);
      console.log(`   - Nome: ${newProduct.name}`);
      console.log(`   - Preço de compra: R$ ${newProduct.purchase_price}`);
      console.log(`   - Preço de venda: R$ ${newProduct.selling_price}`);

      // 4. Testar atualização de produto
      console.log('\n🔄 Testando atualização de produto...');
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({ 
          selling_price: 250,
          status: 'selling'
        })
        .eq('id', newProduct.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Erro ao atualizar produto:', updateError.message);
      } else {
        console.log('✅ Produto atualizado com sucesso!');
        console.log(`   - Novo preço de venda: R$ ${updatedProduct.selling_price}`);
        console.log(`   - Novo status: ${updatedProduct.status}`);
      }

      // 5. Testar exclusão de produto
      console.log('\n🗑️ Testando exclusão de produto...');
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', newProduct.id);

      if (deleteError) {
        console.log('❌ Erro ao deletar produto:', deleteError.message);
      } else {
        console.log('✅ Produto deletado com sucesso!');
      }
    }

    // 6. Verificar estrutura da tabela
    console.log('\n📊 Verificando estrutura da tabela...');
    const { data: sampleProduct, error: sampleError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao verificar estrutura:', sampleError.message);
    } else if (sampleProduct && sampleProduct.length > 0) {
      console.log('✅ Estrutura da tabela:');
      const columns = Object.keys(sampleProduct[0]);
      columns.forEach(col => console.log(`   - ${col}`));
    }

    console.log('\n✅ Teste de APIs concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testProductsAPI().then(() => {
  console.log('\n🏁 Teste finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 