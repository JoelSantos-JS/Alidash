"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Bet } from '@/types';
import { Header } from "@/components/layout/header";
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BetCard } from '@/components/bets/bet-card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { BetForm } from '@/components/bets/bet-form';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { BetPerformanceChart } from '@/components/bets/bet-performance-chart';
import { BetStatusChart } from '@/components/bets/bet-status-chart';


const initialBets: Bet[] = [
  {
    id: '1',
    sport: 'Futebol',
    event: 'Flamengo vs Palmeiras',
    betType: 'Vitória do Flamengo',
    stake: 50,
    odds: 2.1,
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
    status: 'won',
    date: new Date('2024-07-20'),
    notes: 'Ambos os times com média de pontuação alta nos últimos 5 jogos.'
  },
   {
    id: '3',
    sport: 'Futebol',
    event: 'Corinthians vs São Paulo',
    betType: 'Empate',
    stake: 20,
    odds: 3.4,
    status: 'lost',
    date: new Date('2024-07-21'),
  }
];

const LOCAL_STORAGE_KEY_BETS = 'product-dash-bets';

export default function BetsPage() {
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [betToEdit, setBetToEdit] = useState<Bet | null>(null);
    const [betToDelete, setBetToDelete] = useState<Bet | null>(null);
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
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY_BETS, JSON.stringify(bets));
            } catch(error) {
                 console.error("Failed to save bets to localStorage", error);
            }
        }
    }, [bets, isLoading]);

    const summaryStats = useMemo(() => {
        const totalStaked = bets.reduce((acc, bet) => acc + bet.stake, 0);
        const totalWon = bets.filter(b => b.status === 'won').reduce((acc, bet) => acc + (bet.stake * bet.odds - bet.stake), 0);
        const totalLost = bets.filter(b => b.status === 'lost').reduce((acc, bet) => acc + bet.stake, 0);
        const netProfit = totalWon - totalLost;
        
        const finishedBetsCount = bets.filter(b => b.status === 'won' || b.status === 'lost').length;
        const wonBetsCount = bets.filter(b => b.status === 'won').length;
        const winRate = finishedBetsCount > 0 ? (wonBetsCount / finishedBetsCount) * 100 : 0;

        return { totalStaked, netProfit, winRate };
    }, [bets]);

    const handleOpenForm = (bet: Bet | null = null) => {
        setBetToEdit(bet);
        setIsFormOpen(true);
    }

    const handleSaveBet = (betData: Omit<Bet, 'id'>) => {
        if(betToEdit) {
            setBets(bets.map(b => b.id === betToEdit.id ? { ...betToEdit, ...betData } : b));
            toast({ title: "Aposta Atualizada!", description: `A aposta no evento "${betData.event}" foi atualizada.` });
        } else {
            const newBet: Bet = { ...betData, id: new Date().getTime().toString() };
            setBets([newBet, ...bets]);
            toast({ title: "Aposta Adicionada!", description: `Sua aposta em "${betData.event}" foi registrada.` });
        }
        setIsFormOpen(false);
        setBetToEdit(null);
    }

    const handleDeleteBet = (betId: string) => {
        const bet = bets.find(b => b.id === betId);
        if (!bet) return;
        setBets(bets.filter(b => b.id !== betId));
        setBetToDelete(null);
        toast({ variant: 'destructive', title: "Aposta Excluída!", description: `A aposta em "${bet.event}" foi removida.` });
    }

    return (
        <>
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
                    <Button size="lg" onClick={() => handleOpenForm()} className="w-full md:w-auto">
                        <PlusCircle className="mr-2"/>
                        Adicionar Aposta
                    </Button>
                </div>
                 {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-[116px] w-full" />
                        ))}
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <SummaryCard
                            title="Total Apostado"
                            value={summaryStats.totalStaked}
                            icon={DollarSign}
                            isCurrency
                        />
                         <SummaryCard
                            title="Lucro / Prejuízo"
                            value={summaryStats.netProfit}
                            icon={summaryStats.netProfit >= 0 ? TrendingUp : TrendingDown}
                            isCurrency
                            className={summaryStats.netProfit >= 0 ? "text-green-500" : "text-destructive"}
                        />
                         <SummaryCard
                            title="Taxa de Vitória"
                            value={summaryStats.winRate}
                            icon={Percent}
                            isPercentage
                        />
                    </div>
                 )}

                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                    <div className="lg:col-span-3">
                        <BetPerformanceChart data={bets} isLoading={isLoading}/>
                    </div>
                    <div className="lg:col-span-2">
                        <BetStatusChart data={bets} isLoading={isLoading}/>
                    </div>
                 </div>


                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[250px] w-full" />
                        ))}
                    </div>
                ) : bets.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bets.map(bet => (
                            <BetCard 
                                key={bet.id} 
                                bet={bet} 
                                onEdit={() => handleOpenForm(bet)}
                                onDelete={() => setBetToDelete(bet)}
                            />
                        ))}
                     </div>
                ) : (
                     <div className="text-center py-20 bg-muted rounded-lg">
                        <h3 className="text-2xl font-bold">Nenhuma Aposta Encontrada</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Clique no botão abaixo para adicionar sua primeira aposta.</p>
                        <Button size="lg" onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2"/>
                            Adicionar Primeira Aposta
                        </Button>
                    </div>
                )}
            </main>
        </div>

        <Dialog open={isFormOpen} onOpenChange={isOpen => {
            if(!isOpen) {
                setIsFormOpen(false);
                setBetToEdit(null);
            }
        }}>
            <DialogContent>
                <BetForm 
                    onSave={handleSaveBet}
                    betToEdit={betToEdit}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setBetToEdit(null);
                    }}
                />
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!betToDelete} onOpenChange={(isOpen) => !isOpen && setBetToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive"/>
                        Você tem certeza absoluta?
                    </div>
                </AlertDialogTitle>
                <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Isso excluirá permanentemente a aposta no evento <strong className="text-foreground">"{betToDelete?.event}"</strong>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => betToDelete && handleDeleteBet(betToDelete.id)}>
                    Sim, excluir aposta
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}
