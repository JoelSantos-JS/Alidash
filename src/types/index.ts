

export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  aliexpressLink: string;
  imageUrl: string;
  description: string;
  notes?: string;
  trackingCode?: string; // Código de rastreio
  purchaseEmail?: string; // Email usado na compra
  
  // Custos
  purchasePrice: number;
  shippingCost: number;
  importTaxes: number;
  packagingCost: number;
  marketingCost: number;
  otherCosts: number;
  totalCost: number;
  
  // Vendas
  sellingPrice: number;
  expectedProfit: number;
  profitMargin: number;
  sales: Sale[];
  
  // Controle
  quantity: number;
  quantitySold: number;
  status: 'purchased' | 'shipping' | 'received' | 'selling' | 'sold';
  purchaseDate: Date;
  
  // Métricas
  roi: number;
  actualProfit: number;
  daysToSell?: number; // métrica de tempo para vender
}

export interface Sale {
    id: string;
    date: Date;
    quantity: number;
    buyerName?: string;
    productId?: string;
}


export interface Dream {
  id: string;
  name: string;
  type: 'travel' | 'business' | 'personal';
  targetAmount: number;
  currentAmount: number;
  status: 'planning' | 'in_progress' | 'completed';
  notes?: string;
  plan?: DreamPlan | null;
}

export interface DreamPlan {
  description: string;
  estimatedCost: {
    item: string;
    cost: number;
  }[];
  totalEstimatedCost: number;
  actionPlan: {
    step: number;
    action: string;
    details: string;
  }[];
  importantNotes: string[];
  imageUrl: string;
}

export interface SubBet {
    id: string;
    bookmaker: string; // Casa de apostas
    betType: string;
    odds: number;
    stake: number;
    isFreebet?: boolean;
}

export interface Bet {
  id: string;
  type: 'single' | 'surebet';
  sport: string;
  event: string;
  date: Date;
  status: 'pending' | 'won' | 'lost' | 'cashed_out' | 'void';
  notes?: string;
  earnedFreebetValue?: number | null; // Valor da freebet ganha com esta aposta

  // For 'single' bets
  betType?: string | null;
  stake?: number | null;
  odds?: number | null;
  
  // For 'surebet'
  subBets?: SubBet[] | null;
  totalStake?: number | null;
  guaranteedProfit?: number | null;
  profitPercentage?: number | null;

  analysis?: BetAnalysis;
}

export interface BetAnalysis {
    recommendation: 'good' | 'average' | 'bad' | 'neutral';
    justification: string;
    suggestedActions: string[];
}

// Novos tipos para receitas, despesas e transações independentes
export interface Revenue {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  source: 'sale' | 'commission' | 'bonus' | 'other';
  notes?: string;
  productId?: string; // Se relacionado a um produto
}

export interface Expense {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'purchase' | 'shipping' | 'tax' | 'marketing' | 'operational' | 'other';
  supplier?: string;
  notes?: string;
  productId?: string; // Se relacionado a um produto
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  tags?: string[];
}

export interface Debt {
  id: string;
  creditorName: string; // Nome do credor
  description: string; // Descrição da dívida
  originalAmount: number; // Valor original da dívida
  currentAmount: number; // Valor atual (pode ter juros, multas, etc.)
  interestRate?: number; // Taxa de juros (% ao mês)
  dueDate: Date; // Data de vencimento
  createdDate: Date; // Data de criação da dívida
  category: 'credit_card' | 'loan' | 'financing' | 'supplier' | 'personal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'overdue' | 'paid' | 'negotiating' | 'cancelled';
  paymentMethod?: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  installments?: {
    total: number;
    paid: number;
    amount: number; // Valor de cada parcela
  };
  payments?: DebtPayment[]; // Histórico de pagamentos
  notes?: string;
  tags?: string[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: Date;
  amount: number;
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  notes?: string;
}
