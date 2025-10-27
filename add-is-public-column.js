const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com SERVICE ROLE KEY
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

async function addIsPublicColumn() {
  console.log('🔧 Adicionando coluna is_public na tabela products...\n');
  
  try {
    console.log('🔗 Conectando ao Supabase com SERVICE ROLE...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Verificar se a coluna já existe
    console.log('\n1. Verificando se a coluna is_public já existe...');
    
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'is_public'
      AND table_schema = 'public';
    `;
    
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('exec_sql', { sql: checkColumnQuery });
    
    if (columnError) {
      console.log('❌ Erro ao verificar coluna (tentando método alternativo):', columnError.message);
      
      // Método alternativo - tentar buscar um produto para ver as colunas
      const { data: sampleProduct, error: sampleError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao buscar produto de exemplo:', sampleError.message);
        return;
      }
      
      if (sampleProduct && sampleProduct.length > 0) {
        const columns = Object.keys(sampleProduct[0]);
        console.log('📋 Colunas atuais da tabela products:');
        columns.forEach(col => console.log(`   - ${col}`));
        
        if (columns.includes('is_public')) {
          console.log('✅ Coluna is_public já existe!');
        } else {
          console.log('❌ Coluna is_public NÃO existe');
        }
      }
    } else {
      if (columnCheck && columnCheck.length > 0) {
        console.log('✅ Coluna is_public já existe!');
      } else {
        console.log('❌ Coluna is_public NÃO existe');
      }
    }
    
    // 2. Adicionar a coluna se não existir
    console.log('\n2. Tentando adicionar coluna is_public...');
    
    const addColumnQuery = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'is_public') THEN
              ALTER TABLE public.products ADD COLUMN is_public BOOLEAN DEFAULT false;
              RAISE NOTICE 'Coluna is_public adicionada com sucesso!';
          ELSE
              RAISE NOTICE 'Coluna is_public já existe!';
          END IF;
      END $$;
    `;
    
    // Tentar executar via RPC
    const { data: addResult, error: addError } = await supabase
      .rpc('exec_sql', { sql: addColumnQuery });
    
    if (addError) {
      console.log('❌ Erro ao adicionar coluna via RPC:', addError.message);
      console.log('\n🚨 AÇÃO MANUAL NECESSÁRIA:');
      console.log('1. Acesse: https://supabase.com/dashboard/project/atyeakcunmhrzzpdcvxm/sql');
      console.log('2. Cole e execute o seguinte SQL:');
      console.log('');
      console.log(addColumnQuery);
      console.log('');
      console.log('3. Depois execute novamente este script para verificar');
      return;
    } else {
      console.log('✅ Comando SQL executado com sucesso!');
    }
    
    // 3. Verificar se a coluna foi adicionada
    console.log('\n3. Verificando se a coluna foi adicionada...');
    
    const { data: verifyProducts, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Erro ao verificar produtos:', verifyError.message);
      return;
    }
    
    if (verifyProducts && verifyProducts.length > 0) {
      const columns = Object.keys(verifyProducts[0]);
      
      if (columns.includes('is_public')) {
        console.log('✅ Coluna is_public foi adicionada com sucesso!');
        
        // 4. Atualizar produtos existentes
        console.log('\n4. Atualizando produtos existentes...');
        
        const { data: allProducts, error: allProductsError } = await supabase
          .from('products')
          .select('*');
        
        if (allProductsError) {
          console.log('❌ Erro ao buscar produtos:', allProductsError.message);
          return;
        }
        
        console.log(`📦 ${allProducts.length} produtos encontrados`);
        
        for (const product of allProducts) {
          const quantitySold = product.quantity_sold || 0;
          const availableStock = product.quantity - quantitySold;
          
          // Determinar se deve ser público
          const shouldBePublic = (product.status === 'selling' || product.status === 'received') && 
                                availableStock > 0;
          
          console.log(`🔧 Atualizando ${product.name}: is_public = ${shouldBePublic}`);
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ is_public: shouldBePublic })
            .eq('id', product.id);
          
          if (updateError) {
            console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
          } else {
            console.log(`   ✅ Atualizado com sucesso`);
          }
        }
        
        // 5. Verificar resultado final
        console.log('\n5. Verificando resultado final...');
        
        const { data: finalProducts, error: finalError } = await supabase
          .from('products')
          .select('*');
        
        if (finalError) {
          console.log('❌ Erro ao verificar resultado final:', finalError.message);
          return;
        }
        
        const publicProducts = finalProducts.filter(p => p.is_public === true);
        const privateProducts = finalProducts.filter(p => p.is_public === false);
        
        console.log('\n📊 RESULTADO FINAL:');
        console.log(`- Total de produtos: ${finalProducts.length}`);
        console.log(`- Produtos públicos: ${publicProducts.length}`);
        console.log(`- Produtos privados: ${privateProducts.length}`);
        
        if (publicProducts.length > 0) {
          console.log('\n🎉 PRODUTOS PÚBLICOS:');
          publicProducts.forEach((product, index) => {
            const quantitySold = product.quantity_sold || 0;
            const availableStock = product.quantity - quantitySold;
            
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Status: ${product.status}`);
            console.log(`   Disponível: ${availableStock}`);
            console.log(`   User: ${product.user_id}`);
            console.log('');
          });
        }
        
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Fazer login na aplicação com joeltere8@gmail.com');
        console.log('2. Verificar se os produtos aparecem na página inicial');
        console.log('3. Verificar a página "Gerenciar Produtos"');
        
      } else {
        console.log('❌ Coluna is_public ainda não foi adicionada');
        console.log('📋 Colunas atuais:');
        columns.forEach(col => console.log(`   - ${col}`));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

addIsPublicColumn();