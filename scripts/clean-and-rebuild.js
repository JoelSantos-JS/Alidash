#!/usr/bin/env node

/**
 * Script de limpeza e rebuild automático
 * Resolve problemas comuns de cache e build do Next.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '🔧',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type];
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function removeDirectory(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath)) {
    try {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'inherit' });
      }
      log(`Removido: ${dirPath}`, 'success');
      return true;
    } catch (error) {
      log(`Erro ao remover ${dirPath}: ${error.message}`, 'warning');
      return false;
    }
  } else {
    log(`${dirPath} não existe`, 'info');
    return true;
  }
}

function runCommand(command, description) {
  log(`${description}...`, 'info');
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`${description} concluído`, 'success');
    return true;
  } catch (error) {
    log(`Erro em ${description}: ${error.message}`, 'error');
    return false;
  }
}

function killNodeProcesses() {
  log('Finalizando processos Node.js...', 'info');
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
    } else {
      execSync('pkill -f node', { stdio: 'pipe' });
    }
    log('Processos Node.js finalizados', 'success');
  } catch (error) {
    log('Nenhum processo Node.js encontrado ou erro ao finalizar', 'info');
  }
}

function cleanAndRebuild() {
  console.log('🧹 Iniciando limpeza e rebuild do projeto...\n');
  
  // 1. Finalizar processos Node.js
  killNodeProcesses();
  
  // 2. Remover diretórios de cache
  log('Removendo caches...', 'info');
  const cacheDirs = ['.next', 'node_modules/.cache', '.turbo'];
  cacheDirs.forEach(dir => removeDirectory(dir));
  
  // 3. Limpar cache do npm
  if (!runCommand('npm cache clean --force', 'Limpeza do cache npm')) {
    log('Falha na limpeza do cache npm, continuando...', 'warning');
  }
  
  // 4. Reinstalar dependências
  if (!runCommand('npm install', 'Reinstalação de dependências')) {
    log('Falha na instalação de dependências!', 'error');
    process.exit(1);
  }
  
  // 5. Verificar se o SWC está funcionando
  log('Verificando SWC...', 'info');
  if (process.platform === 'win32') {
    runCommand('npm install @next/swc-win32-x64-msvc --force', 'Reinstalação do SWC');
  }
  
  // 6. Build de teste (opcional)
  const shouldBuild = process.argv.includes('--build');
  if (shouldBuild) {
    if (!runCommand('npm run build', 'Build de produção')) {
      log('Falha no build de produção!', 'error');
      process.exit(1);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  log('Limpeza e rebuild concluídos com sucesso!', 'success');
  log('Execute "npm run dev" para iniciar o servidor', 'info');
  
  // 7. Executar verificação de saúde
  try {
    const healthCheck = require('./health-check.js');
    console.log('\n');
    healthCheck.runHealthCheck();
  } catch (error) {
    log('Verificação de saúde não disponível', 'warning');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  cleanAndRebuild();
}

module.exports = { cleanAndRebuild };