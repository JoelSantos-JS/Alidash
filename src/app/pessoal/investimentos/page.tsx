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
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { TrendingUp, DollarSign, PieChart as PieIcon, Menu, ArrowLeft, CalendarDays } from "lucide-react"

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
    { ticker: string; name: string; class: string; quantity: number; avgPrice: number; marketPrice: number; marketValue: number }[]
  >([])

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

  const drawdownSeries = useMemo(
    () => [
      { label: "Jan", dd: 0 },
      { label: "Fev", dd: -2.5 },
      { label: "Mar", dd: -5.4 },
      { label: "Abr", dd: -1.2 },
      { label: "Mai", dd: -0.6 },
      { label: "Jun", dd: 0 }
    ],
    []
  )

  const contributionSchema = z.object({
    amount: z.number().min(0.01, "Valor deve ser maior que zero"),
    assetClass: z.enum(["stock", "fii", "etf", "fixed_income", "crypto"]),
    account: z.string().min(1, "Conta é obrigatória"),
    date: z.date(),
    notes: z.string().optional()
  })
  type ContributionFormData = z.infer<typeof contributionSchema>
  const contributionForm = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: 0,
      assetClass: "stock",
      account: "clear",
      date: new Date(),
      notes: ""
    }
  })
  const [amountInput, setAmountInput] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      setIsLoading(true)
      try {
        const classParam = classFilter !== "all" ? `&class=${classFilter}` : ""
        const [positionsRes, allocationRes, contributionsRes] = await Promise.all([
          fetch(`/api/investments/positions?user_id=${user.id}${classParam}`),
          fetch(`/api/investments/allocation?user_id=${user.id}`),
          fetch(`/api/investments/contributions?user_id=${user.id}&months=6${classParam}`)
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
          }
        }}
        onExport={() => {}}
        isLoading={isLoading}
        allocation={allocationData}
        className="flex"
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
                        toast({
                          title: "Aporte registrado",
                          description: "Em breve será integrado ao backend"
                        })
                        contributionForm.reset({
                          amount: 0,
                          assetClass: "stock",
                          account: "clear",
                          date: new Date(),
                          notes: ""
                        })
                        setAmountInput("")
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
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={contributionForm.control}
                          name="account"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Conta</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="clear">Clear</SelectItem>
                                  <SelectItem value="xp">XP</SelectItem>
                                  <SelectItem value="easynvest">Nubank</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle className="text-sm font-medium">Maior Drawdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {Math.min(...drawdownSeries.map(d => d.dd)).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Profundidade máxima</p>
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

              <div className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Drawdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={drawdownSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis domain={[-10, 0]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip />
                          <Area type="monotone" dataKey="dd" name="Drawdown" stroke="#EF4444" fill="#FEE2E2" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
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
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left p-2">Ticker</th>
                            <th className="text-left p-2">Classe</th>
                            <th className="text-right p-2">Qtde</th>
                            <th className="text-right p-2">Preço Médio</th>
                            <th className="text-right p-2">Preço Atual</th>
                            <th className="text-right p-2">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos, idx) => (
                            <tr key={`${pos.ticker}-${idx}`} className="border-t">
                              <td className="p-2 font-medium">{pos.ticker}</td>
                              <td className="p-2 capitalize">{pos.class}</td>
                              <td className="p-2 text-right">{pos.quantity}</td>
                              <td className="p-2 text-right">
                                {pos.avgPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </td>
                              <td className="p-2 text-right">
                                {pos.marketPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </td>
                              <td className="p-2 text-right">
                                {pos.marketValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
              <div className="grid gap-4 md:grid-cols-2">
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
                          <Tooltip />
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
                    <div className="text-2xl font-bold text-primary">
                      {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </div>
                    <p className="text-sm text-muted-foreground">Valor consolidado da carteira</p>
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
