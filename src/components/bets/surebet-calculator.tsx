"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, TrendingUp, DollarSign, Percent, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Switch } from "@/components/ui/switch"

type OddInput = {
  id: number;
  oddValue: string;
  stakeValue: string;
  betType: string;
  isLayBet: boolean;
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

    if (input.isLayBet) {
      const responsabilidade = stake * (odd - 1);
      const lucro = stake; // Em lay, o lucro é a stake.
      const roi = responsabilidade > 0 ? (lucro / responsabilidade) * 100 : 0;
      return { lucro, roi, responsabilidade };
    } else {
      // Cálculo para aposta a favor (Back)
      const lucro = stake * (odd - 1);
      const responsabilidade = stake; // Em back, a responsabilidade é a própria stake
      const roi = stake > 0 ? (lucro / stake) * 100 : 0;
      return { lucro, roi, responsabilidade };
    }
  });

  const validInputs = inputs.filter(i => !isNaN(parseFloat(i.oddValue)) && !isNaN(parseFloat(i.stakeValue)) && parseFloat(i.stakeValue) > 0);

  if (validInputs.length < 2) {
    return { individualResults, surebetResult: null };
  }
  
  const backBets = validInputs.filter(i => !i.isLayBet);
  const layBets = validInputs.filter(i => i.isLayBet);

  // A lógica de surebet combinada aqui precisaria de um modelo mais complexo,
  // por exemplo, apostar a favor de um resultado e contra o mesmo resultado em uma exchange.
  // Por enquanto, vamos focar nos cálculos individuais corretos e no stake total.
  
  const stakeTotal = backBets.reduce((acc, s) => acc + parseFloat(s.stakeValue), 0);
  const responsabilidadeTotalLay = layBets.reduce((acc, s) => acc + (parseFloat(s.stakeValue) * (parseFloat(s.oddValue) - 1)), 0);
  
  // Simplificação: o custo total da operação é a soma das stakes a favor mais a maior responsabilidade contra.
  const custoTotalOperacao = stakeTotal + responsabilidadeTotalLay;


  // Simulação de lucro para cada cenário.
  const profitsIfWin = validInputs.map((input, index) => {
      const odd = parseFloat(input.oddValue);
      const stake = parseFloat(input.stakeValue);
      
      if (input.isLayBet) {
          // Se o lay ganhar (resultado não acontece), ganhamos a stake dos outros e perdemos a nossa.
           const totalPerdidoNasOutras = validInputs.filter((_, i) => i !== index && !i.isLayBet).reduce((acc, inp) => acc + parseFloat(inp.stakeValue), 0)
          return stake - totalPerdidoNasOutras;
      } else {
          // Se o back ganhar, ganhamos o prêmio e perdemos as outras stakes e responsabilidades
          const retorno = odd * stake;
          const outrasStakes = validInputs.filter((_, i) => i !== index && !i.isLayBet).reduce((acc, inp) => acc + parseFloat(inp.stakeValue), 0);
          const outrasLiabilities = validInputs.filter((_, i) => i !== index && i.isLayBet).reduce((acc, inp) => acc + (parseFloat(inp.stakeValue) * (parseFloat(inp.oddValue) -1)), 0);
          return retorno - (stake + outrasStakes + outrasLiabilities)
      }
  });
  
  // Esta lógica de lucro combinado é complexa e depende da estrutura do mercado (ex: vitória/empate/derrota).
  // A implementação atual será uma aproximação.
  const lucroMinimo = Math.min(...profitsIfWin);
  const roiMinimo = custoTotalOperacao > 0 ? (lucroMinimo / custoTotalOperacao) * 100 : 0;


  const surebetResult = {
    isSurebet: lucroMinimo > 0,
    lucroMinimo,
    roiMinimo,
    stakeTotal: custoTotalOperacao, // Renomeando para Custo Total
  };

  return { individualResults, surebetResult };
}

export function SurebetCalculator() {
  const [betInputs, setBetInputs] = useState<OddInput[]>([
    { id: 1, oddValue: '3.0', stakeValue: '70', betType: 'Casa 1 (A Favor)', isLayBet: false },
    { id: 2, oddValue: '3.5', stakeValue: '60', betType: 'Casa 2 (Contra)', isLayBet: true },
  ]);

  const handleAddBetInput = () => {
    const nextId = (betInputs[betInputs.length - 1]?.id || 0) + 1;
    setBetInputs([...betInputs, { id: nextId, oddValue: '', stakeValue: '', betType: `Casa ${betInputs.length + 1}`, isLayBet: false }]);
  };

  const handleRemoveBetInput = (id: number) => {
    setBetInputs(betInputs.filter(bet => bet.id !== id));
  };

  const handleBetInputChange = (id: number, field: keyof Omit<OddInput, 'id'>, value: string | boolean) => {
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
                <CardHeader className="p-4 pb-2">
                 <div className="flex justify-between items-center">
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
                 </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                        id={`lay-switch-${betInput.id}`}
                        checked={betInput.isLayBet}
                        onCheckedChange={(checked) => handleBetInputChange(betInput.id, 'isLayBet', checked)}
                    />
                    <Label htmlFor={`lay-switch-${betInput.id}`}>Aposta Contra (Lay)</Label>
                </div>
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
                      <Label>{betInput.isLayBet ? 'Ganho alvo (R$)' : 'Stake (R$)'}</Label>
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
                        <p className={cn("font-semibold", result?.lucro >= 0 ? "text-green-500" : "text-destructive")}>
                           {result ? result.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="flex items-center gap-1.5 text-muted-foreground"><Percent className="w-4 h-4" /> ROI</p>
                        <p className={cn("font-semibold", result?.roi >= 0 ? "text-green-500" : "text-destructive")}>
                          {result ? result.roi.toFixed(2) : "0.00"}%
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
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1"><DollarSign /> Custo Total da Operação</p>
              <p className="text-2xl font-bold p-0 h-auto bg-transparent border-0 focus-visible:ring-0">
                {calculation?.surebetResult?.stakeTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
              </p>
              <p className="text-xs text-muted-foreground">Soma das stakes (A Favor) + Responsabilidades (Contra)</p>
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
