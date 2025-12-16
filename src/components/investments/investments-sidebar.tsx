"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, BarChart3, Target, Download, RefreshCw } from "lucide-react"
import { useMemo } from "react"

type Period = "week" | "month" | "quarter" | "year"
type AssetClass = "all" | "stock" | "fii" | "etf" | "fixed_income" | "crypto"

type InvestmentsSidebarProps = {
  period: Period
  classFilter: AssetClass
  accountFilter: string
  onPeriodChange: (p: Period) => void
  onClassFilterChange: (c: AssetClass) => void
  onAccountFilterChange: (a: string) => void
  onRefresh?: () => void
  onExport?: () => void
  isLoading?: boolean
  className?: string
  allocation?: { name: string; value: number }[]
}

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"]

export function InvestmentsSidebar({
  period,
  classFilter,
  accountFilter,
  onPeriodChange,
  onClassFilterChange,
  onAccountFilterChange,
  onRefresh,
  onExport,
  isLoading,
  className,
  allocation
}: InvestmentsSidebarProps) {
  const mockAllocation = useMemo(
    () => [
      { name: "Ações", value: 40 },
      { name: "FIIs", value: 20 },
      { name: "ETFs", value: 15 },
      { name: "Renda Fixa", value: 20 },
      { name: "Cripto", value: 5 }
    ],
    []
  )

  return (
    <div className={cn("w-80 bg-card border-r h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Investimentos
              </h2>
              <Badge variant="secondary" className="text-xs">
                Sidebar
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Controle e análise da sua carteira
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">PERÍODO</Label>
            <Select value={period} onValueChange={(v) => onPeriodChange(v as Period)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">CLASSE</Label>
            <Select value={classFilter} onValueChange={(v) => onClassFilterChange(v as AssetClass)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="stock">Ações</SelectItem>
                <SelectItem value="fii">FIIs</SelectItem>
                <SelectItem value="etf">ETFs</SelectItem>
                <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                <SelectItem value="crypto">Cripto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">CONTA</Label>
            <Select value={accountFilter} onValueChange={onAccountFilterChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="xp">XP</SelectItem>
                <SelectItem value="easynvest">Nubank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Alocação por Classe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation && allocation.length ? allocation : mockAllocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {(allocation && allocation.length ? allocation : mockAllocation).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Metas de Alocação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Ações</span>
                  <Badge variant="outline">40%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>FIIs</span>
                  <Badge variant="outline">20%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>ETFs</span>
                  <Badge variant="outline">15%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Renda Fixa</span>
                  <Badge variant="outline">20%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cripto</span>
                  <Badge variant="outline">5%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
