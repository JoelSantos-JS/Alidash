import fetch from 'node-fetch'

async function main() {
  const urlArg = process.argv[2] || process.env.TEST_URL || 'http://localhost:3001/api/webhooks/cakto'
  const eventArg = process.argv[3] || 'pix_gerado'
  const emailArg = process.argv[4] || 'cliente@example.com'

  const url = urlArg.replace(/\/+$/, '')
  let payload
  if (eventArg === 'purchase_approved') {
    payload = {
      event: 'purchase_approved',
      email: emailArg,
      orderId: 'ORD-TEST-123',
      amount: 19990,
      currency: 'BRL'
    }
  } else if (eventArg === 'assinatura_criada' || eventArg === 'subscription_created') {
    payload = {
      event: eventArg,
      customer: { email: emailArg },
      data: { subscription: { status: 'active', customer: { email: emailArg } } }
    }
  } else {
    payload = {
      event: 'pix_gerado',
      email: emailArg,
      pix: {
        qrCode: 'data:image/png;base64,TESTE',
        expirationDate: '2025-12-31T23:59:59Z'
      }
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', text)
  } catch (err) {
    console.error('Erro ao testar webhook:', err)
    process.exit(1)
  }
}

main()