"use client";

import { useState, useEffect } from 'react';
import type { Bet } from '@/types';
import { Header } from "@/components/layout/header";
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const initialBets: Bet[] = [
  {
    id: '1',
    sport: 'Futebol',
    event: 'Flamengo vs Palmeiras',
    betType: 'Vitória do Flamengo',
    stake: 50,
    odds: 2.1,
    potentialWinnings: 105,
    status: 'pending',
    date: new Date(),
    notes: 'Palmeiras com desfalques importantes no meio campo.'
  },
    {
    id: '2',
    sport: 'Basquete',
    event: 'Lakers vs Celtics',
    betType: 'Mais de 220.5 Pontos',
    stake: 100,
    odds: 1.9,
    potentialWinnings: 190,
    status: 'won',
    date: new Date('2024-07-20'),
    notes: 'Ambos os times com média de pontuação alta nos últimos 5 jogos.'
  }
];

const LOCAL_STORAGE_KEY_BETS = 'product-dash-bets';

export default function BetsPage() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const savedBets = localStorage.getItem(LOCAL_STORAGE_KEY_BETS);
            if (savedBets) {
                setBets(JSON.parse(savedBets).map((b: any) => ({...b, date: new Date(b.date)})));
            } else {
                setBets(initialBets);
            }
        } catch (error) {
            console.error("Failed to load bets from localStorage", error);
            setBets(initialBets);
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Apostas",
                description: "Não foi possível carregar os dados. Usando dados iniciais.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(LOCAL_STORAGE_KEY_BETS, JSON.stringify(bets));
        }
    }, [bets, isLoading]);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                        <BarChart className="w-8 h-8 text-primary" />
                        Dashboard de Apostas
                        </h2>
                        <p className="text-muted-foreground">
                            Gerencie suas apostas, analise riscos e acompanhe seus resultados.
                        </p>
                    </div>
                    <Button size="lg" onClick={() => {}} className="w-full md:w-auto">
                        <PlusCircle className="mr-2"/>
                        Adicionar Aposta
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[250px] w-full" />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-20 bg-muted rounded-lg">
                        <h3 className="text-2xl font-bold">Nenhuma Aposta Encontrada</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Clique no botão abaixo para adicionar sua primeira aposta.</p>
                        <Button size="lg" onClick={() => {}}>
                            <PlusCircle className="mr-2"/>
                            Adicionar Primeira Aposta
                        </Button>
                    </div>
                )}

            </main>
        </div>
    )
}