
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Bet } from '@/types';
import { Header } from "@/components/layout/header";
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart, AlertTriangle, Calendar, TrendingUp, TrendingDown, Calculator, Scale, Target, ListChecks, LayoutDashboard } from 'lucide-react';
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
import { BetPerformanceChart } from '@/components/bets/bet-performance-chart';
import { BetStatusChart } from '@/components/bets/bet-status-chart';
import { useAuth } from '@/hooks/use-supabase-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SurebetCalculator } from '@/components/bets/surebet-calculator';
import { AdvancedSurebetCalculator } from '@/components/bets/advanced-surebet-calculator';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { cn } from '@/lib/utils';



const initialBets: Bet[] = [];

type Period = 'day' | 'week' | 'month';

export default function BetsPage() {
    const { user, loading: authLoading } = useAuth();
    const [bets, setBets] = useState<Bet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [betToEdit, setBetToEdit] = useState<Bet | null>(null);
    const [betToDelete, setBetToDelete] = useState<Bet | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("pending");
    const [summaryPeriod, setSummaryPeriod] = useState<Period>('day');
    const { toast } = useToast();
    
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                console.log('🔍 Carregando apostas do Supabase para usuário:', user.id);
                
                const response = await fetch('/api/bets');
                const data = await response.json();
                
                if (data.success && data.bets) {
                    const supabaseBets = data.bets.map((b: any) => ({
                        ...b,
                        date: new Date(b.date || b.created_at)
                    }));
                    setBets(supabaseBets);
                    console.log('✅ Apostas carregadas do Supabase:', supabaseBets.length);
                } else {
                    console.log('⚠️ Nenhuma aposta encontrada no Supabase');
                    setBets(initialBets);
                }
            } catch (error) {
                console.error("❌ Erro ao carregar apostas:", error);
                setBets(initialBets);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [user]);




    const summaryStats = useMemo(() => {
        const calculateStatsForPeriod = (period: Period) => {
            let periodBets: Bet[] = [];
            const now = new Date();
            if (period === 'day') {
                periodBets = bets.filter(b => isToday(new Date(b.date)));
            } else if (period === 'week') {
                periodBets = bets.filter(b => isThisWeek(new Date(b.date), { weekStartsOn: 1 }));
            } else if (period === 'month') {
                 periodBets = bets.filter(b => isThisMonth(new Date(b.date)));
            }

            const totalStaked = periodBets.reduce((acc, bet) => {
                if (bet.type === 'single' && bet.stake) return acc + bet.stake;
                if (bet.type === 'surebet' && bet.totalStake) return acc + bet.totalStake;
                return acc;
            }, 0);

            const netProfit = periodBets.reduce((acc, bet) => {
                 if (bet.status !== 'won' && bet.status !== 'lost') return acc;
                 
                 if (bet.type === 'single') {
                    const stake = bet.stake ?? 0;
                    const odds = bet.odds ?? 0;
                    if (bet.status === 'won') return acc + (stake * odds) - stake;
                    if (bet.status === 'lost') return acc - stake;
                 } else if (bet.type === 'surebet') {
                    if (bet.status === 'won') return acc + (bet.guaranteedProfit ?? 0);
                    if (bet.status === 'lost') return acc - (bet.totalStake ?? 0);
                 }
                 return acc;
            }, 0);
            
            return { totalStaked, netProfit };
        };

        const finishedBetsCount = bets.filter(b => b.status === 'won' || b.status === 'lost').length;
        const wonBetsCount = bets.filter(b => b.status === 'won').length;
        const winRate = finishedBetsCount > 0 ? (wonBetsCount / finishedBetsCount) * 100 : 0;
        
        return {
            day: calculateStatsForPeriod('day'),
            week: calculateStatsForPeriod('week'),
            month: calculateStatsForPeriod('month'),
            overallWinRate: winRate,
        }
    }, [bets]);

     const filteredBets = useMemo(() => {
        const otherStatuses: Bet['status'][] = ['cashed_out', 'void'];
        if (filterStatus === 'all') return bets;
        if (filterStatus === 'other') {
            return bets.filter(bet => otherStatuses.includes(bet.status));
        }
        return bets.filter(bet => bet.status === filterStatus);
    }, [bets, filterStatus]);


    const handleOpenForm = (bet: Bet | null = null) => {
        setBetToEdit(bet);
        setIsFormOpen(true);
    }

    const handleSaveBet = async (betData: Omit<Bet, 'id'>) => {
        if (!user?.id) {
            toast({
                variant: 'destructive',
                title: "Erro de Autenticação",
                description: "Usuário não autenticado.",
            });
            return;
        }

        const sanitizedBetData = JSON.parse(JSON.stringify(betData));
    
        if (betToEdit) {
            // Editar aposta existente
            try {
                const response = await fetch('/api/bets/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        betId: betToEdit.id,
                        updates: sanitizedBetData,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const updatedBets = bets.map(b => (b.id === betToEdit.id ? { ...b, ...sanitizedBetData, id: b.id } : b));
                    setBets(updatedBets);
                    
                    toast({ 
                        title: "Aposta Atualizada!", 
                        description: `${betData.event} foi atualizada com sucesso.` 
                    });
                } else {
                    throw new Error(data.error || 'Erro ao atualizar aposta');
                }
            } catch (error) {
                console.error('Erro ao atualizar aposta:', error);
                toast({ 
                    variant: 'destructive',
                    title: "Erro ao Atualizar", 
                    description: `Não foi possível atualizar a aposta "${betData.event}".` 
                });
            }
        } else {
            // Adicionar nova aposta
            try {
                const response = await fetch('/api/bets/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        betData: sanitizedBetData,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    const newBet: Bet = {
                        id: data.bet.id,
                        ...sanitizedBetData,
                    };
                    setBets([newBet, ...bets]);
                    
                    toast({ 
                        title: "Aposta Adicionada!", 
                        description: `${betData.event} foi adicionada com sucesso.` 
                    });
                } else {
                    throw new Error(data.error || 'Erro ao criar aposta');
                }
            } catch (error) {
                console.error('Erro ao criar aposta:', error);
                toast({ 
                    variant: 'destructive',
                    title: "Erro ao Adicionar", 
                    description: `Não foi possível adicionar a aposta "${betData.event}".` 
                });
            }
        }
        setIsFormOpen(false);
        setBetToEdit(null);
    };

    const handleDeleteBet = async (betId: string) => {
        const bet = bets.find(b => b.id === betId);
        if (!bet) return;
        
        try {
            const response = await fetch(`/api/bets?betId=${betId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Remover do estado local
                setBets(bets.filter(b => b.id !== betId));
                setBetToDelete(null);
                
                toast({ 
                    title: "Aposta Excluída!", 
                    description: `${bet.event} foi removida com sucesso.` 
                });
            } else {
                throw new Error(data.error || 'Erro ao deletar aposta');
            }
        } catch (error) {
            console.error('Erro ao deletar aposta:', error);
            toast({ 
                variant: 'destructive', 
                title: "Erro ao Excluir", 
                description: `Não foi possível excluir a aposta "${bet.event}".` 
            });
        }
    }

    const renderBetList = () => {
        if (isLoading) {
             return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[250px] w-full" />
                    ))}
                </div>
            )
        }
        
        if (filteredBets.length > 0) {
            return (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBets.map(bet => (
                        <BetCard 
                            key={bet.id} 
                            bet={bet} 
                            onEdit={() => handleOpenForm(bet)}
                            onDelete={() => setBetToDelete(bet)}
                        />
                    ))}
                 </div>
            )
        }
        
        return (
            <div className="text-center py-20 bg-muted rounded-lg">
                <h3 className="text-2xl font-bold">Nenhuma Aposta Encontrada</h3>
                <p className="text-muted-foreground mt-2 mb-6">Não há apostas com este status. Adicione uma nova aposta ou mude o filtro.</p>
                <Button size="lg" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2"/>
                    Adicionar Aposta
                </Button>
            </div>
        )
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
                
                 <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="mb-6 grid w-full grid-cols-3">
                        <TabsTrigger value="dashboard"><LayoutDashboard className="mr-2 h-4 w-4"/> Resumo Geral</TabsTrigger>
                        <TabsTrigger value="bets"><ListChecks className="mr-2 h-4 w-4"/> Minhas Apostas</TabsTrigger>
                        <TabsTrigger value="calculators"><Calculator className="mr-2 h-4 w-4"/> Calculadoras</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="dashboard" className="space-y-8">
                         <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <Calendar className="w-7 h-7 text-primary" />
                                    Resumo por Período
                                </h3>
                                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                                    {(['day', 'week', 'month'] as Period[]).map(p => (
                                        <Button 
                                            key={p}
                                            variant={summaryPeriod === p ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSummaryPeriod(p)}
                                            className={cn("capitalize", summaryPeriod === p && "shadow-md")}
                                        >
                                            {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-[116px] w-full" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <SummaryCard
                                        title="Total Apostado"
                                        value={summaryStats[summaryPeriod].totalStaked}
                                        icon={Scale}
                                        isCurrency
                                    />
                                    <SummaryCard
                                        title="Lucro / Prejuízo"
                                        value={summaryStats[summaryPeriod].netProfit}
                                        icon={summaryStats[summaryPeriod].netProfit >= 0 ? TrendingUp : TrendingDown}
                                        isCurrency
                                        className={summaryStats[summaryPeriod].netProfit >= 0 ? "text-green-500" : "text-destructive"}
                                    />
                                    <SummaryCard
                                        title="Taxa de Vitória (Geral)"
                                        value={summaryStats.overallWinRate}
                                        icon={Target}
                                        isPercentage
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 h-[360px]">
                                <BetPerformanceChart data={bets} isLoading={isLoading}/>
                            </div>
                            <div className="lg:col-span-2 h-[360px]">
                                <BetStatusChart data={bets} isLoading={isLoading}/>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="bets">
                        <Tabs defaultValue="pending" onValueChange={setFilterStatus} className="w-full">
                            <TabsList className="grid w-full grid-cols-5 mb-6">
                                <TabsTrigger value="all">Todas</TabsTrigger>
                                <TabsTrigger value="pending">Em Andamento</TabsTrigger>
                                <TabsTrigger value="won">Ganhos</TabsTrigger>
                                <TabsTrigger value="lost">Perdidas</TabsTrigger>
                                <TabsTrigger value="other">Outras</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="all">{renderBetList()}</TabsContent>
                            <TabsContent value="pending">{renderBetList()}</TabsContent>
                            <TabsContent value="won">{renderBetList()}</TabsContent>
                            <TabsContent value="lost">{renderBetList()}</TabsContent>
                            <TabsContent value="other">{renderBetList()}</TabsContent>
                        </Tabs>
                    </TabsContent>

                     <TabsContent value="calculators">
                         <Tabs defaultValue="simple" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="simple">Calculadora Simples</TabsTrigger>
                                <TabsTrigger value="advanced">Calculadora Avançada (Pro)</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="simple">
                                <SurebetCalculator />
                            </TabsContent>
                            
                            <TabsContent value="advanced">
                                <AdvancedSurebetCalculator />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                </Tabs>
            </main>
        </div>

        <Dialog open={isFormOpen} onOpenChange={isOpen => {
            if(!isOpen) {
                setIsFormOpen(false);
                setBetToEdit(null);
            }
        }}>
            <DialogContent className="max-w-2xl p-0">
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
