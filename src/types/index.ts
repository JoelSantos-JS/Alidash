export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  aliexpressLink: string;
  imageUrl: string;
  description: string;
  notes?: string;
  
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
}

export interface Sale {
    id: string;
    date: Date;
    quantity: number;
    buyerName?: string;
}


export interface Dream {
  id: string;
  name: string;
  type: 'travel' | 'business' | 'personal';
  targetAmount: number;
  currentAmount: number;
  status: 'planning' | 'in_progress' | 'completed';
  notes?: string;
  plan?: DreamPlan;
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
