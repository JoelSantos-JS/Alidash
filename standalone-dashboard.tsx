"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Building,
  User,
  BarChart3,
  Wallet,
  CreditCard,
  Home,
  Car,
  ShoppingBag,
  Heart,
  Gamepad2,
  Building2
} from "lucide-react";

// ============================================================================
// DEPENDÊNCIAS NECESSÁRIAS PARA USAR EM OUTRO PROJETO:
// ============================================================================
/*
npm install lucide-react recharts

Também será necessário ter os seguintes componentes UI (ou criar versões simples):
- Card, CardContent, CardHeader, CardTitle
- Badge
- Progress
- Button

E uma função utilitária cn() para combinar classes CSS (ou usar clsx/classnames)

Exemplo de implementação simples dos componentes UI:

// Card Components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background"
  };
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Progress Component
const Progress = ({ value, className = "" }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div 
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// Button Component
const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3"
  };
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Utility function
const cn = (...classes) => classes.filter(Boolean).join(' ');
*/

// ============================================================================
// COMPONENTES UI BÁSICOS (inclua estes ou use sua biblioteca de componentes)
// ============================================================================

const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background"
  };
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Progress = ({ value, className = "" }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div 
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

const Button = ({ children, variant = "default", size = "default", className = "", onClick, ...props }) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3"
  };
  return (
    <button 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

// ============================================================================
// COMPONENTE DE MÉTRICAS
// ============================================================================

const MetricCards = ({ mode = 'business' }) => {
  const isPersonal = mode === 'personal';

  // Dados mockados
  const businessData = {
    revenue: { value: 45750.00, trend: 12.5, label: "Receitas no período" },
    expenses: { value: 28340.50, trend: -8.2, label: "Despesas no período" },
    balance: { value: 17409.50, trend: 38.0, label: "Saldo do período" },
    health: { value: 85, trend: 5.2, label: "Saúde Financeira" }
  };

  const personalData = {
    income: { value: 8500.00, trend: 0, label: "Renda do Mês" },
    expenses: { value: 6200.00, trend: -5.3, label: "Gastos do Mês" },
    savings: { value: 2300.00, trend: 15.2, label: "Economia do Mês" },
    rate: { value: 27.1, trend: 3.1, label: "Taxa de Poupança" }
  };

  const data = isPersonal ? personalData : businessData;
  const colorClasses = {
    green: {
      bg: "bg-green-50",
      border: "border-green-200", 
      icon: "text-green-600",
      value: "text-green-800",
      trend: "text-green-700"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600", 
      value: "text-blue-800",
      trend: "text-blue-700"
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      value: "text-purple-800", 
      trend: "text-purple-700"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      value: "text-orange-800",
      trend: "text-orange-700"
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      value: "text-red-800",
      trend: "text-red-700"
    }
  };

  if (isPersonal) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Renda */}
        <Card className={`${colorClasses.green.bg} ${colorClasses.green.border} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renda do Mês</CardTitle>
            <TrendingUp className={`h-4 w-4 ${colorClasses.green.icon}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClasses.green.value}`}>
              {data.income.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Salário + extras</p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card className={`${colorClasses.red.bg} ${colorClasses.red.border} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <TrendingDown className={`h-4 w-4 ${colorClasses.red.icon}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClasses.red.value}`}>
              {data.expenses.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center text-xs">
              <ArrowDown className={`h-3 w-3 mr-1 ${colorClasses.red.trend}`} />
              <span className={colorClasses.red.trend}>{Math.abs(data.expenses.trend)}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Economia */}
        <Card className={`${colorClasses.blue.bg} ${colorClasses.blue.border} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia do Mês</CardTitle>
            <PiggyBank className={`h-4 w-4 ${colorClasses.blue.icon}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClasses.blue.value}`}>
              {data.savings.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center text-xs">
              <ArrowUp className={`h-3 w-3 mr-1 ${colorClasses.blue.trend}`} />
              <span className={colorClasses.blue.trend}>+{data.savings.trend}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Poupança */}
        <Card className={`${colorClasses.purple.bg} ${colorClasses.purple.border} border-2`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <Target className={`h-4 w-4 ${colorClasses.purple.icon}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClasses.purple.value}`}>
              {data.rate.value}%
            </div>
            <div className="flex items-center text-xs">
              <ArrowUp className={`h-3 w-3 mr-1 ${colorClasses.purple.trend}`} />
              <span className={colorClasses.purple.trend}>+{data.rate.trend}% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modo Business
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Receitas */}
      <Card className={`${colorClasses.green.bg} ${colorClasses.green.border} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas no período</CardTitle>
          <TrendingUp className={`h-4 w-4 ${colorClasses.green.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClasses.green.value}`}>
            {data.revenue.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="flex items-center text-xs">
            <ArrowUp className={`h-3 w-3 mr-1 ${colorClasses.green.trend}`} />
            <span className={colorClasses.green.trend}>+{data.revenue.trend}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className={`${colorClasses.orange.bg} ${colorClasses.orange.border} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas no período</CardTitle>
          <TrendingDown className={`h-4 w-4 ${colorClasses.orange.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClasses.orange.value}`}>
            {data.expenses.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="flex items-center text-xs">
            <ArrowDown className={`h-3 w-3 mr-1 ${colorClasses.orange.trend}`} />
            <span className={colorClasses.orange.trend}>{Math.abs(data.expenses.trend)}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card className={`${colorClasses.blue.bg} ${colorClasses.blue.border} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo do período</CardTitle>
          <DollarSign className={`h-4 w-4 ${colorClasses.blue.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClasses.blue.value}`}>
            {data.balance.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="flex items-center text-xs">
            <ArrowUp className={`h-3 w-3 mr-1 ${colorClasses.blue.trend}`} />
            <span className={colorClasses.blue.trend}>+{data.balance.trend}% vs mês anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Saúde Financeira */}
      <Card className={`${colorClasses.purple.bg} ${colorClasses.purple.border} border-2`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde Financeira</CardTitle>
          <BarChart3 className={`h-4 w-4 ${colorClasses.purple.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClasses.purple.value}`}>
            {data.health.value}%
          </div>
          <div className="flex items-center text-xs">
            <span className={colorClasses.purple.trend}>Excelente</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE GRÁFICOS (versão simplificada sem Recharts)
// ============================================================================

const SimpleChart = ({ title, data, type = "bar" }) => (
  <Card className="bg-card border-border">
    <CardHeader>
      <CardTitle className="text-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-center space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="bg-primary rounded-t"
              style={{ 
                height: `${(item.value / Math.max(...data.map(d => d.value))) * 200}px`,
                width: '40px'
              }}
            />
            <span className="text-xs mt-2 text-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// COMPONENTE PRINCIPAL DO DASHBOARD
// ============================================================================

const StandaloneDashboard = ({ 
  mode = 'business',
  showModeToggle = true,
  className = ""
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const isPersonal = currentMode === 'personal';

  // Dados mockados para demonstração
  const mockData = {
    business: {
      chartData: [
        { name: 'Jan', value: 45750 },
        { name: 'Fev', value: 52300 },
        { name: 'Mar', value: 48900 },
        { name: 'Abr', value: 61200 }
      ]
    },
    personal: {
      chartData: [
        { name: 'Casa', value: 2800 },
        { name: 'Comida', value: 1200 },
        { name: 'Transporte', value: 800 },
        { name: 'Lazer', value: 600 }
      ]
    }
  };

  const data = isPersonal ? mockData.personal : mockData.business;

  return (
    <div className={`w-full space-y-6 p-6 bg-background ${className}`}>
      {/* Toggle de Modo (Opcional) */}
      {showModeToggle && (
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={currentMode === 'business' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentMode('business')}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Negócios
            </Button>
            <Button
              variant={currentMode === 'personal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentMode('personal')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Pessoal
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {currentMode === 'business' ? 'Dashboard Empresarial' : 'Dashboard Pessoal'}
          </h2>
          <p className="text-muted-foreground">
            {currentMode === 'business' 
              ? 'Visão geral do desempenho do seu negócio' 
              : 'Acompanhe suas finanças pessoais'
            }
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
          <TrendingUp className="w-4 h-4 mr-2" />
          {currentMode === 'business' ? 'Negócios' : 'Pessoal'}
        </Badge>
      </div>
      
      {/* Card de Resumo */}
      <Card className={cn(
        "border-200",
        isPersonal 
          ? "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
          : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                isPersonal ? "bg-purple-500" : "bg-blue-500"
              )}>
                {isPersonal ? (
                  <User className="h-6 w-6 text-white" />
                ) : (
                  <Building className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isPersonal 
                    ? 'Resumo Financeiro Pessoal: Janeiro/2025'
                    : 'Resumo Financeiro Empresarial: Janeiro/2025'
                  }
                </h2>
                <p className="text-sm text-muted-foreground">
                  Período: 01/01/2025 - 31/01/2025
                </p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-green-100 text-green-800"
            >
              {isPersonal ? 'Economia Positiva' : 'Saldo Positivo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <MetricCards mode={currentMode} />

      {/* Gráfico Simples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart 
          title={isPersonal ? "Gastos por Categoria" : "Receitas Mensais"}
          data={data.chartData}
        />
        
        {/* Card de Estatísticas Rápidas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-foreground font-medium">
                  {isPersonal ? 'Meta de Economia' : 'Crescimento Mensal'}
                </span>
              </div>
              <span className="text-primary font-bold">
                {isPersonal ? '85%' : '+12.5%'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-background" />
                </div>
                <span className="text-foreground font-medium">
                  {isPersonal ? 'Próxima Meta' : 'Próximo Objetivo'}
                </span>
              </div>
              <span className="text-muted-foreground font-bold">
                {isPersonal ? 'R$ 15.000' : 'R$ 75.000'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTAÇÃO PRINCIPAL
// ============================================================================

export default StandaloneDashboard;

// Também exportar componentes individuais se necessário
export { MetricCards, SimpleChart };

// ============================================================================
// EXEMPLO DE USO:
// ============================================================================
/*
import StandaloneDashboard from './standalone-dashboard';

// Uso básico
<StandaloneDashboard />

// Com modo específico
<StandaloneDashboard mode="personal" />

// Sem toggle de modo
<StandaloneDashboard mode="business" showModeToggle={false} />

// Com classes customizadas
<StandaloneDashboard className="max-w-6xl mx-auto" />
*/