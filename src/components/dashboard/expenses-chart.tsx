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
  expensesByCategory = []
}: ExpensesChartProps) {
  
  // Dados padrão se não houver dados de categoria
  const defaultCategoryData: ExpenseData[] = [
    {
      category: 'housing',
      amount: essentialExpenses * 0.4,
      percentage: (essentialExpenses * 0.4 / totalExpenses) * 100,
      color: COLORS.housing,
      icon: 'housing',
      isEssential: true
    },
    {
      category: 'food',
      amount: essentialExpenses * 0.35,
      percentage: (essentialExpenses * 0.35 / totalExpenses) * 100,
      color: COLORS.food,
      icon: 'food',
      isEssential: true
    },
    {
      category: 'transportation',
      amount: essentialExpenses * 0.25,
      percentage: (essentialExpenses * 0.25 / totalExpenses) * 100,
      color: COLORS.transportation,
      icon: 'transportation',
      isEssential: true
    },
    {
      category: 'entertainment',
      amount: nonEssentialExpenses * 0.6,
      percentage: (nonEssentialExpenses * 0.6 / totalExpenses) * 100,
      color: COLORS.entertainment,
      icon: 'entertainment',
      isEssential: false
    },
    {
      category: 'clothing',
      amount: nonEssentialExpenses * 0.4,
      percentage: (nonEssentialExpenses * 0.4 / totalExpenses) * 100,
      color: COLORS.clothing,
      icon: 'clothing',
      isEssential: false
    }
  ];

  const categoryData = expensesByCategory.length > 0 ? expensesByCategory : defaultCategoryData;

  // Dados para o gráfico de pizza
  const pieData = categoryData.map(item => ({
    name: CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category,
    value: item.amount,
    percentage: item.percentage,
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
            {data.payload.percentage?.toFixed(1)}% do total
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
          Análise de Gastos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição detalhada dos seus gastos mensais
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-lg font-bold text-red-600">
              {essentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Gastos Essenciais</div>
            <div className="text-xs font-medium text-red-600">
              {((essentialExpenses / totalExpenses) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-600">
              {nonEssentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Gastos Opcionais</div>
            <div className="text-xs font-medium text-blue-600">
              {((nonEssentialExpenses / totalExpenses) * 100).toFixed(1)}%
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
                          {item.percentage.toFixed(1)}% do total
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
        </div>

        {/* Gráfico de Barras - Comparação */}
        <div className="h-32">
          <h4 className="text-sm font-medium mb-3">Comparação: Essenciais vs Opcionais</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value: any) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Valor'
                ]}
              />
              <Bar dataKey="value" fill={(entry: any) => entry.color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}