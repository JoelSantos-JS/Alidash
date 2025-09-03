#!/usr/bin/env node

/**
 * Script para alternar entre modos de log (desenvolvimento/produção)
 * 
 * Uso:
 *   node scripts/toggle-logs.js dev    # Ativa logs (desenvolvimento)
 *   node scripts/toggle-logs.js prod   # Desativa logs (produção)
 *   node scripts/toggle-logs.js        # Mostra status atual
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function updateScripts(mode) {
  const scripts = packageJson.scripts;
  
  if (mode === 'dev') {
    scripts.dev = 'NODE_ENV=development next dev';
    scripts.build = 'NODE_ENV=production next build';
    scripts.start = 'NODE_ENV=production next start';
    console.log('✅ Modo de desenvolvimento ativado - logs serão exibidos');
  } else if (mode === 'prod') {
    scripts.dev = 'next dev';
    scripts.build = 'next build';
    scripts.start = 'next start';
    console.log('✅ Modo de produção ativado - logs serão ocultados');
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function showStatus() {
  const devScript = packageJson.scripts.dev;
  const isDevMode = devScript.includes('NODE_ENV=development');
  
  console.log('\n📊 Status dos Logs:');
  console.log(`   Modo atual: ${isDevMode ? '🟢 Desenvolvimento' : '🔴 Produção'}`);
  console.log(`   Logs: ${isDevMode ? 'Visíveis' : 'Ocultos'}`);
  console.log(`   Script dev: ${devScript}`);
  
  console.log('\n🔄 Para alternar:');
  console.log('   node scripts/toggle-logs.js dev   # Ativar logs');
  console.log('   node scripts/toggle-logs.js prod  # Ocultar logs');
}

const mode = process.argv[2];

if (mode === 'dev' || mode === 'prod') {
  updateScripts(mode);
  showStatus();
} else {
  showStatus();
} 