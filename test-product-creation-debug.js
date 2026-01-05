const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testProductCreation() {
  const userId = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc'
  
  const productData = {
    name: 'Produto Debug Test',
    category: 'Eletrônicos',
    supplier: 'AliExpress',
    aliexpressLink: 'https://example.com',
    imageUrl: 'https://example.com/image.jpg',
    description: 'Produto de teste para debug',
    notes: '',
    trackingCode: '',
    purchaseEmail: '',
    purchasePrice: 50,
    shippingCost: 10,
    importTaxes: 5,
    packagingCost: 2,
    marketingCost: 3,
    otherCosts: 1,
    sellingPrice: 100,
    expectedProfit: 29,
    profitMargin: 29,
    sales: [],
    quantity: 1,
    quantitySold: 0,
    status: 'purchased',
    purchaseDate: new Date().toISOString(),
    roi: 0,
    actualProfit: 0
  }

  try {
    console.log('🔍 Testando criação de produto...')
    console.log('User ID:', userId)
    console.log('Product Data:', JSON.stringify(productData, null, 2))

    const { data, error } = await supabase
      .from('products')
      .insert([{
        user_id: userId,
        ...productData
      }])
      .select()

    if (error) {
      console.error('❌ Erro do Supabase:', error)
      console.error('Código do erro:', error.code)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      console.error('Message:', error.message)
    } else {
      console.log('✅ Produto criado com sucesso:', data)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testProductCreation()
