"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  TrendingDown, 
  Home,
  Car,
  Utensils,
  Heart,
  Gamepad2,
  Shirt,
  Zap,
  Shield,
  Gift,
  Wallet
} from "lucide-react";

interface ExpenseData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  isEssential: boolean;
}

interface ExpensesChartProps {
  totalExpenses: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
  totalIncome?: number;
  expensesByCategory?: ExpenseData[];
}

const COLORS = {
  housing: '#ef4444',
  food: '#f97316', 
  transportation: '#eab308',
  healthcare: '#22c55e',
  entertainment: '#3b82f6',
  clothing: '#8b5cf6',
  utilities: '#06b6d4',
  insurance: '#84cc16',
  gifts: '#f59e0b',
  other: '#6b7280'
};

const CATEGORY_ICONS = {
  housing: Home,
  food: Utensils,
  transportation: Car,
  healthcare: Heart,
  entertainment: Gamepad2,
  clothing: Shirt,
  utilities: Zap,
  insurance: Shield,
  gifts: Gift,
  other: Wallet
};

const CATEGORY_NAMES = {
  housing: 'Moradia',
  food: 'Alimentação',
  transportation: 'Transporte',
  healthcare: 'Saúde',
  entertainment: 'Entretenimento',
  clothing: 'Vestuário',
  utilities: 'Utilidades',
  insurance: 'Seguros',
  gifts: 'Presentes',
  other: 'Outros'
};

