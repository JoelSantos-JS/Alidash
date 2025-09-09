/**
 * Configuração de Features do Sistema
 * 
 * Este arquivo centraliza as configurações de features para facilitar
 * futuras expansões e manutenção do projeto.
 */

export interface FeatureConfig {
  enabled: boolean;
  inDevelopment?: boolean;
  description?: string;
}

export interface SystemFeatures {
  // Dashboard Types
  personalDashboard: FeatureConfig;
  businessDashboard: FeatureConfig;
  
  // Account Management
  accountTypeSwitching: FeatureConfig;
  multiUserSupport: FeatureConfig;
  
  // Financial Features
  budgetTracking: FeatureConfig;
  expenseCategories: FeatureConfig;
  revenueTracking: FeatureConfig;
  
  // Product Management
  productCatalog: FeatureConfig;
  inventoryManagement: FeatureConfig;
  salesTracking: FeatureConfig;
  
  // Advanced Features
  aiInsights: FeatureConfig;
  reportGeneration: FeatureConfig;
  dataExport: FeatureConfig;
  
  // Integrations
  supabaseSync: FeatureConfig;
  firebaseBackup: FeatureConfig;
  n8nIntegration: FeatureConfig;
}

/**
 * Configuração atual das features do sistema
 * 
 * Para habilitar uma feature:
 * 1. Mude 'enabled' para true
 * 2. Implemente a funcionalidade
 * 3. Teste adequadamente
 * 4. Remova 'inDevelopment' quando estiver pronta
 */
export const FEATURES: SystemFeatures = {
  // Dashboard Types
  personalDashboard: {
    enabled: true,
    description: "Dashboard para finanças pessoais - Funcional e integrado"
  },
  businessDashboard: {
    enabled: true,
    description: "Dashboard empresarial completo e funcional"
  },
  
  // Account Management
  accountTypeSwitching: {
    enabled: true,
    description: "Toggle entre modos pessoal e empresarial - Interface pronta"
  },
  multiUserSupport: {
    enabled: false,
    inDevelopment: true,
    description: "Suporte para múltiplos usuários por conta"
  },
  
  // Financial Features
  budgetTracking: {
    enabled: true,
    description: "Controle de orçamento mensal"
  },
  expenseCategories: {
    enabled: true,
    description: "Categorização de despesas"
  },
  revenueTracking: {
    enabled: true,
    description: "Acompanhamento de receitas"
  },
  
  // Product Management
  productCatalog: {
    enabled: true,
    description: "Catálogo completo de produtos"
  },
  inventoryManagement: {
    enabled: true,
    description: "Gestão de estoque e produtos"
  },
  salesTracking: {
    enabled: true,
    description: "Acompanhamento de vendas"
  },
  
  // Advanced Features
  aiInsights: {
    enabled: false,
    inDevelopment: true,
    description: "Insights inteligentes com IA"
  },
  reportGeneration: {
    enabled: true,
    description: "Geração de relatórios financeiros"
  },
  dataExport: {
    enabled: false,
    inDevelopment: true,
    description: "Exportação de dados em múltiplos formatos"
  },
  
  // Integrations
  supabaseSync: {
    enabled: true,
    description: "Sincronização com Supabase"
  },
  firebaseBackup: {
    enabled: true,
    description: "Backup no Firebase"
  },
  n8nIntegration: {
    enabled: true,
    description: "Integração com N8N para automações"
  }
};

/**
 * Utilitários para verificação de features
 */
export const isFeatureEnabled = (feature: keyof SystemFeatures): boolean => {
  return FEATURES[feature].enabled;
};

export const isFeatureInDevelopment = (feature: keyof SystemFeatures): boolean => {
  return FEATURES[feature].inDevelopment || false;
};

export const getFeatureDescription = (feature: keyof SystemFeatures): string => {
  return FEATURES[feature].description || 'Sem descrição disponível';
};

/**
 * Configurações específicas por tipo de conta
 */
export const getAccountTypeFeatures = (accountType: 'personal' | 'business') => {
  if (accountType === 'personal') {
    return {
      dashboard: FEATURES.personalDashboard,
      budgetTracking: FEATURES.budgetTracking,
      expenseCategories: FEATURES.expenseCategories,
      // Produtos não disponíveis no modo pessoal
      productCatalog: { ...FEATURES.productCatalog, enabled: false },
      inventoryManagement: { ...FEATURES.inventoryManagement, enabled: false },
      salesTracking: { ...FEATURES.salesTracking, enabled: false }
    };
  }
  
  // Business account - todas as features disponíveis
  return FEATURES;
};