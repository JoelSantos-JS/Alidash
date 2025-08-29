"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Calendar,
  Activity
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"

interface InvestmentData {
  month: string
  return: number
  balance: number
  independence: number
}

interface InvestmentIssuer {
  name: string
  totalInvested: number
  currentBalance: number
  grossReturn: number
  returnPercentage: number
}

interface InvestmentPerformanceChartProps {
  monthlyData: InvestmentData[]
  issuers: InvestmentIssuer[]
  className?: string
}

export function InvestmentPerformanceChart({ 
  monthlyData, 
  issuers, 
  className 
}: InvestmentPerformanceChartProps) {
  
  const chartData = useMemo(() => {
    return monthlyData.map(item => ({
      ...item,
      returnFormatted: `${item.return.toFixed(1)}%`,
      balanceFormatted: `R$ ${item.balance.toLocaleString('pt-BR')}`,
      independenceFormatted: `${item.independence.toFixed(1)}%`
    }))
  }, [monthlyData])

  const totalStats = useMemo(() => {
    const totalInvested = issuers.reduce((acc, issuer) => acc + issuer.totalInvested, 0)
    const totalBalance = issuers.reduce((acc, issuer) => acc + issuer.currentBalance, 0)
    const totalReturn = issuers.reduce((acc, issuer) => acc + issuer.grossReturn, 0)
    const avgReturn = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalBalance,
      totalReturn,
      avgReturn
    }
  }, [issuers])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Gráfico de Performance Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            NOS ÚLTIMOS 12 MESES
          </CardTitle>
          <CardDescription>
            Evolução do rendimento e independência financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Rendimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Grau de Independência Financeira</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}%`, 
                    name === 'return' ? 'Rendimento' : 'Independência'
                  ]}
                />
                <Legend />
                <Bar 
                  dataKey="return" 
                  name="Rendimento" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="independence" 
                  name="Independência" 
                  fill="#6b7280" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Valores monetários abaixo do gráfico */}
          <div className="grid grid-cols-6 gap-2 mt-4 text-xs">
            {chartData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="font-medium text-green-600">{item.returnFormatted}</div>
                <div className="text-muted-foreground">{item.balanceFormatted}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Investimentos por Emissor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            OS POR EMISSOR
          </CardTitle>
          <CardDescription>
            Análise detalhada por instituição financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Emissor</th>
                  <th className="text-right py-2 font-medium">Valor Total Investido</th>
                  <th className="text-right py-2 font-medium">Último Saldo Registrado</th>
                  <th className="text-right py-2 font-medium">Rendimento Bruto</th>
                  <th className="text-right py-2 font-medium">% Retorno</th>
                </tr>
              </thead>
              <tbody>
                {issuers.map((issuer, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{issuer.name}</td>
                    <td className="text-right py-2">
                      R$ {issuer.totalInvested.toLocaleString('pt-BR')}
                    </td>
                    <td className="text-right py-2">
                      R$ {issuer.currentBalance.toLocaleString('pt-BR')}
                    </td>
                    <td className="text-right py-2">
                      <span className={issuer.grossReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                        R$ {issuer.grossReturn.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="text-right py-2">
                      <Badge 
                        variant={issuer.returnPercentage >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {issuer.returnPercentage >= 0 ? '+' : ''}{issuer.returnPercentage.toFixed(2)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
                {/* Linha de totais */}
                <tr className="border-t-2 font-bold bg-muted/30">
                  <td className="py-2">TOTAL</td>
                  <td className="text-right py-2">
                    R$ {totalStats.totalInvested.toLocaleString('pt-BR')}
                  </td>
                  <td className="text-right py-2">
                    R$ {totalStats.totalBalance.toLocaleString('pt-BR')}
                  </td>
                  <td className="text-right py-2">
                    <span className={totalStats.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                      R$ {totalStats.totalReturn.toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="text-right py-2">
                    <Badge 
                      variant={totalStats.avgReturn >= 0 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {totalStats.avgReturn >= 0 ? '+' : ''}{totalStats.avgReturn.toFixed(2)}%
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 