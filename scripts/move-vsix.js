import fs from 'node:fs';
import path from 'node:path';

function moveRootVsix() {
  const root = process.cwd();
  const targetDir = path.join(root, 'extension', 'vsix');

  fs.mkdirSync(targetDir, { recursive: true });

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const moved = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.vsix')) continue;
    const source = path.join(root, entry.name);
    const destination = path.join(targetDir, entry.name);
    fs.renameSync(source, destination);
    moved.push(entry.name);
  }

  if (moved.length) {
    console.log(`Moved VSIX to extension/vsix: ${moved.join(', ')}`);
  } else {
    console.log('No root-level VSIX files to move.');
  }
}

moveRootVsix();
