
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

interface TrackingViewProps {
  trackingCode?: string;
}

interface TrackEvent {
  description: string;
  location: string;
  date: string;
  time: string;
}

interface TrackingData {
  code: string;
  events: TrackEvent[];
}

export function TrackingView({ trackingCode }: TrackingViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTrack = async () => {
    if (!trackingCode) {
      toast({
        variant: 'destructive',
        title: 'Código Inválido',
        description: 'Por favor, insira um código de rastreio para buscar.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      // Get API key from localStorage if available
      const storedApiKey = localStorage.getItem('wonca_api_key');
      
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: trackingCode,
          ...(storedApiKey && { apiKey: storedApiKey })
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Falha ao buscar dados de rastreio.');
      }
      
      if (result.events !== undefined) {
        setTrackingData(result);
        if (result.events.length === 0) {
          // Only show info message, don't set error when we have valid tracking data
          console.log('Código válido mas sem eventos ainda');
        }
      } else {
        setError('Nenhum evento de rastreio encontrado para este código.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      toast({
        variant: 'destructive',
        title: 'Erro na Busca',
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleTrack} disabled={isLoading || !trackingCode}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Rastrear Produto
      </Button>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle />
              Erro ao Rastrear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {trackingData && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                     <CheckCircle className="text-green-500" />
                    Status da Encomenda: {trackingCode}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {trackingData.events.length > 0 ? (
                    <div className="relative pl-6">
                     {trackingData.events.map((event, index) => (
                        <div key={index} className="relative pb-8">
                             {index !== trackingData.events.length - 1 && (
                                <div className="absolute left-[5px] top-[10px] h-full w-0.5 bg-border" />
                            )}
                            <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary" />
                            <div className="ml-6">
                                <p className="font-bold text-sm">{event.description}</p>
                                <p className="text-xs text-muted-foreground">{event.location}</p>
                                <p className="text-xs text-muted-foreground">{event.date} às {event.time}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Este código de rastreio é válido, mas ainda não possui eventos de movimentação.</p>
                        <p className="text-sm text-muted-foreground mt-2">Verifique novamente mais tarde.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
