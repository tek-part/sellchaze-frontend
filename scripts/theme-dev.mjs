import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = path.join(root, 'src', 'apps', 'storefront', 'themes');
const requested = process.argv.find((argument) => argument.startsWith('--theme='))?.split('=')[1]
  || process.argv[2]
  || 'luxury-fashion';
const themes = (await readdir(themesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (!themes.includes(requested)) {
  process.stderr.write(`Unknown theme "${requested}". Available: ${themes.join(', ')}\n`);
  process.exit(2);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const previewPath = `/?preview=1&theme=${encodeURIComponent(requested)}`;
process.stdout.write(`Starting ${requested} with Vite hot reload at ${previewPath}\n`);
const child = spawn(npm, ['exec', 'vite', '--', '--open', previewPath], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
