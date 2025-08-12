"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle, ShieldCheck, FileKey } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

type OddInput = {
  id: number;
  oddValue: string;
  stakeValue: string;
  betType: string;
};

// Resultado para um único card de aposta (cálculo isolado)
type IndividualResult = {
  lucro: number;
  roi: number;
  responsabilidade: number;
};

// Resultado da operação de surebet combinada
type SurebetResult = {
  isSurebet: boolean;
  lucroMinimo: number;
  roiMinimo: number;
  stakeTotal: number;
};

// Função de cálculo principal
function calculateResults(inputs: OddInput[]): { individualResults: IndividualResult[], surebetResult: SurebetResult | null } {
  const individualResults: IndividualResult[] = inputs.map(input => {
    const odd = parseFloat(input.oddValue);
    const stake = parseFloat(input.stakeValue);

    if (isNaN(odd) || isNaN(stake) || stake <= 0) {
      return { lucro: 0, roi: 0, responsabilidade: 0 };
    }
    // Lucro e ROI se a aposta for tratada isoladamente
    const lucro = stake; // Em aposta contra, o lucro é a stake do oponente.
    const roi = (lucro / stake) * 100;
    const responsabilidade = stake * (odd - 1);
    return { lucro, roi, responsabilidade };
  });

  const validInputs = inputs.filter(i => !isNaN(parseFloat(i.oddValue)) && !isNaN(parseFloat(i.stakeValue)) && parseFloat(i.stakeValue) > 0);

  if (validInputs.length < 2) {
    return { individualResults, surebetResult: null };
  }

  const stakes = validInputs.map(i => parseFloat(i.stakeValue));
  const odds = validInputs.map(i => parseFloat(i.oddValue));

  const stakeTotal = stakes.reduce((acc, s) => acc + s, 0);
  if (stakeTotal <= 0) {
    return { individualResults, surebetResult: null };
  }

  // Simula o lucro para cada cenário possível (se a casa X ganhar, o que acontece com a operação toda?)
  const profitsIfWin = odds.map((odd, i) => (odd * stakes[i]) - stakeTotal);

  const lucroMinimo = Math.min(...profitsIfWin);

  const surebetResult = {
    isSurebet: lucroMinimo > 0,
    lucroMinimo,
    roiMinimo: stakeTotal > 0 ? (lucroMinimo / stakeTotal) * 100 : 0,
    stakeTotal,
  };

  return { individualResults, surebetResult };
}

export function SurebetCalculator() {
  const [betInputs, setBetInputs] = useState<OddInput[]>([
    { id: 1, oddValue: '3.0', stakeValue: '70', betType: 'Casa 1' },
    { id: 2, oddValue: '3.5', stakeValue: '60', betType: 'Casa 2' },
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
    return calculateResults(betInputs);
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
                  <Input
                    value={betInput.betType}
                    onChange={(e) => handleBetInputChange(betInput.id, 'betType', e.target.value)}
                    className="border-0 bg-transparent p-0 text-base font-semibold focus-visible:ring-0"
                    placeholder={`Casa ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBetInput(betInput.id)}
                    disabled={betInputs.length < 2}
                    className="text-muted-foreground hover:text-destructive w-6 h-6 flex-shrink-0"
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
                   <div className="space-y-1">
                      <Label>Responsabilidade</Label>
                       <div className="p-2 h-10 flex items-center bg-muted rounded-md text-base font-semibold">
                         {result ? result.responsabilidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                       </div>
                    </div>
                  <div className="mt-auto pt-2">
                    <h4 className="text-sm font-semibold mb-2">Resultado Individual</h4>
                    <div className="p-3 bg-muted/50 rounded-md space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <TrendingUp className="w-4 h-4" /> Lucro
                        </p>
                        <p className={cn("font-semibold", "text-green-500")}>
                           {result ? result.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="flex items-center gap-1.5 text-muted-foreground"><Percent className="w-4 h-4" /> ROI</p>
                        <p className={cn("font-semibold", "text-green-500")}>
                          100.00%
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
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign /> Stake Total</p>
              <p className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0">
                {calculation?.surebetResult?.stakeTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
              </p>
              <p className="text-xs text-muted-foreground">Soma de todas as stakes inseridas</p>
            </div>
            {calculation.surebetResult ? (
              calculation.surebetResult.isSurebet ? (
                <>
                  <div className='p-4 bg-green-500/10 text-green-500 rounded-lg flex-1'>
                    <p className="text-sm text-green-400 flex items-center gap-2 mb-1"><ShieldCheck /> Lucro Mínimo Garantido</p>
                    <p className="text-2xl font-bold">
                      {calculation.surebetResult.lucroMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-green-400/80">Menor lucro possível na operação</p>
                  </div>
                  <div className='p-4 bg-green-500/10 text-green-500 rounded-lg flex-1'>
                    <p className="text-sm text-green-400 flex items-center gap-2 mb-1"><Percent /> ROI Mínimo</p>
                    <p className="text-2xl font-bold">
                      {`${calculation.surebetResult.roiMinimo.toFixed(2)}%`}
                    </p>
                    <p className="text-xs text-green-400/80">Menor retorno sobre investimento</p>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2 flex items-center gap-4 text-destructive p-4 bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-8 h-8" />
                  <div>
                    <p className="font-bold">Não é uma Surebet Lucrativa</p>
                    <p>Com os valores atuais, o prejuízo máximo é de <span className="font-mono">{calculation.surebetResult.lucroMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>. Ajuste os valores para garantir lucro.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="md:col-span-2 flex items-center gap-4 text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="w-8 h-8" />
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
