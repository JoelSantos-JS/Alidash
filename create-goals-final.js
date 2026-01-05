const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGoalsForMainUser() {
  try {
    const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b' // joeltere8@gmail.com
    
    console.log(`Criando metas para o usuário: ${userId}`)
    
    const sampleGoals = [
      {
        user_id: userId,
        name: 'Viagem Chile',
        description: 'Economizar para uma viagem de 15 dias ao Chile',
        current_value: 2500.00,
        target_value: 8000.00,
        type: 'savings',
        unit: 'BRL',
        priority: 'medium',
        status: 'active',
        deadline: '2025-12-31',
        category: 'personal'
      },
      {
        user_id: userId,
        name: 'Viagem Japão',
        description: 'Realizar o sonho de conhecer o Japão',
        current_value: 1200.00,
        target_value: 15000.00,
        type: 'savings',
        unit: 'BRL',
        priority: 'high',
        status: 'active',
        deadline: '2026-03-15',
        category: 'personal'
      },
      {
        user_id: userId,
        name: 'Fundo de Emergência',
        description: 'Reserva de emergência para 6 meses de gastos',
        current_value: 5000.00,
        target_value: 18000.00,
        type: 'savings',
        unit: 'BRL',
        priority: 'high',
        status: 'active',
        deadline: '2025-06-30',
        category: 'financial'
      }
    ]
    
    console.log('Inserindo metas...')
    
    for (const goal of sampleGoals) {
      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
      
      if (error) {
        console.error(`Erro ao criar meta "${goal.name}":`, error)
      } else {
        console.log(`✓ Meta criada: ${data[0].name} (R$ ${data[0].current_value} / R$ ${data[0].target_value})`)
      }
    }
    
    console.log('\nVerificando metas criadas...')
    const { data: allGoals, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
    
    if (fetchError) {
      console.error('Erro ao buscar metas:', fetchError)
    } else {
      console.log(`\nTotal de metas para o usuário: ${allGoals.length}`)
      allGoals.forEach(goal => {
        console.log(`- ${goal.name}: R$ ${goal.current_value} / R$ ${goal.target_value}`)
      })
    }
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

createGoalsForMainUser()
