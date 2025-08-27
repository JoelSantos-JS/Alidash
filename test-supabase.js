// Teste simples de conexão com Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    // Testar se consegue acessar a tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError)
    } else {
      console.log('✅ Tabela users acessível:', users?.length || 0, 'registros')
    }
    
    // Testar se consegue acessar a tabela revenues
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .limit(1)
    
    if (revenuesError) {
      console.error('❌ Erro ao acessar tabela revenues:', revenuesError)
    } else {
      console.log('✅ Tabela revenues acessível:', revenues?.length || 0, 'registros')
    }
    
    // Testar inserção simples
    const testRevenue = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      date: new Date().toISOString(),
      description: 'Teste de conexão',
      amount: 100.00,
      category: 'Teste',
      source: 'other'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('revenues')
      .insert(testRevenue)
      .select()
    
    if (insertError) {
      console.error('❌ Erro ao inserir receita de teste:', insertError)
    } else {
      console.log('✅ Receita de teste inserida:', insertData)
      
      // Limpar o teste
      if (insertData && insertData[0]) {
        await supabase
          .from('revenues')
          .delete()
          .eq('id', insertData[0].id)
        console.log('🧹 Receita de teste removida')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testConnection()