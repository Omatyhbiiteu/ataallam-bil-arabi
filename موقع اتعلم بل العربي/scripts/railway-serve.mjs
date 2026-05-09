/**
 * يقدّم مجلد dist على 0.0.0.0 ومنفذ PORT (Railway / إنتاج).
 * بديل أوضح من vite preview على المنصات السحابية.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '4173';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const listen = `tcp://0.0.0.0:${port}`;
const child = spawn(npx, ['serve', 'dist', '-s', '-l', listen], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
