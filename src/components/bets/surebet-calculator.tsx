
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

type OddInput = {
  id: number;
  value: string;
  betType: string;
};

type CalculationResult = {
  isSurebet: boolean;
  message?: string;
  somaInversa: number;
  stakes: number[];
  retornos: number[];
  lucroGarantido: number;
  roiIndividual: number[];
  stakeTotal: number;
  roiGeral: number;
};

function calcularSurebet(odds: number[], stakeTotal: number): CalculationResult | { isSurebet: false; message: string; somaInversa: number } {
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
      message: "Não há oportunidade de lucro (soma > 100%)",
      somaInversa: somaInversa,
    };
  }

  const stakes = odds.map(odd => (stakeTotal / odd) / somaInversa);
  const retornos = odds.map((odd, i) => stakes[i] * odd);
  const lucroGarantido = retornos[0] - stakeTotal;
  const rois = retornos.map(ret => ((ret - stakeTotal) / stakeTotal) * 100);
  const roiGeral = (lucroGarantido / stakeTotal) * 100;

  return {
    isSurebet: true,
    somaInversa: parseFloat(somaInversa.toFixed(4)),
    stakes: stakes.map(s => parseFloat(s.toFixed(2))),
    retornos: retornos.map(r => parseFloat(r.toFixed(2))),
    lucroGarantido: parseFloat(lucroGarantido.toFixed(2)),
    roiIndividual: rois.map(r => parseFloat(r.toFixed(3))),
    stakeTotal: parseFloat(stakeTotal.toFixed(2)),
    roiGeral: parseFloat(roiGeral.toFixed(3)),
  };
}

export function SurebetCalculator() {
  const [stakeTotal, setStakeTotal] = useState('100');
  const [odds, setOdds] = useState<OddInput[]>([
    { id: 1, value: '', betType: '' },
    { id: 2, value: '', betType: '' },
  ]);

  const handleAddOdd = () => {
    setOdds([...odds, { id: Date.now(), value: '', betType: '' }]);
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
    
    if (parsedOdds.length < 2 || isNaN(parsedStakeTotal)) {
      return null;
    }

    return calcularSurebet(parsedOdds, parsedStakeTotal);
  }, [odds, stakeTotal]);

  return (
    <Card className="bg-card/50 border-dashed">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className='flex-1 w-full'>
                 <label htmlFor="stake-total" className='text-sm font-medium'>Stake Total (R$)</label>
                 <Input
                    id="stake-total"
                    type="number"
                    value={stakeTotal}
                    onChange={(e) => setStakeTotal(e.target.value)}
                    placeholder="Valor total a ser investido"
                    className="mt-1 text-lg"
                 />
            </div>
            <div className="flex-1 w-full">
                 <p className='text-sm font-medium mb-1'>Mercados e Odds</p>
                 <div className="flex flex-col gap-2">
                    {odds.map((odd, index) => (
                    <div key={odd.id} className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder={`Tipo da Aposta ${index + 1}`}
                            value={odd.betType}
                            onChange={(e) => handleOddChange(odd.id, 'betType', e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder={`Odd ${index + 1}`}
                            value={odd.value}
                            onChange={(e) => handleOddChange(odd.id, 'value', e.target.value)}
                            className="w-32"
                        />
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOdd(odd.id)}
                        disabled={odds.length <= 2}
                        className="text-muted-foreground hover:text-destructive"
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                    <Button variant="outline" onClick={handleAddOdd} className="mt-2">
                        <PlusCircle className="mr-2" /> Adicionar Odd
                    </Button>
                 </div>
            </div>
        </div>

        <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {calculation?.isSurebet && odds.map((odd, index) => {
                    const parsedOdd = parseFloat(odd.value);
                    if(isNaN(parsedOdd)) return null;

                    return (
                        <Card key={odd.id} className="bg-background">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base truncate" title={odd.betType || `Casa ${index + 1}`}>
                                    {odd.betType || `Casa ${index + 1}`}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground">Odd: {parsedOdd}</div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                                 <div>
                                    <p className="text-xs text-muted-foreground">Stake</p>
                                    <p className="font-bold text-primary">{calculation.stakes[index].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                 <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1" className="border-b-0">
                                        <AccordionTrigger className="p-0 hover:no-underline text-xs">
                                        Resultado
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <p className="flex items-center gap-1.5 text-green-400"><TrendingUp className="w-4 h-4"/> Lucro</p>
                                                <p className="font-semibold">{calculation.lucroGarantido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </div>
                                             <div className="flex justify-between items-center text-xs">
                                                <p className="flex items-center gap-1.5 text-green-400"><Percent className="w-4 h-4"/> ROI</p>
                                                <p className="font-semibold">{calculation.roiIndividual[index].toFixed(3)}%</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                 </Accordion>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
        
        <Card className="mt-6 bg-background">
            <CardHeader>
                <CardTitle className="text-lg">Resumo Geral</CardTitle>
                <CardDescription>Análise completa da arbitragem</CardDescription>
            </CardHeader>
            <CardContent>
                 {calculation ? (
                    calculation.isSurebet ? (
                        <div className="flex gap-8">
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign/> Stake Total</p>
                                <p className="text-2xl font-bold">{calculation.stakeTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <p className="text-xs text-muted-foreground">Risco total da operação</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2"><Percent/> ROI Geral</p>
                                <p className="text-2xl font-bold text-green-500">{calculation.roiGeral.toFixed(3)}%</p>
                                <p className="text-xs text-muted-foreground">Retorno positivo</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp/> Lucro Garantido</p>
                                <p className="text-2xl font-bold text-green-500">{calculation.lucroGarantido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <p className="text-xs text-muted-foreground">Em todos os resultados</p>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center gap-4 text-destructive">
                           <AlertCircle className="w-8 h-8"/>
                           <div>
                            <p className="font-bold">Não é uma Surebet</p>
                            <p>{calculation.message}</p>
                            <p className="text-xs">Soma das probabilidades: {(calculation.somaInversa * 100).toFixed(2)}%</p>
                           </div>
                        </div>
                    )
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Preencha pelo menos duas odds e o stake total para calcular.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
