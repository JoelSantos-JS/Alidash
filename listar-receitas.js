const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listarTodasReceitas() {
  console.log('🔍 Buscando todas as receitas no banco de dados VoxCash...\n');
  
  try {
    console.log('📊 RECEITAS EMPRESARIAIS (tabela: revenues)');
    console.log('='.repeat(60));
    
    // Buscar todas as receitas empresariais
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .order('date', { ascending: false });
    
    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas empresariais:', revenuesError);
    } else {
      console.log(`✅ Total de receitas empresariais: ${revenues?.length || 0}\n`);
      
      if (revenues && revenues.length > 0) {
        revenues.forEach((revenue, index) => {
          console.log(`${index + 1}. ID: ${revenue.id}`);
          console.log(`   Descrição: ${revenue.description}`);
          console.log(`   Valor: R$ ${revenue.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`   Categoria: ${revenue.category}`);
          console.log(`   Fonte: ${revenue.source}`);
          console.log(`   Data: ${new Date(revenue.date).toLocaleDateString('pt-BR')}`);
          console.log(`   Usuário: ${revenue.user_id}`);
          if (revenue.notes) console.log(`   Observações: ${revenue.notes}`);
          console.log('');
        });
      } else {
        console.log('📝 Nenhuma receita empresarial encontrada.\n');
      }
    }
    
    console.log('\n💰 RECEITAS PESSOAIS (tabela: personal_incomes)');
    console.log('='.repeat(60));
    
    // Buscar todas as receitas pessoais
    const { data: personalIncomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .select('*')
      .order('date', { ascending: false });
    
    if (incomesError) {
      console.error('❌ Erro ao buscar receitas pessoais:', incomesError);
    } else {
      console.log(`✅ Total de receitas pessoais: ${personalIncomes?.length || 0}\n`);
      
      if (personalIncomes && personalIncomes.length > 0) {
        personalIncomes.forEach((income, index) => {
          console.log(`${index + 1}. ID: ${income.id}`);
          console.log(`   Descrição: ${income.description}`);
          console.log(`   Valor: R$ ${income.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          console.log(`   Categoria: ${income.category}`);
          console.log(`   Fonte: ${income.source}`);
          console.log(`   Data: ${new Date(income.date).toLocaleDateString('pt-BR')}`);
          console.log(`   Usuário: ${income.user_id}`);
          console.log(`   Recorrente: ${income.is_recurring ? 'Sim' : 'Não'}`);
          console.log(`   Tributável: ${income.is_taxable ? 'Sim' : 'Não'}`);
          if (income.tax_withheld > 0) console.log(`   Imposto Retido: R$ ${income.tax_withheld?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          if (income.notes) console.log(`   Observações: ${income.notes}`);
          console.log('');
        });
      } else {
        console.log('📝 Nenhuma receita pessoal encontrada.\n');
      }
    }
    
    // Resumo final
    const totalReceitas = (revenues?.length || 0) + (personalIncomes?.length || 0);
    const valorTotalEmpresarial = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const valorTotalPessoal = personalIncomes?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const valorTotal = valorTotalEmpresarial + valorTotalPessoal;
    
    console.log('\n📈 RESUMO GERAL');
    console.log('='.repeat(60));
    console.log(`📊 Total de receitas no banco: ${totalReceitas}`);
    console.log(`💼 Receitas empresariais: ${revenues?.length || 0} (R$ ${valorTotalEmpresarial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    console.log(`👤 Receitas pessoais: ${personalIncomes?.length || 0} (R$ ${valorTotalPessoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
    console.log(`💰 Valor total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    // Buscar informações dos usuários
    console.log('\n👥 USUÁRIOS COM RECEITAS');
    console.log('='.repeat(60));
    
    const allUserIds = new Set([
      ...(revenues?.map(r => r.user_id) || []),
      ...(personalIncomes?.map(i => i.user_id) || [])
    ]);
    
    if (allUserIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(allUserIds));
      
      if (!usersError && users) {
        users.forEach(user => {
          const userRevenues = revenues?.filter(r => r.user_id === user.id) || [];
          const userIncomes = personalIncomes?.filter(i => i.user_id === user.id) || [];
          const userTotal = userRevenues.length + userIncomes.length;
          
          console.log(`👤 ${user.name || 'Nome não informado'} (${user.email})`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Receitas empresariais: ${userRevenues.length}`);
          console.log(`   Receitas pessoais: ${userIncomes.length}`);
          console.log(`   Total: ${userTotal} receitas`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar receitas:', error);
  }
}

// Executar o script
listarTodasReceitas().then(() => {
  console.log('\n✅ Consulta concluída!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});