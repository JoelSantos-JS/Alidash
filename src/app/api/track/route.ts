import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Código de rastreio é obrigatório.' }, { status: 400 });
    }

    // A chave da API agora é lida de forma segura a partir das variáveis de ambiente
    const apiKey = process.env.WONCA_API_KEY;
    if (!apiKey) {
      console.error("WONCA_API_KEY not found in .env file");
      return NextResponse.json({ message: 'A chave da API de rastreio não está configurada no servidor.' }, { status: 500 });
    }

    const response = await fetch('https://api-labs.wonca.com.br/wonca.labs.v1.LabsService/Track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${apiKey}`
      },
      body: JSON.stringify({ code })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Tracking API error:", response.status, responseText);
      // Tenta extrair uma mensagem de erro do corpo da resposta, se possível
      try {
        const errorJson = JSON.parse(responseText);
        return NextResponse.json({ message: errorJson.message || 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      } catch (e) {
        return NextResponse.json({ message: 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      }
    }
    
    // Tenta fazer o parse da resposta como JSON, pois a resposta pode vir vazia
    try {
        const data = JSON.parse(responseText);
        return NextResponse.json(data);
    } catch(e) {
        // Se a resposta for vazia ou não for um JSON válido, mas a requisição foi bem-sucedida (2xx),
        // retorna um objeto vazio ou uma mensagem apropriada.
        return NextResponse.json({ events: [] });
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ message: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
