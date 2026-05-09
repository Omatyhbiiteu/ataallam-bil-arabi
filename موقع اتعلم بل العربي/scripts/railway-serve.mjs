/**
 * يقدّم مجلد dist على 0.0.0.0 ومنفذ PORT (Railway / إنتاج).
 * تشغيل serve عبر node مباشرة — بدون npx (أكثر ثباتاً على الحاويات).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '4173';
const listen = `tcp://0.0.0.0:${port}`;
const distDir = path.join(root, 'dist');
const serveCli = path.join(root, 'node_modules', 'serve', 'build', 'main.js');

if (!existsSync(serveCli)) {
  console.error('[railway-serve] لم يُعثر على حزمة serve. شغّل npm install');
  process.exit(1);
}
if (!existsSync(distDir)) {
  console.error('[railway-serve] مجلد dist غير موجود. شغّل npm run build قبل start');
  process.exit(1);
}

const child = spawn(process.execPath, [serveCli, 'dist', '-s', '-l', listen], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('[railway-serve]', err);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
