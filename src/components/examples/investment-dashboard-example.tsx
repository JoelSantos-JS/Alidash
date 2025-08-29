"use client"

import { CircularProgressChart } from "@/components/goals/circular-progress-chart"
import { InvestmentPerformanceChart } from "@/components/dashboard/investment-performance-chart"
import { Home, Plane, Shield, DollarSign } from "lucide-react"

// Dados de exemplo para metas financeiras
const exampleGoals = [
  {
    id: "reforma-casa",
    name: "REFORMA DA CASA",
    currentValue: 38500,
    targetValue: 50000,
    progress: 77,
    color: "#06b6d4",
    icon: Home
  },
  {
    id: "viagem-exterior",
    name: "VIAGEM AO EXTERIOR",
    currentValue: 18200,
    targetValue: 20000,
    progress: 91,
    color: "#06b6d4",
    icon: Plane
  },
  {
    id: "reserva-emergencia",
    name: "RESERVA DE EMERGÊNCIA",
    currentValue: 11400,
    targetValue: 20000,
    progress: 57,
    color: "#06b6d4",
    icon: Shield
  },
  {
    id: "independencia-financeira",
    name: "GRAU DE COMPROMETIMENTO",
    currentValue: 25500,
    targetValue: 50000,
    progress: 51,
    color: "#f97316",
    icon: DollarSign
  }
]

// Dados de exemplo para performance mensal
const monthlyData = [
  { month: "Fev 2024", return: 7.0, balance: 1578.29, independence: 12.5 },
  { month: "Mar 2024", return: 8.2, balance: 1707.51, independence: 14.2 },
  { month: "Abr 2024", return: 9.1, balance: 1862.89, independence: 16.8 },
  { month: "Mai 2024", return: 10.3, balance: 2054.76, independence: 19.5 },
  { month: "Jun 2024", return: 11.7, balance: 2295.17, independence: 22.1 },
  { month: "Jul 2024", return: 12.4, balance: 2580.37, independence: 25.3 },
  { month: "Ago 2024", return: 13.2, balance: 2920.98, independence: 28.7 },
  { month: "Set 2024", return: 14.1, balance: 3332.84, independence: 32.4 },
  { month: "Out 2024", return: 15.3, balance: 3841.42, independence: 36.8 },
  { month: "Nov 2024", return: 16.2, balance: 4461.73, independence: 41.2 },
  { month: "Dez 2024", return: 17.0, balance: 4134.53, independence: 45.6 }
]

// Dados de exemplo para emissores
const issuersData = [
  {
    name: "Corretora ABC",
    totalInvested: 150000,
    currentBalance: 164577.27,
    grossReturn: 14577.27,
    returnPercentage: 9.72
  },
  {
    name: "Independência Financeira",
    totalInvested: 80000,
    currentBalance: 89634.12,
    grossReturn: 9634.12,
    returnPercentage: 12.04
  },
  {
    name: "Viagem ao exterior",
    totalInvested: 45000,
    currentBalance: 48789.45,
    grossReturn: 3789.45,
    returnPercentage: 8.42
  },
  {
    name: "Corretora DEF",
    totalInvested: 120000,
    currentBalance: 118766.90,
    grossReturn: -1233.10,
    returnPercentage: -1.03
  },
  {
    name: "Reforma da casa",
    totalInvested: 60000,
    currentBalance: 59761.42,
    grossReturn: -238.58,
    returnPercentage: -0.40
  },
  {
    name: "Reserva de emergência",
    totalInvested: 35000,
    currentBalance: 35234.53,
    grossReturn: 234.53,
    returnPercentage: 0.67
  }
]

export function InvestmentDashboardExample() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dashboard de Investimentos</h1>
        <p className="text-muted-foreground">
          Exemplo de visualização similar aos gráficos das imagens
        </p>
      </div>

      {/* Gráficos Circulares de Progresso */}
      <CircularProgressChart 
        goals={exampleGoals}
        title="Progresso das Metas Financeiras"
        description="Acompanhe o progresso de suas principais metas financeiras"
      />

      {/* Gráfico de Performance de Investimentos */}
      <InvestmentPerformanceChart 
        monthlyData={monthlyData}
        issuers={issuersData}
      />
    </div>
  )
} 