
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

type OddInput = {
  id: number;
  oddValue: string;
  betType: string;
};

type CalculationResult = {
  isSurebet: boolean;
  message?: string;
  stakes: number[];
  retornos: number[];
  stakeTotal: number;
  lucro: number;
  roi: number;
};

function calculateSurebet(odds: number[], stakeTotal: number): CalculationResult | null {
  if (odds.some(o => isNaN(o) || o <= 1) || isNaN(stakeTotal) || stakeTotal <= 0) {
    return null;
  }
  
  const S = odds.reduce((acc, o) => acc + 1 / o, 0);

  if (S >= 1) {
    return { 
        isSurebet: false, 
        message: "Não há oportunidade (Soma das inversas ≥ 1)",
        stakes: [],
        retornos: [],
        stakeTotal: stakeTotal,
        lucro: 0,
        roi: 0,
    };
  }

  // stakes proporcionais a 1/odd
  const stakes = odds.map(o => (stakeTotal / o) / S);

  // arredonda para 2 casas e recalcula métricas
  const stakes2 = stakes.map(v => Number(v.toFixed(2)));
  const total2 = Number(stakes2.reduce((a, b) => a + b, 0).toFixed(2));
  const retornos2 = odds.map((o, i) => Number((stakes2[i] * o).toFixed(2)));
  const menorRetorno = Math.min(...retornos2);
  const lucro = Number((menorRetorno - total2).toFixed(2));
  const roi = total2 > 0 ? Number(((lucro / total2) * 100).toFixed(3)) : 0;
  
  return {
    isSurebet: lucro > 0,
    stakes: stakes2,
    retornos: retornos2,
    stakeTotal: total2,
    menorRetorno,
    lucro,
    roi,
  };
}


export function SurebetCalculator() {
  const [betInputs, setBetInputs] = useState<OddInput[]>([
    { id: 1, oddValue: '', betType: 'Casa 1' },
    { id: 2, oddValue: '', betType: 'Casa 2' },
  ]);
  const [totalStake, setTotalStake] = useState<string>('');
  
  useEffect(() => {
     // Quando o número de inputs muda, recalcula.
  }, [betInputs]);

  const handleAddBetInput = () => {
    const nextId = (betInputs[betInputs.length - 1]?.id || 0) + 1;
    setBetInputs([...betInputs, { id: nextId, oddValue: '', betType: `Casa ${betInputs.length + 1}` }]);
  };

  const handleRemoveBetInput = (id: number) => {
    setBetInputs(betInputs.filter(bet => bet.id !== id));
  };

  const handleBetInputChange = (id: number, field: keyof Omit<OddInput, 'id'>, value: string) => {
    setBetInputs(betInputs.map(bet => (bet.id === id ? { ...bet, [field]: value } : bet)));
  };

  const calculation = useMemo(() => {
    const parsedOdds = betInputs
      .map(b => parseFloat(b.oddValue))
      .filter(odd => !isNaN(odd) && odd > 1);
    
    const parsedTotalStake = parseFloat(totalStake);
    
    if (parsedOdds.length < 2 || isNaN(parsedTotalStake) || parsedTotalStake <= 0) {
      return null;
    }
    
    return calculateSurebet(parsedOdds, parsedTotalStake);
  }, [betInputs, totalStake]);

  return (
     <Card className="bg-card/50 border-dashed">
        <CardContent className="p-6">
            <div className='mb-6'>
                <Label htmlFor='totalStake'>Valor Total a Investir (R$)</Label>
                <Input
                    id='totalStake'
                    type="number"
                    placeholder="Ex: 1000"
                    value={totalStake}
                    onChange={(e) => setTotalStake(e.target.value)}
                    className="text-lg font-bold mt-1"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {betInputs.map((betInput, index) => {
                    const stakeResult = calculation?.stakes[index];
                    const retornoResult = calculation?.retornos[index];
                    
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
                                <div className="mt-auto pt-2">
                                     <h4 className="text-sm font-semibold mb-2">Aposta Ideal</h4>
                                     <div className="p-3 bg-muted/50 rounded-md space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-primary">
                                              <DollarSign className="w-4 h-4"/> Stake
                                            </p>
                                            <p className="font-semibold text-primary">
                                                {stakeResult !== undefined ? stakeResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                                            </p>
                                        </div>
                                         <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="w-4 h-4"/> Retorno</p>
                                            <p className="font-semibold">
                                                {retornoResult !== undefined ? retornoResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
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
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='p-4 bg-muted rounded-lg flex-1'>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign/> Stake Total</p>
                        <p className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0">
                        {calculation?.stakeTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                        </p>
                        <p className="text-xs text-muted-foreground">Soma de todas as stakes arredondadas</p>
                    </div>
                    {calculation ? (
                        calculation.isSurebet ? (
                        <>
                            <div className='p-4 bg-muted rounded-lg flex-1'>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><TrendingUp/> Lucro Garantido</p>
                                <p className={cn("text-2xl font-bold", "text-green-500")}>
                                    {calculation.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-xs text-muted-foreground">Menor lucro possível na operação</p>
                            </div>
                            <div className='p-4 bg-muted rounded-lg flex-1'>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><Percent/> ROI Garantido</p>
                                <p className={cn("text-2xl font-bold", "text-green-500")}>
                                    {`${calculation.roi.toFixed(2)}%`}
                                </p>
                                <p className="text-xs text-muted-foreground">Menor retorno sobre investimento</p>
                            </div>
                        </>
                        ) : (
                        <div className="md:col-span-2 flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-lg">
                            <AlertCircle className="w-8 h-8"/>
                            <div>
                            <p className="font-bold">Não é uma Surebet</p>
                            <p>{calculation.message || "A soma das inversas das odds é maior ou igual a 1, indicando prejuízo."}</p>
                            </div>
                        </div>
                        )
                    ) : (
                         <div className="md:col-span-2 flex items-center gap-4 text-muted-foreground p-4 bg-muted/50 rounded-lg">
                           <AlertCircle className="w-8 h-8"/>
                           <div>
                            <p className="font-bold">Aguardando dados</p>
                            <p>Insira o valor total a investir e pelo menos duas odds para calcular.</p>
                           </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
    </Card>
  );
}

    