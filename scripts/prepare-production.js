/**
 * Script para preparar os arquivos da extensão para produção
 * Substitui URLs de staging por URLs de produção nos arquivos HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAGING_URL = 'staging-aponta.treit.com.br';
const PRODUCTION_URL = 'aponta.treit.com.br';

const HTML_FILES = [
    'extension/pages/apontar-dialog/index.html',
    'extension/pages/workitem/index.html',
    'extension/pages/timesheet/index.html',
    'extension/pages/atividades/index.html',
    'extension/pages/configuracao-pats/index.html'
];

function prepareForProduction() {
    console.log('🚀 Preparando arquivos para PRODUÇÃO...\n');
    
    const rootDir = path.resolve(__dirname, '..');
    let filesUpdated = 0;
    
    for (const relPath of HTML_FILES) {
        const filePath = path.join(rootDir, relPath);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Arquivo não encontrado: ${relPath}`);
            continue;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Substituir todas as ocorrências de staging por produção
        content = content.replace(new RegExp(STAGING_URL, 'g'), PRODUCTION_URL);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            const count = (originalContent.match(new RegExp(STAGING_URL, 'g')) || []).length;
            console.log(`✅ ${relPath} - ${count} substituição(ões)`);
            filesUpdated++;
        } else {
            console.log(`ℹ️  ${relPath} - sem alterações necessárias`);
        }
    }
    
    console.log(`\n✅ Preparação concluída! ${filesUpdated} arquivo(s) atualizado(s)`);
    console.log(`📦 URLs atualizadas para: https://${PRODUCTION_URL}`);
}

function prepareForStaging() {
    console.log('🧪 Preparando arquivos para STAGING...\n');
    
    const rootDir = path.resolve(__dirname, '..');
    let filesUpdated = 0;
    
    for (const relPath of HTML_FILES) {
        const filePath = path.join(rootDir, relPath);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Arquivo não encontrado: ${relPath}`);
            continue;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Substituir todas as ocorrências de produção por staging
        content = content.replace(new RegExp(PRODUCTION_URL, 'g'), STAGING_URL);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            const count = (originalContent.match(new RegExp(PRODUCTION_URL, 'g')) || []).length;
            console.log(`✅ ${relPath} - ${count} substituição(ões)`);
            filesUpdated++;
        } else {
            console.log(`ℹ️  ${relPath} - sem alterações necessárias`);
        }
    }
    
    console.log(`\n✅ Preparação concluída! ${filesUpdated} arquivo(s) atualizado(s)`);
    console.log(`🧪 URLs atualizadas para: https://${STAGING_URL}`);
}

// Processar argumento da linha de comando
const args = process.argv.slice(2);
const mode = args[0] || 'production';

if (mode === 'staging' || mode === '--staging') {
    prepareForStaging();
} else if (mode === 'production' || mode === '--production' || mode === 'prod') {
    prepareForProduction();
} else {
    console.log('Uso: node prepare-production.js [production|staging]');
    console.log('  production (padrão) - Prepara para ambiente de produção');
    console.log('  staging            - Reverte para ambiente de staging');
    process.exit(1);
}
