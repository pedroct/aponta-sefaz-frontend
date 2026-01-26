import fs from 'node:fs';
import path from 'node:path';

function moveRootVsix() {
  const root = process.cwd();
  const baseDir = path.join(root, 'extension', 'vsix');
  const stagingDir = path.join(baseDir, 'staging');
  const productionDir = path.join(baseDir, 'production');

  // Criar diretórios se não existirem
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(productionDir, { recursive: true });

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const moved = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.vsix')) continue;
    
    const source = path.join(root, entry.name);
    
    // Determinar pasta de destino baseado no nome do arquivo
    const isStaging = entry.name.includes('staging');
    const targetDir = isStaging ? stagingDir : productionDir;
    const destination = path.join(targetDir, entry.name);
    
    fs.renameSync(source, destination);
    moved.push({ name: entry.name, env: isStaging ? 'staging' : 'production' });
  }

  if (moved.length) {
    moved.forEach(({ name, env }) => {
      console.log(`✅ Moved VSIX to extension/vsix/${env}: ${name}`);
    });
  } else {
    console.log('ℹ️  No root-level VSIX files to move.');
  }
}

moveRootVsix();
