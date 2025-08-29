// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

console.log('🔧 Teste simples de inicialização...');

try {
  console.log('📝 Tentando importar supabase-service...');
  const { supabaseAdminService } = require('./src/lib/supabase-service.ts');
  console.log('✅ supabaseAdminService importado com sucesso');
  
  console.log('📝 Verificando se supabaseAdminService é uma instância válida...');
  console.log('- Tipo:', typeof supabaseAdminService);
  console.log('- Tem método createTransaction:', typeof supabaseAdminService.createTransaction === 'function');
  
} catch (error) {
  console.error('❌ Erro ao importar supabase-service:', error);
  console.error('❌ Stack trace:', error.stack);
} 