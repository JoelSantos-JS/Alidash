const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createSampleGoals() {
  try {
    // Buscar um usuário existente
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado')
      return
    }

    const userId = users[0].id
    console.log('👤 Usando usuário:', userId)

    // Criar metas de exemplo
    const sampleGoals = [
      {
        user_id: userId,
        name: 'Viagem Chile',
        description: 'Economizar para viagem ao Chile',
        category: 'financial',
        type: 'savings',
        target_value: 5000,
        current_value: 1250,
        unit: 'BRL',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        priority: 'medium',
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Viagem Japão',
        description: 'Economizar para viagem ao Japão',
        category: 'financial',
        type: 'savings',
        target_value: 8000,
        current_value: 2400,
        unit: 'BRL',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
        priority: 'high',
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Fundo de Emergência',
        description: 'Criar reserva de emergência',
        category: 'financial',
        type: 'savings',
        target_value: 10000,
        current_value: 3500,
        unit: 'BRL',
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 dias
        priority: 'high',
        status: 'active'
      }
    ]

    // Inserir as metas
    const { data, error } = await supabase
      .from('goals')
      .insert(sampleGoals)
      .select()

    if (error) {
      console.error('❌ Erro ao criar metas:', error)
      return
    }

    console.log('✅ Metas criadas com sucesso:')
    data.forEach((goal, index) => {
      console.log(`${index + 1}. ${goal.name} - R$ ${goal.current_value}/${goal.target_value}`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

createSampleGoals()