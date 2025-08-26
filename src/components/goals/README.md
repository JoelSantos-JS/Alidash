# Sistema de Metas - Alidash

Um sistema completo de gerenciamento de metas pessoais e profissionais integrado ao Alidash.

## 🎯 Visão Geral

O sistema de metas permite aos usuários:
- Criar e gerenciar metas de diferentes categorias (financeiro, negócios, pessoal, saúde, educação)
- Acompanhar progresso em tempo real
- Definir marcos (milestones) para dividir metas grandes
- Configurar lembretes e notificações
- Visualizar analytics e insights
- Integrar com outras funcionalidades do sistema

## 📁 Estrutura de Componentes

### Componentes Principais

#### `GoalsSidebar`
- **Localização**: `src/components/goals/goals-sidebar.tsx`
- **Função**: Sidebar com filtros, métricas e insights das metas
- **Features**:
  - Filtros por categoria, status, prioridade e período
  - Métricas em tempo real (progresso médio, taxa de conclusão, momentum)
  - Insights inteligentes e dicas de produtividade
  - Visão geral por categorias
  - Alertas para metas urgentes

#### `GoalCard`
- **Localização**: `src/components/goals/goal-card.tsx`
- **Função**: Card individual para exibir uma meta
- **Features**:
  - Progresso visual com barra de progresso
  - Badges de status e prioridade
  - Ações rápidas (editar, pausar, concluir)
  - Preview de marcos
  - Indicadores de prazo e urgência
  - Botões de incremento rápido de progresso

#### `GoalForm`
- **Localização**: `src/components/goals/goal-form.tsx`
- **Função**: Formulário para criar/editar metas
- **Features**:
  - Validação completa com Zod
  - Sugestões inteligentes baseadas na categoria
  - Seleção de unidades (BRL, USD, %, quantidade, dias)
  - Configuração de prioridade e prazo
  - Tags para organização
  - Campo de observações

#### `GoalsOverview`
- **Localização**: `src/components/goals/goals-overview.tsx`
- **Função**: Dashboard com visão geral e analytics
- **Features**:
  - Métricas principais (total, conclusão, progresso médio, momentum)
  - Gráficos de distribuição por categoria
  - Gráfico de distribuição de progresso
  - Lista de próximos prazos
  - Ranking de melhores performances
  - Alertas e recomendações

#### `GoalMilestones`
- **Localização**: `src/components/goals/goal-milestones.tsx`
- **Função**: Gerenciamento de marcos de uma meta
- **Features**:
  - Criação e edição de marcos
  - Progresso visual dos marcos
  - Destaque do próximo marco
  - Sistema de recompensas
  - Marcação de conclusão
  - Alertas de atraso

#### `GoalsWidget`
- **Localização**: `src/components/dashboard/goals-widget.tsx`
- **Função**: Widget para dashboard principal
- **Features**:
  - Resumo das métricas principais
  - Alertas de metas urgentes
  - Top 3 melhores performances
  - Indicador de momentum
  - Links rápidos para gerenciamento

## 🗂️ Tipos de Dados

### `Goal`
```typescript
interface Goal {
  id: string
  name: string
  description?: string
  category: 'financial' | 'business' | 'personal' | 'health' | 'education' | 'other'
  type: 'savings' | 'revenue' | 'profit' | 'roi' | 'quantity' | 'percentage' | 'custom'
  targetValue: number
  currentValue: number
  unit: 'BRL' | 'USD' | 'percentage' | 'quantity' | 'days' | 'custom'
  deadline: Date
  createdDate: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'overdue'
  milestones?: GoalMilestone[]
  reminders?: GoalReminder[]
  notes?: string
  tags?: string[]
  linkedEntities?: {
    products?: string[]
    dreams?: string[]
    transactions?: string[]
  }
}
```

### `GoalMilestone`
```typescript
interface GoalMilestone {
  id: string
  goalId: string
  name: string
  targetValue: number
  targetDate: Date
  isCompleted: boolean
  completedDate?: Date
  reward?: string
  notes?: string
}
```

