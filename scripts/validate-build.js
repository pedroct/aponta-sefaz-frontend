#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Validando arquivos gerados pelo build...\n');

// Verificar se o diretório dist existe
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  console.error('❌ Erro: Diretório dist não encontrado!');
  process.exit(1);
}

// Verificar se o diretório public existe
const publicDir = join(distDir, 'public');
if (!existsSync(publicDir)) {
  console.error('❌ Erro: Diretório dist/public não encontrado!');
  process.exit(1);
}

// Listar arquivos HTML
const htmlFiles = readdirSync(publicDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile() && dirent.name.endsWith('.html'))
  .map(dirent => dirent.name);

console.log('📄 Arquivos HTML encontrados:');
if (htmlFiles.length === 0) {
  console.error('❌ Nenhum arquivo HTML encontrado em dist/public/');
  process.exit(1);
} else {
  htmlFiles.forEach(file => {
    const filePath = join(publicDir, file);
    const stats = statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`   ✅ ${file} (${size} KB)`);
  });
}

// Verificar arquivos essenciais
const requiredFiles = ['index.html', 'extension.html'];
const missingFiles = requiredFiles.filter(file => !htmlFiles.includes(file));

if (missingFiles.length > 0) {
  console.error(`❌ Arquivos obrigatórios ausentes: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Verificar arquivos JavaScript/CSS
const jsFiles = readdirSync(publicDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
  .map(dirent => dirent.name);

const cssFiles = readdirSync(publicDir, { withFileTypes: true })
  .filter(dirent => dirent.isFile() && dirent.name.endsWith('.css'))
  .map(dirent => dirent.name);

console.log(`\n📦 Assets encontrados:`);
console.log(`   JS: ${jsFiles.length} arquivos`);
console.log(`   CSS: ${cssFiles.length} arquivos`);

// Verificar diretório assets
const assetsDir = join(publicDir, 'assets');
if (existsSync(assetsDir)) {
  const assetFiles = readdirSync(assetsDir);
  console.log(`   Assets: ${assetFiles.length} arquivos`);
}

console.log('\n✅ Build validado com sucesso!\n');