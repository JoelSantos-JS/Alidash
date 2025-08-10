
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type OddInput = {
  id: number;
  oddValue: string;
  stakeValue: string;
  betType: string; 
};

type CalculationResult = {
  isSurebet: boolean;
  message?: string;
  individualReturns: number[];
  profits: number[];
  rois: number[];
  totalStake: number;
  minProfit: number;
  minRoi: number;
};


function calculateSurebet(bets: { odd: number; stake: number }[]): CalculationResult {
    if (bets.some(b => isNaN(b.odd) || b.odd <= 1 || isNaN(b.stake) || b.stake < 0)) {
        return { isSurebet: false, message: "Valores inválidos. Odds devem ser > 1.", individualReturns: [], profits: [], rois: [], totalStake: 0, minProfit: 0, minRoi: 0 };
    }
    
    const totalStake = bets.reduce((acc, bet) => acc + bet.stake, 0);

    if (totalStake <= 0) {
       return { isSurebet: false, message: "Stake total deve ser maior que 0.", individualReturns: [], profits: [], rois: [], totalStake: 0, minProfit: 0, minRoi: 0 };
    }

    const individualReturns = bets.map(bet => bet.odd * bet.stake);

    const profits = individualReturns.map(ret => ret - totalStake);

    const rois = profits.map(profit => (profit / totalStake) * 100);

    const minProfit = Math.min(...profits);
    const minRoi = Math.min(...rois);

    const isSurebet = minProfit > 0;

    return {
        isSurebet,
        message: isSurebet ? "Surebet detectada!" : "Não é uma surebet lucrativa.",
        individualReturns,
        profits,
        rois,
        totalStake,
        minProfit,
        minRoi,
    };
}


export function SurebetCalculator() {
  const [betInputs, setBetInputs] = useState<OddInput[]>([
    { id: 1, oddValue: '', stakeValue: '', betType: 'Casa 1' },
    { id: 2, oddValue: '', stakeValue: '', betType: 'Casa 2' },
  ]);

  const handleAddBetInput = () => {
    const nextId = (betInputs[betInputs.length - 1]?.id || 0) + 1;
    setBetInputs([...betInputs, { id: nextId, oddValue: '', stakeValue: '', betType: `Casa ${betInputs.length + 1}` }]);
  };

  const handleRemoveBetInput = (id: number) => {
    setBetInputs(betInputs.filter(bet => bet.id !== id));
  };

  const handleBetInputChange = (id: number, field: keyof Omit<OddInput, 'id'>, value: string) => {
    setBetInputs(betInputs.map(bet => (bet.id === id ? { ...bet, [field]: value } : bet)));
  };

  const calculation = useMemo(() => {
    const parsedBets = betInputs.map(b => ({
      odd: parseFloat(b.oddValue),
      stake: parseFloat(b.stakeValue)
    })).filter(b => !isNaN(b.odd) && !isNaN(b.stake));
    
    if (parsedBets.length < 2 || parsedBets.some(b => isNaN(b.odd) || isNaN(b.stake))) {
      return null;
    }

    return calculateSurebet(parsedBets);
  }, [betInputs]);

  return (
     <Card className="bg-card/50 border-dashed">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {betInputs.map((betInput, index) => {
                    const profitResult = calculation?.profits[index];
                    const roiResult = calculation?.rois[index];
                    
                    return (
                        <Card key={betInput.id} className="bg-background flex flex-col">
                            <CardHeader className="p-4 pb-2 flex-row justify-between items-center">
                                <CardTitle className="text-base truncate">
                                    <Input 
                                        value={betInput.betType} 
                                        onChange={(e) => handleBetInputChange(betInput.id, 'betType', e.target.value)} 
                                        className="border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0"
                                        placeholder={`Casa ${index + 1}`}
                                    />
                                </CardTitle>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveBetInput(betInput.id)}
                                    disabled={betInputs.length <= 2}
                                    className="text-muted-foreground hover:text-destructive w-6 h-6"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Odd</label>
                                        <Input
                                            type="number"
                                            placeholder="ex: 2.5"
                                            value={betInput.oddValue}
                                            onChange={(e) => handleBetInputChange(betInput.id, 'oddValue', e.target.value)}
                                            className="text-base"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Stake</label>
                                        <Input
                                            type="number"
                                            placeholder="ex: 100"
                                            value={betInput.stakeValue}
                                            onChange={(e) => handleBetInputChange(betInput.id, 'stakeValue', e.target.value)}
                                            className="text-base"
                                        />
                                    </div>
                                </div>
                                <div className="mt-auto pt-2">
                                     <h4 className="text-sm font-semibold mb-2">Resultado Individual</h4>
                                     <div className="p-3 bg-muted/50 rounded-md space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <p className={cn("flex items-center gap-1.5", profitResult === undefined ? "" : profitResult >= 0 ? "text-green-400" : "text-destructive" )}>
                                              <TrendingUp className="w-4 h-4"/> Lucro
                                            </p>
                                            <p className={cn("font-semibold", profitResult === undefined ? "" : profitResult >= 0 ? "text-green-400" : "text-destructive" )}>
                                                {profitResult !== undefined ? profitResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                                            </p>
                                        </div>
                                         <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-muted-foreground"><Percent className="w-4 h-4"/> ROI</p>
                                            <p className="font-semibold">
                                                {roiResult !== undefined ? `${roiResult.toFixed(2)}%` : "0.00%"}
                                            </p>
                                        </div>
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                 })}
            </div>
            <div className="flex justify-center mb-6">
                <Button variant="outline" onClick={handleAddBetInput}>
                    <PlusCircle className="mr-2" /> Adicionar Casa
                </Button>
            </div>

            <Card className="bg-background">
                <CardHeader>
                    <CardTitle className="text-lg">Resumo Geral</CardTitle>
                    <CardDescription>Análise completa da operação com base nos valores inseridos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className='p-4 bg-muted rounded-lg flex-1'>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign/> Stake Total</p>
                             <p className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0">
                               {calculation?.totalStake.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                             </p>
                            <p className="text-xs text-muted-foreground">Soma de todas as stakes</p>
                        </div>
                        {calculation?.isSurebet ? (
                            <>
                                 <div className='p-4 bg-muted rounded-lg flex-1'>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><TrendingUp/> Lucro Mínimo</p>
                                    <p className={cn("text-2xl font-bold", calculation?.isSurebet ? "text-green-500" : "text-destructive")}>
                                         {calculation?.minProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                    </p>
                                     <p className="text-xs text-muted-foreground">Menor lucro possível entre os resultados</p>
                                </div>
                                 <div className='p-4 bg-muted rounded-lg flex-1'>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><Percent/> ROI Mínimo</p>
                                    <p className={cn("text-2xl font-bold", calculation?.isSurebet ? "text-green-500" : "text-destructive")}>
                                         {calculation ? `${calculation.minRoi.toFixed(2)}%` : '0.00%'}
                                    </p>
                                     <p className="text-xs text-muted-foreground">Menor retorno possível</p>
                                </div>
                            </>
                         ) : calculation ? (
                             <div className="md:col-span-2 flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-lg">
                               <AlertCircle className="w-8 h-8"/>
                               <div>
                                <p className="font-bold">Não é uma Surebet</p>
                                <p>{calculation.message}</p>
                               </div>
                            </div>
                         ) : null}
                    </div>
                </CardContent>
            </Card>
        </CardContent>
    </Card>
  );
}
