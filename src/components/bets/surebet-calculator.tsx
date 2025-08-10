"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle, BarChart } from 'lucide-react';

type OddInput = {
  id: number;
  value: string;
  betType: string; // "Casa 1", "Casa 2", etc.
};

type CalculationResult = {
  isSurebet: true;
  somaInversa: string;
  stakes: number[];
  retornos: number[];
  lucroGarantido: number;
  roiIndividual: number[];
  stakeTotal: number;
  roiGeral: number;
} | {
    isSurebet: false;
    message: string;
    somaInversa: number;
};


function calcularSurebet(odds: number[], stakeTotal: number): CalculationResult {
    if (odds.some(o => isNaN(o) || o <= 1) || isNaN(stakeTotal) || stakeTotal <= 0) {
        return { 
            isSurebet: false, 
            message: "Valores inválidos. Odds devem ser > 1 e Stake Total > 0.",
            somaInversa: 0
        };
    }
    
    const somaInversa = odds.reduce((acc, odd) => acc + (1 / odd), 0);

    if (somaInversa >= 1) {
        return { 
            isSurebet: false,
            message: `Não há oportunidade de lucro (soma > ${ (somaInversa * 100).toFixed(2)}%)`,
            somaInversa: somaInversa
        };
    }

    const stakes = odds.map(odd => (stakeTotal / odd) / somaInversa);
    const retornos = odds.map((odd, i) => stakes[i] * odd);
    const lucroGarantido = retornos[0] - stakeTotal;
    const rois = retornos.map(ret => ((ret - stakeTotal) / stakeTotal) * 100);
    const roiGeral = (lucroGarantido / stakeTotal) * 100;

    return {
        isSurebet: true,
        somaInversa: somaInversa.toFixed(4),
        stakes: stakes.map(s => Number(s.toFixed(2))),
        retornos: retornos.map(r => Number(r.toFixed(2))),
        lucroGarantido: Number(lucroGarantido.toFixed(2)),
        roiIndividual: rois.map(r => Number(r.toFixed(3))),
        stakeTotal: Number(stakeTotal.toFixed(2)),
        roiGeral: Number(roiGeral.toFixed(3))
    };
}


export function SurebetCalculator() {
  const [stakeTotal, setStakeTotal] = useState('100');
  const [odds, setOdds] = useState<OddInput[]>([
    { id: 1, value: '', betType: 'Casa 1' },
    { id: 2, value: '', betType: 'Casa 2' },
  ]);

  const handleAddOdd = () => {
    const nextId = (odds[odds.length - 1]?.id || 0) + 1;
    setOdds([...odds, { id: nextId, value: '', betType: `Casa ${odds.length + 1}` }]);
  };

  const handleRemoveOdd = (id: number) => {
    setOdds(odds.filter(odd => odd.id !== id));
  };

  const handleOddChange = (id: number, field: 'value' | 'betType', fieldValue: string) => {
    setOdds(odds.map(odd => (odd.id === id ? { ...odd, [field]: fieldValue } : odd)));
  };

  const calculation = useMemo(() => {
    const parsedOdds = odds.map(o => parseFloat(o.value)).filter(o => !isNaN(o) && o > 0);
    const parsedStakeTotal = parseFloat(stakeTotal);
    
    if (parsedOdds.length < 2 || isNaN(parsedStakeTotal) || parsedOdds.length !== odds.length || odds.some(o => !o.value)) {
      return null;
    }

    return calcularSurebet(parsedOdds, parsedStakeTotal);
  }, [odds, stakeTotal]);

  return (
     <Card className="bg-card/50 border-dashed">
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {odds.map((odd, index) => {
                    const stakeResult = calculation?.isSurebet ? calculation.stakes[index] : undefined;
                    const roiResult = calculation?.isSurebet ? calculation.roiIndividual[index] : undefined;
                    
                    return (
                        <Card key={odd.id} className="bg-background flex flex-col">
                            <CardHeader className="p-4 pb-2 flex-row justify-between items-center">
                                <CardTitle className="text-base truncate">
                                    <Input 
                                        value={odd.betType} 
                                        onChange={(e) => handleOddChange(odd.id, 'betType', e.target.value)} 
                                        className="border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0"
                                        placeholder={`Casa ${index + 1}`}
                                    />
                                </CardTitle>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveOdd(odd.id)}
                                    disabled={odds.length <= 2}
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
                                        value={odd.value}
                                        onChange={(e) => handleOddChange(odd.id, 'value', e.target.value)}
                                        className="text-base"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Stake</label>
                                    <div className="flex items-center h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-base">
                                        <span className="text-muted-foreground mr-2">R$</span>
                                        <span className="font-semibold text-primary">
                                            {stakeResult !== undefined ? stakeResult.toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2">
                                     <h4 className="text-sm font-semibold mb-2">Resultado</h4>
                                     <div className="p-3 bg-muted/50 rounded-md space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-green-400"><TrendingUp className="w-4 h-4"/> Lucro</p>
                                            <p className="font-semibold text-green-400">
                                                {calculation?.isSurebet ? calculation.lucroGarantido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                                            </p>
                                        </div>
                                         <div className="flex justify-between items-center text-sm">
                                            <p className="flex items-center gap-1.5 text-muted-foreground"><BarChart className="w-4 h-4"/> ROI</p>
                                            <p className="font-semibold">
                                                {roiResult !== undefined ? `${roiResult.toFixed(4)}%` : "0.0000%"}
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
                <Button variant="outline" onClick={handleAddOdd}>
                    <PlusCircle className="mr-2" /> Adicionar Casa
                </Button>
            </div>

            <Card className="bg-background">
                <CardHeader>
                    <CardTitle className="text-lg">Resumo Geral</CardTitle>
                    <CardDescription>Análise completa da arbitragem</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='p-4 bg-muted rounded-lg flex-1'>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign/> Stake Total</p>
                         <Input
                            id="stake-total"
                            type="number"
                            value={stakeTotal}
                            onChange={(e) => setStakeTotal(e.target.value)}
                            placeholder="Valor total"
                            className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0"
                         />
                        <p className="text-xs text-muted-foreground">Risco total da operação</p>
                    </div>
                     <div className='p-4 bg-muted rounded-lg flex-1'>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><TrendingUp/> Lucro Garantido</p>
                        <p className="text-2xl font-bold text-green-500">
                             {calculation?.isSurebet ? calculation.lucroGarantido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                        </p>
                         <p className="text-xs text-muted-foreground">Retorno da operação</p>
                    </div>
                     <div className='p-4 bg-muted rounded-lg flex-1'>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><Percent/> ROI Geral</p>
                        <p className="text-2xl font-bold text-green-500">
                             {calculation?.isSurebet ? `${calculation.roiGeral.toFixed(2)}%` : '0.00%'}
                        </p>
                         <p className="text-xs text-muted-foreground">Retorno positivo</p>
                    </div>
                     {calculation && !calculation.isSurebet && (
                         <div className="md:col-span-3 flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-lg">
                           <AlertCircle className="w-8 h-8"/>
                           <div>
                            <p className="font-bold">Não é uma Surebet</p>
                            <p>{calculation.message}</p>
                           </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
    </Card>
  );
}
