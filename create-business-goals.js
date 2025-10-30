const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBusinessGoals() {
  try {
    console.log('🏢 Criando metas empresariais de teste...');
    
    // Primeiro, vamos buscar um user_id válido
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Usando user_id:', userId);
    
    // Criar metas empresariais com valores realistas
    const businessGoals = [
      {
        user_id: userId,
        name: 'Fundo de Emergência',
        description: 'Reserva de emergência para 6 meses de gastos',
        category: 'business',
        type: 'savings',
        target_value: 15000.00,
        current_value: 8500.00, // 56.7% de progresso
        unit: 'BRL',
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 meses
        priority: 'high',
        status: 'active',
        notes: 'Meta prioritária para segurança financeira'
      },
      {
        user_id: userId,
        name: 'Viagem Chile',
        description: 'Economizar para uma viagem de 15 dias ao Chile',
        category: 'business',
        type: 'savings',
        target_value: 8000.00,
        current_value: 3200.00, // 40% de progresso
        unit: 'BRL',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 meses
        priority: 'medium',
        status: 'active',
        notes: 'Incluindo passagens, hospedagem e gastos'
      },
      {
        user_id: userId,
        name: 'Viagem Japão',
        description: 'Realizar o sonho de conhecer o Japão',
        category: 'business',
        type: 'savings',
        target_value: 25000.00,
        current_value: 1200.00, // 4.8% de progresso
        unit: 'BRL',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        priority: 'high',
        status: 'active',
        notes: 'Viagem dos sonhos para 2026'
      },
      {
        user_id: userId,
        name: 'Meta de Faturamento',
        description: 'Atingir R$ 50.000 em vendas mensais',
        category: 'business',
        type: 'revenue',
        target_value: 50000.00,
        current_value: 32000.00, // 64% de progresso
        unit: 'BRL',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 meses
        priority: 'high',
        status: 'active',
        notes: 'Meta de crescimento para Q1 2025'
      },
      {
        user_id: userId,
        name: 'Expansão de Produtos',
        description: 'Lançar 10 novos produtos no catálogo',
        category: 'business',
        type: 'quantity',
        target_value: 10.00,
        current_value: 6.00, // 60% de progresso
        unit: 'quantity',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 meses
        priority: 'medium',
        status: 'active',
        notes: 'Diversificação do portfólio de produtos'
      },
      {
        user_id: userId,
        name: 'Redução de Custos',
        description: 'Reduzir custos operacionais em 15%',
        category: 'business',
        type: 'percentage',
        target_value: 15.00,
        current_value: 0.00, // 0% de progresso - para testar o problema
        unit: 'percentage',
        deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 meses
        priority: 'medium',
        status: 'active',
        notes: 'Otimização de processos e fornecedores'
      }
    ];
    
    // Inserir as metas
    const { data, error } = await supabase
      .from('goals')
      .insert(businessGoals)
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar metas empresariais:', error);
      return;
    }
    
    console.log('✅ Metas empresariais criadas com sucesso!');
    console.log('📊 Total de metas criadas:', data.length);
    
    data.forEach((goal, index) => {
      const progress = ((goal.current_value / goal.target_value) * 100).toFixed(1);
      console.log(`${index + 1}. ${goal.name}`);
      console.log(`   Progresso: ${progress}% (${goal.current_value}/${goal.target_value})`);
      console.log(`   Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createBusinessGoals();