### `GoalReminder`
```typescript
interface GoalReminder {
  id: string
  goalId: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  frequency: number
  message: string
  isActive: boolean
  lastSent?: Date
  nextSend: Date
}
```

## 🎨 Design System

### Cores por Categoria
- **Financeiro**: Verde (`#10b981`)
- **Negócios**: Azul (`#3b82f6`)
- **Pessoal**: Rosa (`#ec4899`)
- **Saúde**: Vermelho (`#ef4444`)
- **Educação**: Roxo (`#8b5cf6`)
- **Outros**: Amarelo (`#f59e0b`)

### Cores por Prioridade
- **Crítica**: Vermelho (`#ef4444`)
- **Alta**: Laranja (`#f97316`)
- **Média**: Amarelo (`#eab308`)
- **Baixa**: Verde (`#10b981`)

### Ícones
- **Categorias**: DollarSign, Briefcase, Heart, Activity, BookOpen, Star
- **Status**: Rocket, Pause, CheckCircle2, Trash2, AlertTriangle
- **Ações**: Target, Plus, Edit, Calendar, Flag, Trophy

## 🚀 Como Usar

### 1. Página Principal de Metas
```tsx
import { GoalsSidebar, GoalCard, GoalForm, GoalsOverview } from '@/components/goals'

// Implementação completa em src/app/metas/page.tsx
```

### 2. Widget no Dashboard
```tsx
import { GoalsWidget } from '@/components/dashboard/goals-widget'

function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GoalsWidget goals={goals} className="lg:col-span-1" />
      {/* outros widgets */}
    </div>
  )
}
```

### 3. Gerenciamento de Marcos
```tsx
import { GoalMilestones } from '@/components/goals'

function GoalDetailPage({ goal }: { goal: Goal }) {
  return (
    <div className="space-y-6">
      <GoalCard goal={goal} />
      <GoalMilestones 
        goal={goal} 
        onUpdateMilestones={(milestones) => {
          // Atualizar marcos da meta
        }}
      />
    </div>
  )
}
```

## 🔧 Funcionalidades Avançadas

### Sugestões Inteligentes
O sistema oferece sugestões baseadas na combinação categoria + tipo:
- **Financeiro + Economia**: "Reserva de emergência", "Viagem dos sonhos"
- **Negócios + Receita**: "Faturamento mensal", "Vendas do produto"
- **Pessoal + Quantidade**: "Livros lidos", "Exercícios por semana"

### Analytics e Insights
- **Progresso Médio**: Média de progresso de todas as metas
- **Taxa de Conclusão**: Percentual de metas concluídas
- **Momentum**: Metas concluídas nos últimos 30 dias
- **Categoria Top**: Categoria com melhor performance
- **Metas Urgentes**: Metas com prazo próximo ou críticas

### Integração com Outras Funcionalidades
- **Produtos**: Vincular metas de ROI/lucro a produtos específicos
- **Sonhos**: Conectar metas financeiras aos sonhos
- **Transações**: Associar receitas/despesas ao progresso das metas

## 📱 Responsividade

Todos os componentes são totalmente responsivos:
- **Mobile**: Layout em coluna única, sidebar colapsável
- **Tablet**: Grid 2 colunas, sidebar lateral
- **Desktop**: Grid 3+ colunas, sidebar fixa

## 🎯 Próximas Funcionalidades

1. **Notificações Push**: Lembretes automáticos
2. **Gamificação**: Sistema de pontos e conquistas
3. **Compartilhamento**: Compartilhar progresso com amigos
4. **Templates**: Modelos pré-definidos de metas
5. **Relatórios**: Relatórios detalhados de performance
6. **Integração IA**: Sugestões inteligentes de metas
7. **Backup/Sync**: Sincronização entre dispositivos

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes base
- **React Hook Form** + **Zod** para formulários
- **Recharts** para gráficos
- **Lucide React** para ícones
- **date-fns** para manipulação de datas

## 📄 Licença

Este sistema faz parte do projeto Alidash e segue a mesma licença do projeto principal.