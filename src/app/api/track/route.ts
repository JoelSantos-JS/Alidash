import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Código de rastreio é obrigatório.' }, { status: 400 });
    }

    const response = await fetch('https://api-labs.wonca.com.br/wonca.labs.v1.LabsService/Track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${process.env.WONCA_API_KEY}`
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Tracking API error:", errorData);
      return NextResponse.json({ message: 'Falha ao buscar informações de rastreio.' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
