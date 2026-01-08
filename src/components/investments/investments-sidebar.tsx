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
import { TrendingUp, BarChart3, Target, Download, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useIsMobile } from "@/hooks/use-mobile"

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
  userId?: string
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
  allocation,
  userId
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
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [showAddForm, setShowAddForm] = useState(false)
  const [accounts, setAccounts] = useState<{ id: string; name: string; broker?: string | null }[]>([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newInvestment, setNewInvestment] = useState<{
    ticker: string
    assetClass: AssetClass
    quantity: number
    avgPrice: number
    accountId?: string | null
    fiType?: "tesouro_selic" | "cdb" | "lca"
  }>({
    ticker: "",
    assetClass: "stock",
    quantity: 0,
    avgPrice: 0,
    accountId: null,
    fiType: undefined
  })
  const [goalsOpen, setGoalsOpen] = useState(true)
  useEffect(() => {
    setGoalsOpen(!isMobile)
  }, [isMobile])

  useEffect(() => {
    const loadAccounts = async () => {
      if (!userId) return
      try {
        const res = await fetch(`/api/investments/accounts?user_id=${userId}`)
        if (res.ok) {
          const json = await res.json()
          setAccounts(json.accounts || [])
        }
      } catch {}
    }
    loadAccounts()
  }, [userId])

  const handleCreateAccount = async () => {
    if (!userId) {
      toast({ title: "Usuário não identificado", description: "Faça login para criar contas" })
      return
    }
    if (!newAccountName.trim()) {
      toast({ title: "Corretora obrigatória", description: "Informe o nome da corretora" })
      return
    }
    try {
      const res = await fetch("/api/investments/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: newAccountName.trim(),
          broker: null
        })
      })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: "Erro ao criar conta", description: json.error || "Tente novamente" })
        return
      }
      const created = json.account
      setAccounts((prev) => [created, ...prev])
      setShowAddAccount(false)
      setNewAccountName("")
      onAccountFilterChange(created.id)
      setNewInvestment((s) => ({ ...s, accountId: created.id }))
      toast({ title: "Corretora criada", description: "Corretora adicionada com sucesso" })
    } catch (e: any) {
      toast({ title: "Erro inesperado", description: e?.message || "Falha ao conectar com o servidor" })
    }
  }
  const handleAddInvestment = async () => {
    if (!userId) {
      toast({ title: "Usuário não identificado", description: "Faça login para adicionar investimentos" })
      return
    }
    const qty = Number(newInvestment.quantity) || 0
    const price = Number(newInvestment.avgPrice) || 0
    const rfMap: Record<string, string> = {
      tesouro_selic: "TESOURO SELIC",
      cdb: "CDB",
      lca: "LCA"
    }
    const finalTicker =
      (newInvestment.ticker && newInvestment.ticker.trim()) ||
      (newInvestment.assetClass === "fixed_income" && newInvestment.fiType ? rfMap[newInvestment.fiType] : "")
    if (!finalTicker || qty <= 0 || price <= 0) {
      toast({ title: "Dados inválidos", description: "Preencha ticker, quantidade e preço médio" })
      return
    }
    try {
      const res = await fetch("/api/investments/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ticker: finalTicker.trim().toUpperCase(),
          class: newInvestment.assetClass,
          quantity: qty,
          avg_price: price,
          account_id: newInvestment.accountId || null
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Erro ao salvar investimento", description: err.error || "Tente novamente" })
        return
      }
      toast({ title: "Investimento adicionado", description: "Posição criada com sucesso" })
      setShowAddForm(false)
      setNewInvestment({ ticker: "", assetClass: "stock", quantity: 0, avgPrice: 0, accountId: null })
      onRefresh?.()
    } catch (e: any) {
      toast({ title: "Erro inesperado", description: e?.message || "Falha ao conectar com o servidor" })
    }
  }

  return (
    <div className={cn("w-full sm:w-80 bg-card border-r h-full flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Investimentos
              </h2>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Sidebar
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Controle e análise da sua carteira
            </p>
          </div>

          <div className="hidden sm:grid grid-cols-2 gap-2">
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

          <div className="space-y-2">
            <Button 
              size="sm" 
              className="w-full justify-center"
              onClick={() => setShowAddForm((v) => !v)}
              variant={showAddForm ? "secondary" : "default"}
            >
              {showAddForm ? "Cancelar" : "Adicionar Investimento"}
            </Button>
            {showAddForm && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Novo Investimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {newInvestment.assetClass !== "fixed_income" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Ticker</Label>
                      <Input
                        className="h-8 sm:h-9"
                        value={newInvestment.ticker}
                        onChange={(e) => setNewInvestment((s) => ({ ...s, ticker: e.target.value }))}
                        placeholder="Ex: PETR4"
                      />
                    </div>
                  )}
                    <div className="space-y-1">
                      <Label className="text-xs">Classe</Label>
                      <Select
                        value={newInvestment.assetClass}
                        onValueChange={(v) => setNewInvestment((s) => ({ ...s, assetClass: v as AssetClass }))}
                      >
                        <SelectTrigger className="h-8 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Ações</SelectItem>
                          <SelectItem value="fii">FIIs</SelectItem>
                          <SelectItem value="etf">ETFs</SelectItem>
                          <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                          <SelectItem value="crypto">Cripto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newInvestment.assetClass === "fixed_income" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo (Renda Fixa)</Label>
                        <Select
                          value={newInvestment.fiType || ""}
                          onValueChange={(v) => setNewInvestment((s) => ({ ...s, fiType: (v as any) || undefined }))}
                        >
                          <SelectTrigger className="h-8 sm:h-9">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tesouro_selic">Tesouro Selic</SelectItem>
                            <SelectItem value="cdb">CDB</SelectItem>
                            <SelectItem value="lca">LCA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  <div className="space-y-1">
                    <Label className="text-xs">Corretora</Label>
                    <Select
                      value={newInvestment.accountId || ""}
                      onValueChange={(v) => setNewInvestment((s) => ({ ...s, accountId: v === "none" ? null : v }))}
                    >
                      <SelectTrigger className="h-8 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.length > 0 ? (
                          accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}{acc.broker ? ` • ${acc.broker}` : ""}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="none">Sem conta</SelectItem>
                            <SelectItem value="clear">Clear</SelectItem>
                            <SelectItem value="xp">XP</SelectItem>
                            <SelectItem value="easynvest">Nubank</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        className="h-8 sm:h-9"
                        type="number"
                        value={Number.isFinite(newInvestment.quantity) ? newInvestment.quantity : 0}
                        onChange={(e) => setNewInvestment((s) => ({ ...s, quantity: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preço Médio</Label>
                      <Input
                        className="h-8 sm:h-9"
                        type="number"
                        value={Number.isFinite(newInvestment.avgPrice) ? newInvestment.avgPrice : 0}
                        onChange={(e) => setNewInvestment((s) => ({ ...s, avgPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleAddInvestment}>
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">PERÍODO</Label>
            <Select value={period} onValueChange={(v) => onPeriodChange(v as Period)}>
              <SelectTrigger className="h-8 sm:h-9">
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

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">CLASSE</Label>
            <Select value={classFilter} onValueChange={(v) => onClassFilterChange(v as AssetClass)}>
              <SelectTrigger className="h-8 sm:h-9">
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

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">CORRETORA</Label>
            <Select value={accountFilter} onValueChange={onAccountFilterChange}>
              <SelectTrigger className="h-8 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.length > 0 ? (
                  accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}{acc.broker ? ` • ${acc.broker}` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="xp">XP</SelectItem>
                    <SelectItem value="easynvest">Nubank</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Button size="sm" variant={showAddAccount ? "secondary" : "outline"} onClick={() => setShowAddAccount((v) => !v)}>
                {showAddAccount ? "Cancelar" : "Nova Corretora"}
              </Button>
              {showAddAccount && (
                <Card>
                  <CardContent className="space-y-2 p-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Corretora</Label>
                      <Input className="h-8 sm:h-9" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Ex: Clear, XP, Binance" />
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleCreateAccount}>Salvar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
              <div className="h-36 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation && allocation.length ? allocation : mockAllocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={isMobile ? 36 : 50}
                      outerRadius={isMobile ? 64 : 80}
                    >
                      {(allocation && allocation.length ? allocation : mockAllocation).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Metas de Alocação
                  </CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="sm:hidden">
                      {goalsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </ScrollArea>
      <div className="sm:hidden border-t bg-card p-2">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 w-full"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            className="gap-2 w-full"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
    </div>
  )
}
