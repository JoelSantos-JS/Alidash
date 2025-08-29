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

async function cleanTestProducts() {
  console.log('🧹 Limpando produtos de teste...\n');

  try {
    const userId = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc'; // ID do joeltere9

    // Buscar produtos de teste
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', '%Teste%');

    if (fetchError) {
      console.log('❌ Erro ao buscar produtos:', fetchError.message);
      return;
    }

    console.log(`📋 ${products?.length || 0} produtos de teste encontrados`);

    if (products && products.length > 0) {
      // Deletar produtos de teste
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('user_id', userId)
        .ilike('name', '%Teste%');

      if (deleteError) {
        console.log('❌ Erro ao deletar produtos:', deleteError.message);
      } else {
        console.log(`✅ ${products.length} produtos de teste removidos`);
      }
    } else {
      console.log('ℹ️ Nenhum produto de teste encontrado');
    }

    // Verificar produtos restantes
    const { data: remainingProducts, error: remainingError } = await supabase
      .from('products')
      .select('id, name')
      .eq('user_id', userId);

    if (remainingError) {
      console.log('❌ Erro ao verificar produtos restantes:', remainingError.message);
    } else {
      console.log(`📊 ${remainingProducts?.length || 0} produtos restantes`);
      if (remainingProducts && remainingProducts.length > 0) {
        remainingProducts.forEach(product => {
          console.log(`   - ${product.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanTestProducts().then(() => {
  console.log('\n🏁 Limpeza finalizada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 