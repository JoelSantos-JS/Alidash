
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

type OddInput = {
  id: number;
  oddValue: string;
  stakeValue: string;
  betType: string;
};

type IndividualResult = {
  lucro: number;
  roi: number;
  retorno: number;
};

type SurebetResult = {
    isSurebet: boolean;
    lucroMinimo: number;
    roiMinimo: number;
};


// Lógica para quando o usuário digita as stakes manualmente
function calculateManualResults(odds: number[], stakes: number[]): { individualResults: IndividualResult[], surebetResult: SurebetResult, stakeTotal: number } | null {
  if (odds.length !== stakes.length || odds.some(isNaN) || stakes.some(isNaN) || odds.length === 0) {
    return null;
  }
  
  const stakeTotal = stakes.reduce((acc, s) => acc + s, 0);
  if (stakeTotal <= 0) return null;

  // 1. Calculate individual profit for each bet card (isolated calculation)
  const individualResults = stakes.map((stake, i) => {
    if(isNaN(stake) || stake <= 0 || isNaN(odds[i]) || odds[i] <= 1) {
        return { lucro: 0, roi: 0, retorno: 0 };
    }
    const retorno = odds[i] * stake;
    const lucro = retorno - stake;
    const roi = (lucro / stake) * 100;
    return { lucro, roi, retorno };
  });

  // 2. Calculate the surebet profit for the entire operation
  const returnsIfWin = odds.map((o, i) => o * stakes[i]);
  const profitsIfWin = returnsIfWin.map(retorno => retorno - stakeTotal);
  
  const lucroMinimo = Math.min(...profitsIfWin);
  
  const surebetResult = {
    isSurebet: lucroMinimo > 0,
    lucroMinimo,
    roiMinimo: (lucroMinimo / stakeTotal) * 100,
  };
  
  return {
    individualResults,
    surebetResult,
    stakeTotal,
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
    const parsedOdds = betInputs.map(b => parseFloat(b.oddValue));
    const parsedStakes = betInputs.map(b => parseFloat(b.stakeValue));
    
    if (parsedOdds.length < 2 || parsedOdds.some(v => isNaN(v)) || parsedStakes.some(v => isNaN(v)) ) {
      return null;
    }
    
    return calculateManualResults(parsedOdds, parsedStakes);
  }, [betInputs]);

  return (
     <Card className="bg-card/50 border-dashed">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {betInputs.map((betInput, index) => {
                    const result = calculation?.individualResults[index];
                    
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
                                <div className='grid grid-cols-2 gap-2'>
                                    <div className="space-y-1">
                                        <Label>Odd</Label>
                                        <Input
                                            type="number"
                                            placeholder="ex: 2.5"
                                            value={betInput.oddValue}
                                            onChange={(e) => handleBetInputChange(betInput.id, 'oddValue', e.target.value)}
                                            className="text-base"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Stake (R$)</Label>
                                        <Input
                                            type="number"
                                            placeholder="ex: 50.00"
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
                                            <p className="flex items-center gap-1.5 text-muted-foreground">
                                              <TrendingUp className="w-4 h-4"/> Lucro
                                            </p>
                                            <p className={cn("font-semibold", result && result.lucro > 0 ? "text-green-500" : "text-destructive")}>
                                                {result ? result.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                                            </p>
                                        </div>
                                         <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-muted-foreground"><Percent className="w-4 h-4"/> ROI</p>
                                            <p className={cn("font-semibold", result && result.roi > 0 ? "text-green-500" : "text-destructive")}>
                                                {result ? `${result.roi.toFixed(2)}%` : "0,00%"}
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
                    <CardTitle className="text-lg">Resumo Geral da Operação</CardTitle>
                    <CardDescription>Análise da surebet considerando todas as apostas combinadas</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='p-4 bg-muted rounded-lg flex-1'>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign/> Stake Total</p>
                        <p className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0">
                        {calculation?.stakeTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                        </p>
                        <p className="text-xs text-muted-foreground">Soma de todas as stakes inseridas</p>
                    </div>
                    {calculation ? (
                        calculation.surebetResult.isSurebet ? (
                        <>
                            <div className='p-4 bg-muted rounded-lg flex-1'>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><TrendingUp/> Lucro Mínimo Garantido</p>
                                <p className={cn("text-2xl font-bold", "text-green-500")}>
                                    {calculation.surebetResult.lucroMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-xs text-muted-foreground">Menor lucro possível na operação</p>
                            </div>
                            <div className='p-4 bg-muted rounded-lg flex-1'>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><Percent/> ROI Mínimo</p>
                                <p className={cn("text-2xl font-bold", "text-green-500")}>
                                    {`${calculation.surebetResult.roiMinimo.toFixed(2)}%`}
                                </p>
                                <p className="text-xs text-muted-foreground">Menor retorno sobre investimento</p>
                            </div>
                        </>
                        ) : (
                        <div className="md:col-span-2 flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-lg">
                            <AlertCircle className="w-8 h-8"/>
                            <div>
                            <p className="font-bold">Não é uma Surebet Lucrativa</p>
                            <p>O lucro mínimo da operação combinada é negativo, indicando prejuízo em pelo menos um cenário.</p>
                            </div>
                        </div>
                        )
                    ) : (
                         <div className="md:col-span-2 flex items-center gap-4 text-muted-foreground p-4 bg-muted/50 rounded-lg">
                           <AlertCircle className="w-8 h-8"/>
                           <div>
                            <p className="font-bold">Aguardando dados</p>
                            <p>Insira as odds e stakes de pelo menos duas casas para calcular.</p>
                           </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
    </Card>
  );
}
