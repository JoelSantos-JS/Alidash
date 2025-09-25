#!/usr/bin/env node

/**
 * Script de Verificação Pré-Deploy
 * Detecta problemas comuns antes do deploy para evitar erros em produção
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Iniciando verificação pré-deploy...\n');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let hasErrors = false;
let hasWarnings = false;

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
  hasErrors = true;
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  hasWarnings = true;
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// 1. Verificar variáveis de ambiente essenciais
function checkEnvironmentVariables() {
  logInfo('Verificando variáveis de ambiente...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];

  const envFile = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envFile)) {
    logError('Arquivo .env.local não encontrado');
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=placeholder`)) {
      logSuccess(`${varName} configurada`);
    } else {
      logError(`${varName} não configurada ou usando placeholder`);
    }
  });
}

// 2. Verificar build do Next.js
function checkBuild() {
  logInfo('Verificando build do Next.js...');
  
  try {
    // Limpar cache antes do build
    if (fs.existsSync('.next')) {
      // Cross-platform solution for removing directory
      const isWindows = process.platform === 'win32';
      const rmCommand = isWindows ? 'rmdir /s /q .next' : 'rm -rf .next';
      execSync(rmCommand, { stdio: 'pipe' });
      logSuccess('Cache .next limpo');
    }

    // Executar build
    execSync('npm run build', { stdio: 'pipe' });
    logSuccess('Build executado com sucesso');

    // Verificar se os arquivos foram gerados
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        logSuccess('Arquivos estáticos gerados');
      } else {
        logError('Diretório de arquivos estáticos não encontrado');
      }
    } else {
      logError('Diretório .next não encontrado após build');
    }

  } catch (error) {
    logError(`Falha no build: ${error.message}`);
  }
}

// 3. Verificar configuração do Firebase
function checkFirebaseConfig() {
  logInfo('Verificando configuração do Firebase...');
  
  const firebaseConfigFile = path.join(process.cwd(), 'src', 'lib', 'firebase.ts');
  
  if (fs.existsSync(firebaseConfigFile)) {
    const content = fs.readFileSync(firebaseConfigFile, 'utf8');
    
    if (content.includes('placeholder') || content.includes('your-')) {
      logError('Configuração do Firebase contém placeholders');
    } else {
      logSuccess('Configuração do Firebase parece válida');
    }
  } else {
    logWarning('Arquivo de configuração do Firebase não encontrado');
  }
}

// 4. Verificar dependências
function checkDependencies() {
  logInfo('Verificando dependências...');
  
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
    logSuccess('Nenhuma vulnerabilidade crítica encontrada');
  } catch (error) {
    logWarning('Vulnerabilidades encontradas nas dependências');
  }

  // Verificar se node_modules existe
  if (fs.existsSync('node_modules')) {
    logSuccess('node_modules presente');
  } else {
    logError('node_modules não encontrado - execute npm install');
  }
}

// 5. Verificar configuração do Vercel
function checkVercelConfig() {
  logInfo('Verificando configuração do Vercel...');
  
  const vercelConfigFile = path.join(process.cwd(), 'vercel.json');
  
  if (fs.existsSync(vercelConfigFile)) {
    logSuccess('Arquivo vercel.json encontrado');
  } else {
    logWarning('Arquivo vercel.json não encontrado (opcional)');
  }

  // Verificar se há configurações de domínio
  logInfo('Lembre-se de configurar os domínios autorizados:');
  console.log('  - Firebase Console: Adicionar domínio de produção');
  console.log('  - Supabase Dashboard: Configurar URL do site');
}

// 6. Verificar tamanho do bundle
function checkBundleSize() {
  logInfo('Verificando tamanho do bundle...');
  
  try {
    const buildManifest = path.join(process.cwd(), '.next', 'build-manifest.json');
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      const pages = Object.keys(manifest.pages);
      
      if (pages.length > 0) {
        logSuccess(`${pages.length} páginas encontradas no build`);
      } else {
        logWarning('Nenhuma página encontrada no build manifest');
      }
    }
  } catch (error) {
    logWarning('Não foi possível verificar o build manifest');
  }
}

// Executar todas as verificações
async function runAllChecks() {
  console.log('🚀 Verificação Pré-Deploy - Alidash\n');
  
  checkEnvironmentVariables();
  console.log('');
  
  checkDependencies();
  console.log('');
  
  checkFirebaseConfig();
  console.log('');
  
  checkBuild();
  console.log('');
  
  checkBundleSize();
  console.log('');
  
  checkVercelConfig();
  console.log('');

  // Resumo final
  console.log('📋 RESUMO DA VERIFICAÇÃO:');
  console.log('========================');
  
  if (hasErrors) {
    logError('Erros encontrados - NÃO FAÇA DEPLOY');
    console.log('\n🔧 Corrija os erros acima antes de fazer deploy');
    process.exit(1);
  } else if (hasWarnings) {
    logWarning('Avisos encontrados - Deploy com cuidado');
    console.log('\n⚠️  Considere corrigir os avisos antes do deploy');
  } else {
    logSuccess('Tudo OK - Pronto para deploy!');
    console.log('\n🎉 Sua aplicação está pronta para produção');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllChecks().catch(console.error);
}

module.exports = { runAllChecks };