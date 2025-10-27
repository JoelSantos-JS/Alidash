"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  PiggyBank, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Construction,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodSelector } from "@/components/dashboard/period-selector";

interface PersonalDashboardProps {
  summaryStats: {
    periodRevenue: number;
    periodExpenses: number;
    periodBalance: number;
    expenseRatio: number;
    financialHealth: string;
    healthColor: string;
  };
  className?: string;
}

/**
 * Dashboard Pessoal - Preparado para Implementação Futura
 * 
 * Este componente está estruturado para receber as funcionalidades
 * pessoais quando forem implementadas. Atualmente mostra uma
 * interface de "em desenvolvimento" com preview das funcionalidades.
 */
export function PersonalDashboard({ summaryStats, className }: PersonalDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-bold">Dashboard Pessoal</h2>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <PeriodSelector 
            currentDate={currentDate} 
            onDateChange={(date) => {
              setCurrentDate(date);
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              console.log(`Carregando dados pessoais para: ${month}/${year}`);
              // Aqui seria implementada a chamada para API
            }} 
            className="flex-1 sm:flex-initial"
          />
          <Badge variant="outline" className="gap-1">
            <Construction className="h-3.5 w-3.5" />
            <span>Em desenvolvimento</span>
          </Badge>
        </div>
      </div>
      {/* Header de Desenvolvimento */}
      <Card className="border-dashed border-2 border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Construction className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                Dashboard Pessoal - Em Desenvolvimento
              </h2>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Esta funcionalidade está sendo preparada para futuras expansões do projeto.
              </p>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              <User className="h-3 w-3 mr-1" />
              Pessoal
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Preview das Funcionalidades Pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Resumo Financeiro Pessoal */}
        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-4 w-4" />
              Finanças Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receitas</span>
                <span className="font-medium text-green-600">
                  {summaryStats.periodRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Despesas</span>
                <span className="font-medium text-red-600">
                  {summaryStats.periodExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Saldo</span>
                <span className={cn(
                  "font-bold",
                  summaryStats.periodBalance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {summaryStats.periodBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metas Pessoais */}
        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Metas Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Reserva de Emergência</span>
                  <span className="text-muted-foreground">0%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Meta de Economia</span>
                  <span className="text-muted-foreground">0%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saúde Financeira */}
        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <div className="text-2xl font-bold text-muted-foreground">
                {summaryStats.financialHealth}
              </div>
              <div className="text-sm text-muted-foreground">
                Baseado na relação receitas/despesas
              </div>
              <div className={cn(
                "text-xs px-2 py-1 rounded-full inline-block",
                "bg-muted text-muted-foreground"
              )}>
                {summaryStats.expenseRatio.toFixed(1)}% de gastos
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action para Implementação */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Funcionalidades Pessoais em Breve
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Estamos preparando um dashboard completo para suas finanças pessoais com:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Controle de gastos pessoais</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Metas de economia</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Planejamento financeiro</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Relatórios personalizados</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4" disabled>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Em Desenvolvimento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}