#!/usr/bin/env node

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Validando conteúdo do arquivo VSIX...\n');

try {
  // Encontrar arquivo VSIX mais recente
  const vsixFiles = readdirSync(projectRoot)
    .filter(file => file.endsWith('.vsix'))
    .map(file => ({
      name: file,
      path: join(projectRoot, file),
      mtime: require('fs').statSync(join(projectRoot, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (vsixFiles.length === 0) {
    console.error('❌ Nenhum arquivo VSIX encontrado!');
    process.exit(1);
  }

  const latestVsix = vsixFiles[0];
  console.log(`📦 Validando: ${latestVsix.name}\n`);

  // Usar PowerShell para listar conteúdo do VSIX (ZIP)
  const psCommand = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem;
    [System.IO.Compression.ZipFile]::OpenRead('${latestVsix.path.replace(/\\/g, '\\\\')}').Entries | 
    Where-Object { $_.FullName -match '\\.html$' } | 
    Select-Object FullName, Length | 
    ConvertTo-Json
  `;

  const result = execSync(`powershell -Command "${psCommand}"`, { 
    encoding: 'utf8',
    cwd: projectRoot 
  });

  let htmlEntries = [];
  try {
    const parsed = JSON.parse(result);
    htmlEntries = Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.log('⚠️  Nenhum arquivo HTML encontrado no VSIX');
    htmlEntries = [];
  }

  console.log('📄 Arquivos HTML no VSIX:');
  if (htmlEntries.length === 0) {
    console.error('❌ Nenhum arquivo HTML encontrado no VSIX!');
    process.exit(1);
  }

  htmlEntries.forEach(entry => {
    if (entry && entry.FullName) {
      const size = entry.Length ? (entry.Length / 1024).toFixed(1) : 'N/A';
      console.log(`   ✅ ${entry.FullName} (${size} KB)`);
    }
  });

  // Verificar caminhos esperados
  const expectedPaths = [
    'extension/dist/public/index.html',
    'extension/dist/public/extension.html'
  ];

  const actualPaths = htmlEntries.map(entry => entry.FullName).filter(Boolean);
  const missingPaths = expectedPaths.filter(path => !actualPaths.includes(path));
  const unexpectedPaths = actualPaths.filter(path => !expectedPaths.includes(path));

  if (missingPaths.length > 0) {
    console.error(`❌ Arquivos HTML obrigatórios ausentes: ${missingPaths.join(', ')}`);
  }

  if (unexpectedPaths.length > 0) {
    console.warn(`⚠️  Arquivos HTML inesperados encontrados: ${unexpectedPaths.join(', ')}`);
    console.warn('   Estes podem causar erros 404 se referenciados no manifest.');
  }

  if (missingPaths.length > 0) {
    process.exit(1);
  }

  console.log('\n✅ VSIX validado com sucesso!');
  console.log(`📊 Total de arquivos HTML: ${htmlEntries.length}`);
  console.log(`📝 Arquivo: ${latestVsix.name}\n`);

} catch (error) {
  console.error('❌ Erro durante validação do VSIX:', error.message);
  process.exit(1);
}