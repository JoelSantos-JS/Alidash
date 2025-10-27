#!/usr/bin/env node

/**
 * Script de verificação de saúde do sistema
 * Verifica se todas as APIs essenciais estão funcionando
 */

const fs = require('fs');
const path = require('path');

// Lista de APIs essenciais que devem existir
const ESSENTIAL_APIS = [
  'src/app/api/auth/sync-user/route.ts',
  'src/app/api/auth/get-user/route.ts',
  'src/app/api/user/profile/route.ts',
  'src/app/api/user/get/route.ts',
  'src/app/api/setup/database/route.ts'
];

// Lista de diretórios que devem existir
const ESSENTIAL_DIRS = [
  'src/app/api',
  'src/app/api/auth',
  'src/components',
  'src/lib',
  'src/utils'
];

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function checkDirectoryExists(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function checkNextConfig() {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  if (!fs.existsSync(configPath)) {
    return { exists: false, error: 'next.config.ts não encontrado' };
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    // Verificar se tem configurações básicas
    if (!content.includes('NextConfig')) {
      return { exists: true, error: 'Configuração do Next.js pode estar incompleta' };
    }
    return { exists: true, error: null };
  } catch (error) {
    return { exists: true, error: `Erro ao ler configuração: ${error.message}` };
  }
}

function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    return { exists: false, error: 'package.json não encontrado' };
  }
  
  try {
    const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['next', 'react', 'react-dom'];
    const missing = requiredDeps.filter(dep => !content.dependencies?.[dep]);
    
    if (missing.length > 0) {
      return { exists: true, error: `Dependências faltando: ${missing.join(', ')}` };
    }
    
    return { exists: true, error: null };
  } catch (error) {
    return { exists: true, error: `Erro ao ler package.json: ${error.message}` };
  }
}

function runHealthCheck() {
  console.log('🔍 Executando verificação de saúde do sistema...\n');
  
  let hasErrors = false;
  
  // Verificar APIs essenciais
  console.log('📡 Verificando APIs essenciais:');
  ESSENTIAL_APIS.forEach(api => {
    const exists = checkFileExists(api);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${api}`);
    if (!exists) hasErrors = true;
  });
  
  // Verificar diretórios essenciais
  console.log('\n📁 Verificando diretórios essenciais:');
  ESSENTIAL_DIRS.forEach(dir => {
    const exists = checkDirectoryExists(dir);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${dir}`);
    if (!exists) hasErrors = true;
  });
  
  // Verificar configuração do Next.js
  console.log('\n⚙️ Verificando configuração do Next.js:');
  const nextConfig = checkNextConfig();
  const nextStatus = nextConfig.exists && !nextConfig.error ? '✅' : '❌';
  console.log(`  ${nextStatus} next.config.ts`);
  if (nextConfig.error) {
    console.log(`    ⚠️ ${nextConfig.error}`);
    hasErrors = true;
  }
  
  // Verificar package.json
  console.log('\n📦 Verificando package.json:');
  const packageCheck = checkPackageJson();
  const packageStatus = packageCheck.exists && !packageCheck.error ? '✅' : '❌';
  console.log(`  ${packageStatus} package.json`);
  if (packageCheck.error) {
    console.log(`    ⚠️ ${packageCheck.error}`);
    hasErrors = true;
  }
  
  // Verificar cache do Next.js
  console.log('\n🗂️ Verificando cache:');
  const nextCacheExists = checkDirectoryExists('.next');
  console.log(`  ${nextCacheExists ? '📁' : '🆕'} .next (${nextCacheExists ? 'existe' : 'será criado no próximo build'})`);
  
  // Resumo
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ VERIFICAÇÃO FALHOU - Problemas encontrados!');
    console.log('\n💡 Soluções recomendadas:');
    console.log('  1. Execute: npm install');
    console.log('  2. Execute: npm run dev');
    console.log('  3. Verifique se todas as APIs estão implementadas');
    process.exit(1);
  } else {
    console.log('✅ VERIFICAÇÃO PASSOU - Sistema saudável!');
    console.log('\n🚀 Tudo pronto para desenvolvimento!');
  }
}

// Executar verificação se chamado diretamente
if (require.main === module) {
  runHealthCheck();
}

module.exports = { runHealthCheck };