export function ExpensesChart({ 
  totalExpenses, 
  essentialExpenses, 
  nonEssentialExpenses,
  totalIncome = 0,
  expensesByCategory = []
}: ExpensesChartProps) {
  const safePercent = (part: number, total: number) => {
    if (!isFinite(part) || !isFinite(total) || total <= 0 || part <= 0) return 0;
    const p = (part / total) * 100;
    return isFinite(p) && p >= 0 ? p : 0;
  };
  
  // Dados padrão se não houver dados de categoria
  const defaultCategoryData: ExpenseData[] = [
    {
      category: 'housing',
      amount: totalExpenses > 0 ? essentialExpenses * 0.4 : 0,
      percentage: safePercent(totalExpenses > 0 ? essentialExpenses * 0.4 : 0, totalExpenses),
      color: COLORS.housing,
      icon: 'housing',
      isEssential: true
    },
    {
      category: 'food',
      amount: totalExpenses > 0 ? essentialExpenses * 0.35 : 0,
      percentage: safePercent(totalExpenses > 0 ? essentialExpenses * 0.35 : 0, totalExpenses),
      color: COLORS.food,
      icon: 'food',
      isEssential: true
    },
    {
      category: 'transportation',
      amount: totalExpenses > 0 ? essentialExpenses * 0.25 : 0,
      percentage: safePercent(totalExpenses > 0 ? essentialExpenses * 0.25 : 0, totalExpenses),
      color: COLORS.transportation,
      icon: 'transportation',
      isEssential: true
    },
    {
      category: 'entertainment',
      amount: totalExpenses > 0 ? nonEssentialExpenses * 0.6 : 0,
      percentage: safePercent(totalExpenses > 0 ? nonEssentialExpenses * 0.6 : 0, totalExpenses),
      color: COLORS.entertainment,
      icon: 'entertainment',
      isEssential: false
    },
    {
      category: 'clothing',
      amount: totalExpenses > 0 ? nonEssentialExpenses * 0.4 : 0,
      percentage: safePercent(totalExpenses > 0 ? nonEssentialExpenses * 0.4 : 0, totalExpenses),
      color: COLORS.clothing,
      icon: 'clothing',
      isEssential: false
    }
  ];

  const categoryData = expensesByCategory.length > 0 ? expensesByCategory : defaultCategoryData;
  const hasCategoryValues = totalExpenses > 0 && categoryData.some((c) => c.amount > 0);

  // Dados para o gráfico de pizza
  const pieData = categoryData.map(item => ({
    name: CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category,
    value: item.amount,
    percentage: safePercent(item.amount, totalExpenses),
    color: item.color,
    isEssential: item.isEssential
  }));

  // Dados para comparação essencial vs opcional
  const comparisonData = [
    {
      name: 'Essenciais',
      value: essentialExpenses,
      color: '#ef4444'
    },
    {
      name: 'Opcionais',
      value: nonEssentialExpenses,
      color: '#3b82f6'
    }
  ];

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Wallet;
    return <IconComponent className="h-4 w-4" />;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-sm text-muted-foreground">
            {safePercent(Number(data.value) || 0, totalExpenses).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Análise de Saídas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição detalhada das suas saídas mensais
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-lg font-bold text-red-600">
              {essentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Saídas Essenciais</div>
            <div className="text-xs font-medium text-red-600">
              {safePercent(essentialExpenses, totalExpenses).toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-600">
              {nonEssentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Saídas Opcionais</div>
            <div className="text-xs font-medium text-blue-600">
              {safePercent(nonEssentialExpenses, totalExpenses).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Gráfico de Pizza - Distribuição por Categoria */}
        <div className="h-64">
          <h4 className="text-sm font-medium mb-3">Distribuição por Categoria</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Categorias */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detalhamento por Categoria</h4>
          {hasCategoryValues ? (
            <div className="space-y-2">
              {categoryData
                .sort((a, b) => b.amount - a.amount)
                .map((item, index) => {
                  const IconComponent = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || Wallet;
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {safePercent(item.amount, totalExpenses).toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <Badge variant={item.isEssential ? 'destructive' : 'secondary'} className="text-xs">
                          {item.isEssential ? 'Essencial' : 'Opcional'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
              Nenhum gasto registrado no período.
            </div>
          )}
        </div>

        {/* Gráfico de Barras - Comparação */}
        <div className="h-32">
          <h4 className="text-sm font-medium mb-3">Comparação: Essenciais vs Opcionais</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="value"
                domain={[0, 'dataMax']}
                tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
              />
              <YAxis dataKey="name" type="category" width={90} />
              <Tooltip
                formatter={(value: any) => [
                  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Valor'
                ]}
              />
              <Bar dataKey="value">
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Relação Renda vs Gastos */}
        {totalIncome > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Relação Renda vs Gastos</h4>
            
            {/* Indicadores Visuais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="min-w-0 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-base sm:text-lg font-bold leading-tight text-green-600">
                  {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-green-600">Renda Total</div>
              </div>
              
              <div className="min-w-0 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-base sm:text-lg font-bold leading-tight text-red-600">
                  {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-red-600">Gastos Total</div>
              </div>
              
              <div className={`min-w-0 p-3 rounded-lg border ${
                (totalIncome - totalExpenses) >= 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`text-base sm:text-lg font-bold leading-tight ${
                  (totalIncome - totalExpenses) >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {(totalIncome - totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className={`text-xs ${
                  (totalIncome - totalExpenses) >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {(totalIncome - totalExpenses) >= 0 ? 'Sobrou' : 'Déficit'}
                </div>
              </div>
            </div>

            {/* Barra de Progresso dos Gastos */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gastos em relação à renda</span>
                <span className="font-medium">
                  {((totalExpenses / totalIncome) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    (totalExpenses / totalIncome) > 0.8 
                      ? 'bg-red-500' 
                      : (totalExpenses / totalIncome) > 0.6 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Dicas baseadas na porcentagem */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const percentage = (totalExpenses / totalIncome) * 100;
                  if (percentage > 90) {
                    return "⚠️ Atenção: Você está gastando mais de 90% da sua renda. Considere revisar seus gastos.";
                  } else if (percentage > 80) {
                    return "⚡ Cuidado: Gastos altos (>80%). Tente economizar mais para emergências.";
                  } else if (percentage > 60) {
                    return "👍 Bom controle: Gastos moderados. Considere aumentar suas economias.";
                  } else {
                    return "🎉 Excelente! Você está economizando bem. Continue assim!";
                  }
                })()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
