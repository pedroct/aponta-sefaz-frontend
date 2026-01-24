# Scripts de Validação

Este diretório contém scripts de validação automática para o processo de build e criação da extensão VSIX.

## Scripts Disponíveis

### `validate-build.js`
Valida os arquivos gerados após o `npm run build`:
- ✅ Verifica existência do diretório `dist/public/`
- ✅ Confirma presença dos arquivos HTML obrigatórios (`index.html`, `extension.html`)
- ✅ Lista arquivos JavaScript e CSS gerados
- ✅ Mostra estatísticas do build

### `validate-vsix.ps1`
Valida o conteúdo do arquivo VSIX gerado:
- ✅ Encontra o arquivo VSIX mais recente
- ✅ Lista todos os arquivos HTML incluídos no VSIX
- ✅ Verifica se os caminhos esperados estão presentes
- ✅ Identifica arquivos HTML inesperados que podem causar erros 404
- ✅ Mostra estatísticas do pacote

## Comandos NPM

### `npm run build`
- Executa `vite build`
- **Automaticamente** executa validação dos arquivos gerados

### `npm run build:extension`
- Executa build completo
- Cria arquivo VSIX
- **Automaticamente** valida conteúdo do VSIX

### `npm run create:vsix`
- Gera arquivo VSIX usando TFX CLI
- **Automaticamente** valida conteúdo do VSIX

### Validações Manuais
- `npm run validate:build` - Valida arquivos do build
- `npm run validate:vsix` - Valida conteúdo do VSIX

## Exemplo de Saída

### Build Validation:
```
🔍 Validando arquivos gerados pelo build...

📄 Arquivos HTML encontrados:
   ✅ index.html (1.1 KB)
   ✅ extension.html (6.7 KB)

📦 Assets encontrados:
   JS: 1 arquivos
   CSS: 1 arquivos
   Assets: 1 arquivos

✅ Build validado com sucesso!
```

### VSIX Validation:
```
🔍 Validando conteúdo do arquivo VSIX...

📦 Validando: sefaz-ceara.aponta-projetos-staging-1.1.54.vsix

📄 Arquivos HTML no VSIX:
   ✅ extension/dist/public/index.html (1.1 KB)
   ✅ extension/dist/public/extension.html (6.6 KB)

✅ VSIX validado com sucesso!
📊 Total de arquivos HTML: 2
📝 Arquivo: sefaz-ceara.aponta-projetos-staging-1.1.54.vsix
```

## Detecção de Problemas

Os scripts detectam automaticamente:
- 🚨 Arquivos HTML obrigatórios ausentes
- 🚨 Diretórios de build não encontrados
- ⚠️  Arquivos HTML inesperados (podem causar erro 404)
- ⚠️  Problemas de estrutura de diretórios

Em caso de erro, os scripts falham com código de saída 1, interrompendo o processo de build.