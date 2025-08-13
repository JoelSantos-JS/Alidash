
import { NextResponse } from 'next/server';

interface TrackEvent {
  codigo: string;
  tipo: string;
  dtHrCriado: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
  descricao: string;
  unidade: any;
  unidadeDestino?: any;
}

export async function POST(request: Request) {
  try {
    const { code, apiKey: clientApiKey } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Código de rastreio é obrigatório.' }, { status: 400 });
    }

    // Use client-provided API key or fallback to environment variable
    const apiKey = clientApiKey || process.env.WONCA_API_KEY;
    if (!apiKey) {
      console.error("No API key provided and WONCA_API_KEY not found in .env file");
      return NextResponse.json({ message: 'Chave da API de rastreio não configurada. Configure nas Configurações.' }, { status: 500 });
    }

    const response = await fetch('https://api-labs.wonca.com.br/wonca.labs.v1.LabsService/Track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${apiKey}`
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tracking API error:", response.status, errorText);
       try {
        const errorJson = JSON.parse(errorText);
        
        // Handle specific Wonca Labs errors
        if (errorJson.code === 'unauthenticated' && errorJson.message === 'no rows in result set') {
          return NextResponse.json({ 
            message: 'Código de rastreio não encontrado. Verifique se o código está correto ou se o objeto ainda não foi postado.' 
          }, { status: 404 });
        }
        
        return NextResponse.json({ message: errorJson.message || 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      } catch (e) {
        return NextResponse.json({ message: 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      }
    }
    
    const responseData = await response.json();

    // Parse the nested JSON string
    let trackingData;
    if (responseData && responseData.json) {
        trackingData = JSON.parse(responseData.json);
    } else {
        trackingData = responseData;
    }

    // Check if events exist and is an array
    if (trackingData && trackingData.eventos && Array.isArray(trackingData.eventos)) {
        // Transform the events to have a simpler date format.
        const transformedEvents = trackingData.eventos.map((event: TrackEvent) => {
            const [datePart, timePart] = event.dtHrCriado.date.split(' ');
            return {
                description: event.descricao,
                location: `${event.unidade.endereco?.cidade || event.unidade.nome || 'Origem'} - ${event.unidade.endereco?.uf || ''}`.trim().replace(/ - $/, ''),
                date: datePart,
                time: timePart.substring(0, 5), // Get only HH:mm
            };
        });
        
        // Return a new object with the simplified events list.
        return NextResponse.json({ code: trackingData.codObjeto, events: transformedEvents });
    } else {
        // No events found or invalid structure
        return NextResponse.json({ code: trackingData?.codObjeto || code, events: [] });
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ message: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

