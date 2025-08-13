
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
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ message: 'Código de rastreio é obrigatório.' }, { status: 400 });
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tracking API error:", response.status, errorText);
       try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json({ message: errorJson.message || 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      } catch (e) {
        return NextResponse.json({ message: 'Falha ao buscar informações de rastreio.' }, { status: response.status });
      }
    }
    
    const outerJson = await response.json();
    
    if (outerJson && typeof outerJson.json === 'string') {
        const innerJson = JSON.parse(outerJson.json);

        // Transform the events to have a simpler date format.
        const transformedEvents = innerJson.events.map((event: TrackEvent) => {
            const [datePart, timePart] = event.dtHrCriado.date.split(' ');
            return {
                description: event.descricao,
                location: `${event.unidade.endereco?.cidade || 'Origem'} - ${event.unidade.endereco?.uf || event.unidade.nome}`,
                date: datePart,
                time: timePart.substring(0, 5), // Get only HH:mm
            };
        });
        
        // Return a new object with the simplified events list.
        return NextResponse.json({ code: innerJson.codObjeto, events: transformedEvents });
    } else {
         // This case handles if the response format is different or empty
        return NextResponse.json({ events: [] });
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ message: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

