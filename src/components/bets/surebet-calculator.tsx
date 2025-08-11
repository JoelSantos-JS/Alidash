"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, DollarSign, Percent, AlertCircle, ShieldCheck } from 'lucide-react';
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
};

type SurebetResult = {
  isSurebet: boolean;
  lucroMinimo: number;
  roiMinimo: number;
  stakeTotal: number;
};

function calcularSurebet(odds: number[], stakeTotal: number) {
  if (odds.length < 2 || stakeTotal <= 0) {
    return {
      isSurebet: false,
      lucroMinimo: 0,
      roiMinimo: 0,
      stakeTotal: 0,
      S: 0,
      stakes: [],
      retornoGarantido: 0
    };
  }

  const S = odds.reduce((sum, odd) => sum + (1 / odd), 0);
  const isSurebet = S < 1;
  
  if (!isSurebet) {
    return {
      isSurebet: false,
      lucroMinimo: 0,
      roiMinimo: 0,
      stakeTotal: 0,
      S: S,
      stakes: [],
      retornoGarantido: 0
    };
  }

  const stakes = odds.map(odd => (stakeTotal / odd) / S);
  const retornoGarantido = stakeTotal / S;
  const lucroMinimo = retornoGarantido - stakeTotal;
  const roiMinimo = (lucroMinimo / stakeTotal) * 100;

  return {
    isSurebet: true,
    lucroMinimo,
    roiMinimo,
    stakeTotal,
    S,
    stakes,
    retornoGarantido
  };
}

function calculateResults(inputs: OddInput[], totalInvestment: number) {
  const validInputs = inputs.filter(input => input.oddValue && parseFloat(input.oddValue) > 0);
  
  if (validInputs.length < 2) {
    return {
      individualResults: [],
      surebetResult: null,
      surebetCalc: null
    };
  }

  const odds = validInputs.map(input => parseFloat(input.oddValue));
  const surebetCalc = calcularSurebet(odds, totalInvestment || 100); // valor padrão para cálculo
  
  // Usar stakes manuais se fornecidas, senão usar as calculadas
  const manualStakes = validInputs.map(input => parseFloat(input.stakeValue) || 0);
  const hasManualStakes = manualStakes.some(stake => stake > 0);
  const stakesToUse = hasManualStakes ? manualStakes : surebetCalc.stakes;
  const totalStakeUsed = stakesToUse.reduce((sum, stake) => sum + stake, 0);
  
  const individualResults = validInputs.map((input, index) => {
    const odd = parseFloat(input.oddValue);
    const stake = stakesToUse[index] || 0;
    const retorno = stake * odd;
    // Em uma surebet, o lucro é o retorno desta casa menos o total investido em TODAS as casas
    const lucro = retorno - totalStakeUsed;
    const roi = totalStakeUsed > 0 ? (lucro / totalStakeUsed) * 100 : 0;
    
    return { lucro, roi, retorno, stake };
  });

  // Para surebet manual, verificar se todas as apostas geram lucro
  const isManualSurebet = hasManualStakes && individualResults.every(result => result.lucro > 0);
  const minLucro = Math.min(...individualResults.map(r => r.lucro));
  const minRoi = totalStakeUsed > 0 ? (minLucro / totalStakeUsed) * 100 : 0;

  const surebetResult = {
    isSurebet: hasManualStakes ? isManualSurebet : surebetCalc.isSurebet,
    lucroMinimo: hasManualStakes ? minLucro : surebetCalc.lucroMinimo,
    roiMinimo: hasManualStakes ? minRoi : surebetCalc.roiMinimo,
    stakeTotal: hasManualStakes ? totalStakeUsed : totalInvestment
  };

  return {
    individualResults,
    surebetResult,
    calculatedStakes: surebetCalc.stakes,
    surebetCalc,
    hasManualStakes,
    totalStakeUsed
  };
}

