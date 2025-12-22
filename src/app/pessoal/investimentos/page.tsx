"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvestmentsSidebar } from "@/components/investments/investments-sidebar"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-supabase-auth"
import { useToast } from "@/hooks/use-toast"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { TrendingUp, DollarSign, PieChart as PieIcon, Menu, ArrowLeft, CalendarDays, Pencil, Trash2 } from "lucide-react"

type Period = "week" | "month" | "quarter" | "year"
type AssetClass = "all" | "stock" | "fii" | "etf" | "fixed_income" | "crypto"

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"]

export default function InvestimentosPage() {
  const [period, setPeriod] = useState<Period>("month")
  const [classFilter, setClassFilter] = useState<AssetClass>("all")
  const [accountFilter, setAccountFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user } = useAuth()
  const [allocationData, setAllocationData] = useState<{ name: string; value: number }[]>([])
  const [totalValor, setTotalValor] = useState(0)
  const [totalAportes, setTotalAportes] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [positions, setPositions] = useState<
    { id: string; ticker: string; name: string; class: string; quantity: number; avgPrice: number; marketPrice: number; marketValue: number }[]
  >([])
  const [accounts, setAccounts] = useState<{ id: string; name: string; broker?: string | null }[]>([])
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [selic, setSelic] = useState<number | null>(null)
  const [cdi, setCdi] = useState<number | null>(null)
  const [ipca, setIpca] = useState<number | null>(null)
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const classTotals = useMemo(() => {
    const map: Record<string, number> = { stock: 0, fii: 0, etf: 0, fixed_income: 0, crypto: 0 }
    positions.forEach((p) => {
      const k = String(p.class)
      const v = Number(p.marketValue) || 0
      map[k] = (map[k] || 0) + v
    })
    return map
  }, [positions])

  const [portfolioSeries, setPortfolioSeries] = useState<
    { label: string; value: number; aportes: number }[]
  >([
    { label: "Jan", value: 0, aportes: 0 },
    { label: "Fev", value: 0, aportes: 0 },
    { label: "Mar", value: 0, aportes: 0 },
    { label: "Abr", value: 0, aportes: 0 },
    { label: "Mai", value: 0, aportes: 0 },
    { label: "Jun", value: 0, aportes: 0 }
  ])

  // Simplificado: sem drawdown calculado
  const [editingPos, setEditingPos] = useState<{ id: string; quantity: number; avgPrice: number } | null>(null)

  const contributionSchema = z.object({
    amount: z.number().min(0.01, "Valor deve ser maior que zero"),
    assetClass: z.enum(["stock", "fii", "etf", "fixed_income", "crypto"]),
    account: z.string().min(1, "Conta é obrigatória"),
    date: z.date(),
    notes: z.string().optional(),
    ticker: z.string().optional(),
    fixedIncomeType: z.enum(["tesouro_selic", "cdb", "lca"]).optional()
  })
  type ContributionFormData = z.infer<typeof contributionSchema>
  const contributionForm = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: 0,
      assetClass: "stock",
      account: "clear",
      date: new Date(),
      notes: "",
      ticker: "",
      fixedIncomeType: undefined
    }
  })
  const [amountInput, setAmountInput] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch("/api/investments/status")
        setApiOk(res.ok)
      } catch {
        setApiOk(false)
      }
    }
    const fetchRates = async () => {
      try {
        const [selicRes, cdiRes, ipcaRes] = await Promise.all([
          fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json"),
          fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json"),
          fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json")
        ])
        const selicJson = await selicRes.json().catch(() => [])
        const cdiJson = await cdiRes.json().catch(() => [])
        const ipcaJson = await ipcaRes.json().catch(() => [])
        setSelic(Number(selicJson?.[0]?.valor) || null)
        setCdi(Number(cdiJson?.[0]?.valor) || null)
        setIpca(Number(ipcaJson?.[0]?.valor) || null)
      } catch {}
    }
    checkApi()
    fetchRates()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      setIsLoading(true)
      try {
        const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
        const accountParam = accountFilter !== "all" ? `&account_id=${accountFilter}` : ""
        const accountsRes = await fetch(`/api/investments/accounts?user_id=${user.id}`)
        if (accountsRes.ok) {
          const json = await accountsRes.json()
          setAccounts(json.accounts || [])
        }
        const [positionsRes, allocationRes, contributionsRes] = await Promise.all([
          fetch(`/api/investments/positions?user_id=${user.id}${classParam}${accountParam}`),
          fetch(`/api/investments/allocation?user_id=${user.id}${accountParam}`),
          fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}${accountParam}`)
        ])

        let totalFromPositions = 0
        if (positionsRes.ok) {
          const { positions } = await positionsRes.json()
          totalFromPositions = (positions || []).reduce((sum: number, p: any) => sum + (Number(p.marketValue) || 0), 0)
          setTotalValor(totalFromPositions)
          setPositions(positions || [])
        }

        if (allocationRes.ok) {
          const { distribution } = await allocationRes.json()
          const mapped = (distribution || []).map((d: any) => ({
            name: d.class === "stock" ? "Ações" :
                  d.class === "fii" ? "FIIs" :
                  d.class === "etf" ? "ETFs" :
                  d.class === "fixed_income" ? "Renda Fixa" :
                  d.class === "crypto" ? "Cripto" : String(d.class),
            value: Number(d.percentage) || 0
          }))
          setAllocationData(mapped)
        }

        if (contributionsRes.ok) {
          const { contributions } = await contributionsRes.json()
          const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
          const totals = (contributions || []).map((c: any) => Number(c.total) || 0)
          const series = (contributions || []).map((c: any, i: number) => {
            const [year, month] = String(c.month).split("-").map((x: string) => Number(x))
            const label = monthsLabels[(month - 1) % 12]
            const remainder = totals.slice(i + 1).reduce((acc: number, v: number) => acc + v, 0)
            const value = Math.max(0, totalFromPositions - remainder)
            return { label, value, aportes: totals[i] }
          })
          setPortfolioSeries(series)
          setTotalAportes(
            series.reduce(
              (acc: number, p: { label: string; value: number; aportes: number }) => acc + p.aportes,
              0
            )
          )
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  // Sem efeito de drawdown
  useEffect(() => {
    const fetchMacroRates = async () => {
      try {
        const urls = [
          "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json",
          "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json",
          "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json"
        ]
        const [selicRes, cdiRes, ipcaRes] = await Promise.all(urls.map((u) => fetch(u)))
        const selicJson = await selicRes.json().catch(() => [])
        const cdiJson = await cdiRes.json().catch(() => [])
        const ipcaJson = await ipcaRes.json().catch(() => [])
        const parseVal = (arr: any) => {
          const v = Array.isArray(arr) && arr.length > 0 ? arr[0]?.valor : null
          const n = v != null ? Number(String(v).replace(",", ".")) : null
          return Number.isFinite(n as number) ? (n as number) : null
        }
        setSelic(parseVal(selicJson))
        setCdi(parseVal(cdiJson))
        setIpca(parseVal(ipcaJson))
      } catch {}
    }
    fetchMacroRates()
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <InvestmentsSidebar
        period={period}
        classFilter={classFilter}
        accountFilter={accountFilter}
        onPeriodChange={setPeriod}
        onClassFilterChange={setClassFilter}
        onAccountFilterChange={setAccountFilter}
        onRefresh={() => {
          if (user?.id) {
            setIsLoading(true)
            const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
            const accountParam = accountFilter !== "all" ? `&account_id=${accountFilter}` : ""
            Promise.all([
              fetch(`/api/investments/positions?user_id=${user.id}${classParam}${accountParam}`),
              fetch(`/api/investments/allocation?user_id=${user.id}${accountParam}`),
              fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}${accountParam}`)
            ]).then(async ([positionsRes, allocationRes, contributionsRes]) => {
              let totalFromPositions = 0
              if (positionsRes.ok) {
                const { positions } = await positionsRes.json()
                totalFromPositions = (positions || []).reduce((sum: number, p: any) => sum + (Number(p.marketValue) || 0), 0)
                setTotalValor(totalFromPositions)
                setPositions(positions || [])
              }
              if (allocationRes.ok) {
                const { distribution } = await allocationRes.json()
                const mapped = (distribution || []).map((d: any) => ({
                  name: d.class === "stock" ? "Ações" :
                        d.class === "fii" ? "FIIs" :
                        d.class === "etf" ? "ETFs" :
                        d.class === "fixed_income" ? "Renda Fixa" :
                        d.class === "crypto" ? "Cripto" : String(d.class),
                  value: Number(d.percentage) || 0
                }))
                setAllocationData(mapped)
              }
              if (contributionsRes.ok) {
                const { contributions } = await contributionsRes.json()
                const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
                const totals = (contributions || []).map((c: any) => Number(c.total) || 0)
                const series = (contributions || []).map((c: any, i: number) => {
                  const [year, month] = String(c.month).split("-").map((x: string) => Number(x))
                  const label = monthsLabels[(month - 1) % 12]
                  const remainder = totals.slice(i + 1).reduce((acc: number, v: number) => acc + v, 0)
                  const value = Math.max(0, totalFromPositions - remainder)
                  return { label, value, aportes: totals[i] }
                })
                setPortfolioSeries(series)
                setTotalAportes(
                  series.reduce(
                    (acc: number, p: { label: string; value: number; aportes: number }) => acc + p.aportes,
                    0
                  )
                )
              }
            }).finally(() => setIsLoading(false))
          }
        }}
        onExport={() => {}}
        isLoading={isLoading}
        allocation={allocationData}
        userId={user?.id}
        className="hidden lg:flex"
      />

      <div className="flex-1 flex flex-col">
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetTitle className="sr-only">Menu de Investimentos</SheetTitle>
                  <InvestmentsSidebar
                    period={period}
                    classFilter={classFilter}
                    accountFilter={accountFilter}
                    onPeriodChange={setPeriod}
                    onClassFilterChange={setClassFilter}
                    onAccountFilterChange={setAccountFilter}
                    onRefresh={() => {}}
                    onExport={() => {}}
                    isLoading={isLoading}
                    allocation={allocationData}
                    userId={user?.id}
                  />
                </SheetContent>
              </Sheet>
              <TrendingUp className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Investimentos</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{period === "month" ? "Mês" : period}</Badge>
              {period === "month" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              {apiOk !== null && (
                <Badge variant="outline">{apiOk ? "API OK" : "API Falha"}</Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <PieIcon className="h-3 w-3" />
                {classFilter === "all" ? "Todas as classes" : classFilter}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="pessoais" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pessoais">Pessoais</TabsTrigger>
              <TabsTrigger value="geral">Geral</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoais">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Adicionar Aporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...contributionForm}>
                    <form
                      onSubmit={contributionForm.handleSubmit(async (data) => {
                        if (!user?.id) {
                          toast({ title: "Usuário não identificado", description: "Faça login para salvar aportes" })
                          return
                        }
                        try {
                          const selectedAccountId = accounts.find(acc => acc.id === data.account)?.id || null
                          const rfMap: Record<string, string> = {
                            tesouro_selic: "TESOURO SELIC",
                            cdb: "CDB",
                            lca: "LCA"
                          }
                          const derivedTicker =
                            data.assetClass === "fixed_income"
                              ? ((data.fixedIncomeType && rfMap[data.fixedIncomeType]) || undefined)
                              : undefined
                          const payload = {
                            user_id: user.id,
                            ticker: ((data as any).ticker || derivedTicker) || undefined,
                            asset_class: data.assetClass,
                            quantity: 1,
                            unit_price: data.amount,
                            fees: 0,
                            taxes: 0,
                            date: data.date.toISOString(),
                            notes: data.notes || "",
                            account_id: selectedAccountId
                          }
                          const res = await fetch("/api/investments/contributions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                          })
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}))
                            toast({ title: "Erro ao salvar aporte", description: err.error || "Tente novamente" })
                            return
                          }
                          toast({ title: "Aporte registrado", description: "Contribuição salva com sucesso" })
                          contributionForm.reset({
                            amount: 0,
                            assetClass: "stock",
                            account: "clear",
                            date: new Date(),
                            notes: ""
                          })
                          setAmountInput("")
                          setIsLoading(true)
                          const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
                          Promise.all([
                            fetch(`/api/investments/positions?user_id=${user.id}${classParam}`),
                            fetch(`/api/investments/allocation?user_id=${user.id}`),
                            fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}`)
                          ]).then(async ([positionsRes, allocationRes, contributionsRes]) => {
                            let totalFromPositions = 0
                            if (positionsRes.ok) {
                              const { positions } = await positionsRes.json()
                              totalFromPositions = (positions || []).reduce((sum: number, p: any) => sum + (Number(p.marketValue) || 0), 0)
                              setTotalValor(totalFromPositions)
                              setPositions(positions || [])
                            }
                            if (allocationRes.ok) {
                              const { distribution } = await allocationRes.json()
                              const mapped = (distribution || []).map((d: any) => ({
                                name: d.class === "stock" ? "Ações" :
                                      d.class === "fii" ? "FIIs" :
                                      d.class === "etf" ? "ETFs" :
                                      d.class === "fixed_income" ? "Renda Fixa" :
                                      d.class === "crypto" ? "Cripto" : String(d.class),
                                value: Number(d.percentage) || 0
                              }))
                              setAllocationData(mapped)
                            }
                            if (contributionsRes.ok) {
                              const { contributions } = await contributionsRes.json()
                              const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
                              const totals = (contributions || []).map((c: any) => Number(c.total) || 0)
                              const series = (contributions || []).map((c: any, i: number) => {
                                const [year, month] = String(c.month).split("-").map((x: string) => Number(x))
                                const label = monthsLabels[(month - 1) % 12]
                                const remainder = totals.slice(i + 1).reduce((acc: number, v: number) => acc + v, 0)
                                const value = Math.max(0, totalFromPositions - remainder)
                                return { label, value, aportes: totals[i] }
                              })
                              setPortfolioSeries(series)
                              setTotalAportes(
                                series.reduce(
                                  (acc: number, p: { label: string; value: number; aportes: number }) => acc + p.aportes,
                                  0
                                )
                              )
                            }
                          }).finally(() => setIsLoading(false))
                        } catch (e: any) {
                          toast({ title: "Erro inesperado", description: e?.message || "Falha ao conectar com o servidor" })
                        }
                      })}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={contributionForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor do Aporte</FormLabel>
                              <FormControl>
                                <Input
                                  value={amountInput}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    const digits = v.replace(/\D/g, "")
                                    const number = digits ? parseInt(digits, 10) : 0
                                    const formatted = (number / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    setAmountInput(formatted)
                                    field.onChange(number / 100)
                                  }}
                                  placeholder="R$ 0,00"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contributionForm.control}
                          name="assetClass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Classe</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a classe" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stock">Ações</SelectItem>
                                  <SelectItem value="fii">FIIs</SelectItem>
                                  <SelectItem value="etf">ETFs</SelectItem>
                                  <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                                  <SelectItem value="crypto">Cripto</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {contributionForm.watch("assetClass") === "fixed_income" ? (
                          <FormField
                            control={contributionForm.control}
                            name="fixedIncomeType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo (Renda Fixa)</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tesouro_selic">Tesouro Selic</SelectItem>
                                    <SelectItem value="cdb">CDB</SelectItem>
                                    <SelectItem value="lca">LCA</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <FormField
                            control={contributionForm.control}
                            name="ticker"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ticker (opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: BOVA11"
                                    value={(field.value as any) || ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={contributionForm.control}
                          name="account"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Corretora</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a conta" />
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
                                      <SelectItem value="clear">Clear</SelectItem>
                                      <SelectItem value="xp">XP</SelectItem>
                                      <SelectItem value="easynvest">Nubank</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              <div className="mt-2 space-y-2">
                                <Button size="sm" variant={showNewAccount ? "secondary" : "outline"} onClick={() => setShowNewAccount(v => !v)}>
                                  {showNewAccount ? "Cancelar" : "Nova Corretora"}
                                </Button>
                                {showNewAccount && (
                                  <Card>
                                    <CardContent className="space-y-2 p-3">
                                      <div className="space-y-1">
                                        <FormLabel className="text-xs">Corretora</FormLabel>
                                        <Input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="Ex: Clear, XP, Binance" />
                                      </div>
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          onClick={async () => {
                                            if (!user?.id || !newAccountName.trim()) {
                                              toast({ title: "Dados inválidos", description: "Informe o nome da corretora" })
                                              return
                                            }
                                            const res = await fetch("/api/investments/accounts", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({
                                                user_id: user.id,
                                                name: newAccountName.trim(),
                                                broker: null
                                              })
                                            })
                                            const json = await res.json()
                                            if (!res.ok) {
                                              toast({ title: "Erro ao criar conta", description: json.error || "Tente novamente" })
                                              return
                                            }
                                            setAccounts(prev => [json.account, ...prev])
                                            contributionForm.setValue("account", json.account.id)
                                            setShowNewAccount(false)
                                            setNewAccountName("")
                                            toast({ title: "Corretora criada", description: "Corretora adicionada com sucesso" })
                                          }}
                                        >
                                          Salvar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contributionForm.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecionar data"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={contributionForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detalhes sobre o aporte" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button type="submit">Salvar Aporte</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taxas de Referência</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Selic</p>
                      <p className="font-medium">{selic !== null ? `${selic.toFixed(2)}%` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CDI</p>
                      <p className="font-medium">{cdi !== null ? `${cdi.toFixed(2)}%` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IPCA</p>
                      <p className="font-medium">{ipca !== null ? `${ipca.toFixed(2)}%` : "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Valor da Carteira</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Atual</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Aportes no Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-2xl font-bold", "text-green-600")}>
                      {totalAportes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Total de contribuições</p>
                  </CardContent>
                </Card>
              <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Saldo de Ganhos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {(totalValor - totalAportes).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Variação líquida</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Valor da Carteira
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={portfolioSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" name="Valor" stroke="#6366F1" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Aportes Mensais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={portfolioSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="aportes" name="Aportes" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
              </Card>
              </div>

              {/* Seção de drawdown removida para simplificar a interface */}

              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Investimentos de Renda Fixa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {positions.filter((p) => p.class === "fixed_income").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Ticker</th>
                              <th className="text-right py-2 font-medium">Quantidade</th>
                              <th className="text-right py-2 font-medium">Preço Médio</th>
                              <th className="text-right py-2 font-medium">Preço de Mercado</th>
                              <th className="text-right py-2 font-medium">Valor de Mercado</th>
                              <th className="text-right py-2 font-medium">Juros</th>
                              <th className="text-right py-2 font-medium">Preço Futuro (12m)</th>
                              <th className="text-right py-2 font-medium">Lucro Previsto (12m)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions
                              .filter((p) => p.class === "fixed_income")
                              .map((p) => (
                                <tr key={p.id} className="border-b hover:bg-muted/50">
                                  <td className="py-2 font-medium">{p.ticker}</td>
                                  <td className="text-right py-2">{p.quantity}</td>
                                  <td className="text-right py-2">
                                    {Number(p.avgPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {(() => {
                                      const t = String(p.ticker || "").toUpperCase()
                                      const r =
                                        t.includes("SELIC") || t.includes("TESOURO")
                                          ? selic
                                          : t.includes("CDB")
                                          ? cdi
                                          : t.includes("LCA")
                                          ? cdi
                                          : null
                                      return r != null ? `${Number(r).toFixed(2)}%` : "-"
                                    })()}
                                  </td>
                                  <td className="text-right py-2">
                                    {(() => {
                                      const price = Number(p.marketPrice) || 0
                                      const t = String(p.ticker || "").toUpperCase()
                                      const r =
                                        t.includes("SELIC") || t.includes("TESOURO")
                                          ? selic
                                          : t.includes("CDB")
                                          ? cdi
                                          : t.includes("LCA")
                                          ? cdi
                                          : null
                                      const fut = r != null ? price * (1 + Number(r) / 100) : price
                                      return fut.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    })()}
                                  </td>
                                  <td className="text-right py-2">
                                    {(() => {
                                      const qty = Number(p.quantity) || 0
                                      const price = Number(p.marketPrice) || 0
                                      const t = String(p.ticker || "").toUpperCase()
                                      const r =
                                        t.includes("SELIC") || t.includes("TESOURO")
                                          ? selic
                                          : t.includes("CDB")
                                          ? cdi
                                          : t.includes("LCA")
                                          ? cdi
                                          : null
                                      const fut = r != null ? price * (1 + Number(r) / 100) : price
                                      const profit = qty * (fut - price)
                                      return profit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    })()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma posição de renda fixa</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Investimentos em Ações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {positions.filter((p) => p.class === "stock").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Ticker</th>
                              <th className="text-right py-2 font-medium">Quantidade</th>
                              <th className="text-right py-2 font-medium">Preço Médio</th>
                              <th className="text-right py-2 font-medium">Preço de Mercado</th>
                              <th className="text-right py-2 font-medium">Valor de Mercado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions
                              .filter((p) => p.class === "stock")
                              .map((p) => (
                                <tr key={p.id} className="border-b hover:bg-muted/50">
                                  <td className="py-2 font-medium">{p.ticker}</td>
                                  <td className="text-right py-2">{p.quantity}</td>
                                  <td className="text-right py-2">
                                    {Number(p.avgPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketPrice).toLocaleString("pt-BR", { style: "currency", "BRL": "BRL" } as any)}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma posição em ações</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Investimentos em FIIs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {positions.filter((p) => p.class === "fii").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Ticker</th>
                              <th className="text-right py-2 font-medium">Quantidade</th>
                              <th className="text-right py-2 font-medium">Preço Médio</th>
                              <th className="text-right py-2 font-medium">Preço de Mercado</th>
                              <th className="text-right py-2 font-medium">Valor de Mercado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions
                              .filter((p) => p.class === "fii")
                              .map((p) => (
                                <tr key={p.id} className="border-b hover:bg-muted/50">
                                  <td className="py-2 font-medium">{p.ticker}</td>
                                  <td className="text-right py-2">{p.quantity}</td>
                                  <td className="text-right py-2">
                                    {Number(p.avgPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma posição em FIIs</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Investimentos em ETFs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {positions.filter((p) => p.class === "etf").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Ticker</th>
                              <th className="text-right py-2 font-medium">Quantidade</th>
                              <th className="text-right py-2 font-medium">Preço Médio</th>
                              <th className="text-right py-2 font-medium">Preço de Mercado</th>
                              <th className="text-right py-2 font-medium">Valor de Mercado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions
                              .filter((p) => p.class === "etf")
                              .map((p) => (
                                <tr key={p.id} className="border-b hover:bg-muted/50">
                                  <td className="py-2 font-medium">{p.ticker}</td>
                                  <td className="text-right py-2">{p.quantity}</td>
                                  <td className="text-right py-2">
                                    {Number(p.avgPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma posição em ETFs</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Investimentos em Cripto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {positions.filter((p) => p.class === "crypto").length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Ticker</th>
                              <th className="text-right py-2 font-medium">Quantidade</th>
                              <th className="text-right py-2 font-medium">Preço Médio</th>
                              <th className="text-right py-2 font-medium">Preço de Mercado</th>
                              <th className="text-right py-2 font-medium">Valor de Mercado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions
                              .filter((p) => p.class === "crypto")
                              .map((p) => (
                                <tr key={p.id} className="border-b hover:bg-muted/50">
                                  <td className="py-2 font-medium">{p.ticker}</td>
                                  <td className="text-right py-2">{p.quantity}</td>
                                  <td className="text-right py-2">
                                    {Number(p.avgPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                  <td className="text-right py-2">
                                    {Number(p.marketValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma posição em cripto</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4">
                <Card>
                  <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            Posições
                          </CardTitle>
                          </CardHeader>
                          <CardContent>
                          {editingPos && (
                            <div className="mb-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Editar Posição</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-muted-foreground">Quantidade</label>
                                      <Input
                                        type="number"
                                        value={editingPos.quantity}
                                        onChange={(e) => setEditingPos(s => s ? { ...s, quantity: parseFloat(e.target.value) || 0 } : s)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">Preço Médio</label>
                                      <Input
                                        type="number"
                                        value={editingPos.avgPrice}
                                        onChange={(e) => setEditingPos(s => s ? { ...s, avgPrice: parseFloat(e.target.value) || 0 } : s)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 mt-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingPos(null)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={async () => {
                                        if (!user?.id || !editingPos) return
                                        const res = await fetch('/api/investments/positions', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            user_id: user.id,
                                            position_id: editingPos.id,
                                            quantity: editingPos.quantity,
                                            avg_price: editingPos.avgPrice
                                          })
                                        })
                                        const json = await res.json()
                                        if (!res.ok) {
                                          toast({ title: 'Erro ao atualizar posição', description: json.error || 'Tente novamente' })
                                          return
                                        }
                                        setEditingPos(null)
                                        setIsLoading(true)
                                        const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
                                        const accountParam = accountFilter !== "all" ? `&account_id=${accountFilter}` : ""
                                        Promise.all([
                                          fetch(`/api/investments/positions?user_id=${user.id}${classParam}${accountParam}`),
                                          fetch(`/api/investments/allocation?user_id=${user.id}${accountParam}`),
                                          fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}${accountParam}`)
                                        ]).then(async ([positionsRes, allocationRes, contributionsRes]) => {
                                          let totalFromPositions = 0
                                          if (positionsRes.ok) {
                                            const { positions } = await positionsRes.json()
                                            totalFromPositions = (positions || []).reduce((sum: number, p: any) => sum + (Number(p.marketValue) || 0), 0)
                                            setTotalValor(totalFromPositions)
                                            setPositions(positions || [])
                                          }
                                          if (allocationRes.ok) {
                                            const { distribution } = await allocationRes.json()
                                            const mapped = (distribution || []).map((d: any) => ({
                                              name: d.class === "stock" ? "Ações" :
                                                    d.class === "fii" ? "FIIs" :
                                                    d.class === "etf" ? "ETFs" :
                                                    d.class === "fixed_income" ? "Renda Fixa" :
                                                    d.class === "crypto" ? "Cripto" : String(d.class),
                                              value: Number(d.percentage) || 0
                                            }))
                                            setAllocationData(mapped)
                                          }
                                          if (contributionsRes.ok) {
                                            const { contributions } = await contributionsRes.json()
                                            const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
                                            const totals = (contributions || []).map((c: any) => Number(c.total) || 0)
                                            const series = (contributions || []).map((c: any, i: number) => {
                                              const [year, month] = String(c.month).split("-").map((x: string) => Number(x))
                                              const label = monthsLabels[(month - 1) % 12]
                                              const remainder = totals.slice(i + 1).reduce((acc: number, v: number) => acc + v, 0)
                                              const value = Math.max(0, totalFromPositions - remainder)
                                              return { label, value, aportes: totals[i] }
                                            })
                                            setPortfolioSeries(series)
                                            setTotalAportes(
                                              series.reduce(
                                                (acc: number, p: { label: string; value: number; aportes: number }) => acc + p.aportes,
                                                0
                                              )
                                            )
                                          }
                                        }).finally(() => setIsLoading(false))
                                        toast({ title: 'Posição atualizada', description: 'Alterações salvas com sucesso' })
                                      }}
                                    >
                                      Salvar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="text-left p-2">Ticker</th>
                                    <th className="text-left p-2 hidden sm:table-cell">Classe</th>
                                    <th className="text-right p-2">Qtde</th>
                                    <th className="text-right p-2 hidden sm:table-cell">Preço Médio</th>
                                    <th className="text-right p-2 hidden sm:table-cell">Preço Atual</th>
                                    <th className="text-right p-2">Valor</th>
                                    <th className="text-right p-2">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {positions.map((pos, idx) => (
                                    <tr key={`${pos.ticker}-${idx}`} className="border-t">
                                      <td className="p-2 font-medium">{pos.ticker}</td>
                                      <td className="p-2 capitalize hidden sm:table-cell">{pos.class}</td>
                                      <td className="p-2 text-right">{pos.quantity}</td>
                                      <td className="p-2 text-right hidden sm:table-cell">
                                        {pos.avgPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </td>
                                      <td className="p-2 text-right hidden sm:table-cell">
                                        {pos.marketPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </td>
                                      <td className="p-2 text-right">
                                        {pos.marketValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </td>
                                      <td className="p-2 text-right">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingPos({ id: pos.id, quantity: pos.quantity, avgPrice: pos.avgPrice })}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={async () => {
                                              if (!user?.id) return
                                              const ok = window.confirm(`Excluir posição ${pos.ticker}?`)
                                              if (!ok) return
                                              const res = await fetch('/api/investments/positions', {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ user_id: user.id, position_id: pos.id })
                                              })
                                              const json = await res.json()
                                              if (!res.ok) {
                                                toast({ title: 'Erro ao excluir posição', description: json.error || 'Tente novamente' })
                                                return
                                              }
                                              setIsLoading(true)
                                              const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
                                              const accountParam = accountFilter !== "all" ? `&account_id=${accountFilter}` : ""
                                              Promise.all([
                                                fetch(`/api/investments/positions?user_id=${user.id}${classParam}${accountParam}`),
                                                fetch(`/api/investments/allocation?user_id=${user.id}${accountParam}`),
                                                fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}${accountParam}`)
                                              ]).then(async ([positionsRes, allocationRes, contributionsRes]) => {
                                                let totalFromPositions = 0
                                                if (positionsRes.ok) {
                                                  const { positions } = await positionsRes.json()
                                                  totalFromPositions = (positions || []).reduce((sum: number, p: any) => sum + (Number(p.marketValue) || 0), 0)
                                                  setTotalValor(totalFromPositions)
                                                  setPositions(positions || [])
                                                }
                                                if (allocationRes.ok) {
                                                  const { distribution } = await allocationRes.json()
                                                  const mapped = (distribution || []).map((d: any) => ({
                                                    name: d.class === "stock" ? "Ações" :
                                                          d.class === "fii" ? "FIIs" :
                                                          d.class === "etf" ? "ETFs" :
                                                          d.class === "fixed_income" ? "Renda Fixa" :
                                                          d.class === "crypto" ? "Cripto" : String(d.class),
                                                    value: Number(d.percentage) || 0
                                                  }))
                                                  setAllocationData(mapped)
                                                }
                                                if (contributionsRes.ok) {
                                                  const { contributions } = await contributionsRes.json()
                                                  const monthsLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
                                                  const totals = (contributions || []).map((c: any) => Number(c.total) || 0)
                                                  const series = (contributions || []).map((c: any, i: number) => {
                                                    const [year, month] = String(c.month).split("-").map((x: string) => Number(x))
                                                    const label = monthsLabels[(month - 1) % 12]
                                                    const remainder = totals.slice(i + 1).reduce((acc: number, v: number) => acc + v, 0)
                                                    const value = Math.max(0, totalFromPositions - remainder)
                                                    return { label, value, aportes: totals[i] }
                                                  })
                                                  setPortfolioSeries(series)
                                                  setTotalAportes(
                                                    series.reduce(
                                                      (acc: number, p: { label: string; value: number; aportes: number }) => acc + p.aportes,
                                                      0
                                                    )
                                                  )
                                                }
                                              }).finally(() => setIsLoading(false))
                                              toast({ title: 'Posição excluída', description: 'Remoção realizada com sucesso' })
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {positions.length === 0 && (
                                    <tr>
                                      <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                                        Nenhuma posição encontrada para o filtro selecionado
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geral">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Alocação por Classe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {allocationData.map((a, i) => (
                        <div key={`${a.name}-${i}`} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded"
                              style={{ backgroundColor: COLORS[i % COLORS.length] }}
                            />
                            {a.name}
                          </div>
                          <span>{a.value.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Geral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <p className="text-sm text-muted-foreground">Valor consolidado da carteira</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Aportes (6 meses)</p>
                          <p className="font-medium">
                            {totalAportes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Saldo de ganhos</p>
                          <p className={cn("font-medium", (totalValor - totalAportes) >= 0 ? "text-green-600" : "text-red-600")}>
                            {(totalValor - totalAportes).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ROI</p>
                          <p className={cn("font-medium", totalAportes > 0 && (totalValor - totalAportes) >= 0 ? "text-green-600" : "text-red-600")}>
                            {totalAportes > 0 ? (((totalValor - totalAportes) / totalAportes) * 100).toFixed(1) : "0.0"}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Posições</p>
                          <p className="font-medium">{positions.length}</p>
                        </div>
                      </div>
                      {allocationData.length > 0 && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <p className="text-muted-foreground">Classe dominante</p>
                          <p className="font-medium">
                            {(() => {
                              const top = allocationData.reduce((a, b) => (b.value > a.value ? b : a))
                              return `${top.name} • ${top.value.toFixed(1)}%`
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo por Classe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded border">
                        <p className="text-xs text-muted-foreground">Ações</p>
                        <p className="text-sm font-semibold">
                          {Number(classTotals.stock).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <div className="p-3 rounded border">
                        <p className="text-xs text-muted-foreground">FIIs</p>
                        <p className="text-sm font-semibold">
                          {Number(classTotals.fii).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <div className="p-3 rounded border">
                        <p className="text-xs text-muted-foreground">ETFs</p>
                        <p className="text-sm font-semibold">
                          {Number(classTotals.etf).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <div className="p-3 rounded border">
                        <p className="text-xs text-muted-foreground">Renda Fixa</p>
                        <p className="text-sm font-semibold">
                          {Number(classTotals.fixed_income).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <div className="p-3 rounded border">
                        <p className="text-xs text-muted-foreground">Cripto</p>
                        <p className="text-sm font-semibold">
                          {Number(classTotals.crypto).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
