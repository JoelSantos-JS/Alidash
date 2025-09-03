/**
 * Sistema de logging centralizado
 * Só mostra logs em desenvolvimento (NODE_ENV === 'development')
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  // Logs informativos (só em desenvolvimento)
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  },

  // Logs de sucesso (só em desenvolvimento)
  success: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`✅ ${message}`, data);
      } else {
        console.log(`✅ ${message}`);
      }
    }
  },

  // Logs de aviso (só em desenvolvimento)
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`⚠️ ${message}`, data);
      } else {
        console.log(`⚠️ ${message}`);
      }
    }
  },

  // Logs de erro (sempre mostrados)
  error: (message: string, data?: any) => {
    if (data) {
      console.error(`❌ ${message}`, data);
    } else {
      console.error(`❌ ${message}`);
    }
  },

  // Logs de debug (só em desenvolvimento)
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔍 ${message}`, data);
      } else {
        console.log(`🔍 ${message}`);
      }
    }
  },

  // Logs de sincronização (só em desenvolvimento)
  sync: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔄 ${message}`, data);
      } else {
        console.log(`🔄 ${message}`);
      }
    }
  },

  // Logs de conversão (só em desenvolvimento)
  convert: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔄 ${message}`, data);
      } else {
        console.log(`🔄 ${message}`);
      }
    }
  },

  // Logs de configuração (só em desenvolvimento)
  config: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔧 ${message}`, data);
      } else {
        console.log(`🔧 ${message}`);
      }
    }
  },

  // Logs de dados (só em desenvolvimento)
  data: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`📊 ${message}`, data);
      } else {
        console.log(`📊 ${message}`);
      }
    }
  },

  // Logs de produtos (só em desenvolvimento)
  product: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`📦 ${message}`, data);
      } else {
        console.log(`📦 ${message}`);
      }
    }
  },

  // Logs de transações (só em desenvolvimento)
  transaction: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`💳 ${message}`, data);
      } else {
        console.log(`💳 ${message}`);
      }
    }
  },

  // Logs de usuário (só em desenvolvimento)
  user: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`👤 ${message}`, data);
      } else {
        console.log(`👤 ${message}`);
      }
    }
  },

  // Logs de rollback (só em desenvolvimento)
  rollback: (message: string, data?: any) => {
    if (isDevelopment) {
      if (data) {
        console.log(`🔄 Rollback: ${message}`, data);
      } else {
        console.log(`🔄 Rollback: ${message}`);
      }
    }
  }
};

export default logger; 