export function SurebetCalculator() {
  const [betInputs, setBetInputs] = useState([
    { id: 1, oddValue: '4', stakeValue: '', betType: 'Casa 1' },
    { id: 2, oddValue: '2.2', stakeValue: '', betType: 'Casa 2' },
    { id: 3, oddValue: '11', stakeValue: '', betType: 'Casa 3' },
    { id: 4, oddValue: '5.11', stakeValue: '', betType: 'Casa 4' },
  ]);

  const [totalInvestment, setTotalInvestment] = useState('396.46');

  const handleAddBetInput = () => {
    const newId = Math.max(...betInputs.map(b => b.id)) + 1;
    setBetInputs([...betInputs, { id: newId, oddValue: '', stakeValue: '', betType: `Casa ${newId}` }]);
  };

  const handleRemoveBetInput = (id: number) => {
    setBetInputs(betInputs.filter(bet => bet.id !== id));
  };

  const handleBetInputChange = (id: number, field: keyof OddInput, value: string) => {
    setBetInputs(betInputs.map(bet => (bet.id === id ? { ...bet, [field]: value } : bet)));
  };

  const calculation = useMemo(() => {
    const investment = parseFloat(totalInvestment) || 0;
    return calculateResults(betInputs, investment);
  }, [betInputs, totalInvestment]);

  return (
    <Card className="bg-card/50 border-dashed">
      <CardHeader>
        <CardTitle className="text-xl">Calculadora de Surebet</CardTitle>
        <CardDescription>Insira as odds e o valor total para calcular automaticamente as stakes ideais</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <Label htmlFor="totalInvestment" className="text-base font-semibold">Investimento Total (R$)</Label>
          <Input
            id="totalInvestment"
            type="number"
            placeholder="ex: 396.46"
            value={totalInvestment}
            onChange={(e) => setTotalInvestment(e.target.value)}
            className="text-lg font-mono mt-2"
            step="0.01"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {betInputs.map((betInput, index) => {
            const calculatedStake = calculation.calculatedStakes?.[index] || 0;
            const isValidOdd = betInput.oddValue && parseFloat(betInput.oddValue) > 0;
            
            return (
              <Card key={betInput.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{betInput.betType}</CardTitle>
                    {betInputs.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBetInput(betInput.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Odd</Label>
                    <Input
                      type="number"
                      placeholder="ex: 2.50"
                      value={betInput.oddValue}
                      onChange={(e) => handleBetInputChange(betInput.id, 'oddValue', e.target.value)}
                      className="font-mono"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Stake Manual (R$)</Label>
                    <Input
                      type="number"
                      placeholder="ex: 100.00"
                      value={betInput.stakeValue}
                      onChange={(e) => handleBetInputChange(betInput.id, 'stakeValue', e.target.value)}
                      className="font-mono"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Stake Sugerida (R$)</Label>
                    <Input
                      type="text"
                      value={isValidOdd ? calculatedStake.toFixed(2) : '0.00'}
                      readOnly
                      className={cn(
                        "font-mono bg-muted text-xs",
                        isValidOdd && calculation.surebetResult?.isSurebet ? "text-blue-600" : "text-muted-foreground"
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-center mb-6">
          <Button variant="outline" onClick={handleAddBetInput}>
            <PlusCircle className="mr-2" /> Adicionar Casa
          </Button>
        </div>

        {/* Resultados Individuais */}
        {calculation.individualResults && calculation.individualResults.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/30 dark:to-slate-700/30 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Resultados por Casa</CardTitle>
              <CardDescription>Lucro individual se cada casa ganhar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {calculation.individualResults.map((result, index) => {
                  const input = betInputs.filter(b => b.oddValue && parseFloat(b.oddValue) > 0)[index];
                  if (!input) return null;
                  
                  return (
                    <div key={index} className={cn(
                      "p-4 rounded-lg border",
                      result.lucro > 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                    )}>
                      <h4 className="font-semibold text-sm mb-2">{input.betType}</h4>
                      <div className="space-y-1 text-xs">
                        <p>Odd: <span className="font-mono">{input.oddValue}</span></p>
                        <p>Stake: <span className="font-mono">R$ {result.stake?.toFixed(2) || '0.00'}</span></p>
                        <p>Retorno: <span className="font-mono">R$ {result.retorno?.toFixed(2) || '0.00'}</span></p>
                        <p className={cn(
                          "font-semibold",
                          result.lucro > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          Lucro: R$ {result.lucro?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-800/30 dark:to-gray-700/30">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral da Operacao</CardTitle>
            <CardDescription>
              {calculation.hasManualStakes 
                ? "Analise baseada nas stakes manuais inseridas" 
                : "Analise matematica da surebet usando a formula S = Soma(1/odd)"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {calculation.surebetResult ? (
              calculation.surebetResult.isSurebet ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg flex-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <DollarSign /> Investimento Total
                      </p>
                      <p className="text-2xl font-bold">
                        {(calculation.hasManualStakes ? calculation.totalStakeUsed : parseFloat(totalInvestment)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {calculation.hasManualStakes ? "Soma das stakes manuais" : "Valor a ser distribuido"}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 text-blue-500 rounded-lg flex-1">
                      <p className="text-sm text-blue-400 flex items-center gap-2 mb-1">Soma das Inversas (S)</p>
                      <p className="text-2xl font-bold font-mono">
                        {calculation.surebetCalc?.S?.toFixed(6) || '0.000'}
                      </p>
                      <p className="text-xs text-blue-400/80">S &lt; 1 = Surebet possivel</p>
                    </div>
                    
                    <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex-1">
                      <p className="text-sm text-green-400 flex items-center gap-2 mb-1">
                        <ShieldCheck /> Lucro Garantido
                      </p>
                      <p className="text-2xl font-bold">
                        {calculation.surebetResult.lucroMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-green-400/80">Qualquer resultado paga isso</p>
                    </div>
                    
                    <div className="p-4 bg-green-500/10 text-green-500 rounded-lg flex-1">
                      <p className="text-sm text-green-400 flex items-center gap-2 mb-1">
                        <Percent /> ROI Garantido
                      </p>
                      <p className="text-2xl font-bold">
                        {calculation.surebetResult.roiMinimo.toFixed(3)}%
                      </p>
                      <p className="text-xs text-green-400/80">Retorno sobre investimento</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="w-6 h-6 text-green-500" />
                      <h3 className="font-bold text-green-500">SUREBET CONFIRMADA!</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Formula:</strong> S = Soma(1/odd) = {calculation.surebetCalc?.S?.toFixed(6) || '0.000'} &lt; 1<br/>
                      <strong>Retorno garantido:</strong> R$ {((parseFloat(totalInvestment) || 0) / (calculation.surebetCalc?.S || 1)).toFixed(2)} (qualquer resultado)<br/>
                      <strong>Stakes calculadas automaticamente</strong> para distribuicao proporcional as inversas das odds.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg flex-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <DollarSign /> Investimento Total
                      </p>
                      <p className="text-2xl font-bold">
                        {(calculation.hasManualStakes ? calculation.totalStakeUsed : parseFloat(totalInvestment)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {calculation.hasManualStakes ? "Soma das stakes manuais" : "Valor inserido"}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-lg flex-1">
                      <p className="text-sm text-red-400 flex items-center gap-2 mb-1">Soma das Inversas (S)</p>
                      <p className="text-2xl font-bold font-mono">
                        {calculation.surebetCalc?.S?.toFixed(6) || '&gt;= 1.000'}
                      </p>
                      <p className="text-xs text-red-400/80">S &gt;= 1 = Nao e surebet</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <h3 className="font-bold text-red-500">NAO E SUREBET</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Problema:</strong> S = Soma(1/odd) = {calculation.surebetCalc?.S?.toFixed(6) || '&gt;= 1.000'} &gt;= 1<br/>
                      <strong>Solucao:</strong> Encontre odds com soma das inversas menor que 1 para garantir lucro.<br/>
                      <strong>Dica:</strong> Odds mais altas (menos provaveis) tendem a criar melhores oportunidades de surebet.
                    </p>
                  </div>
                </>
              )
            ) : (
              <div className="flex items-center gap-4 text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <p className="font-bold">Aguardando dados</p>
                  <p>Insira as odds de pelo menos duas casas e o valor total para calcular a surebet.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}